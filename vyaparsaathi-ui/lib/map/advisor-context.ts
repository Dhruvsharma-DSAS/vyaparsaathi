import "server-only";
import { prisma } from "../db";
import type { City } from "../types";
import { BUSINESS_GROUPS, compareCells } from "./groups";

const cityNames: Record<City, RegExp> = {
  Bengaluru: /\b(?:bengaluru|bangalore)\b|बेंगलुरु|बेंगलूरु|बंगळूर|बंगळुरू|બેંગલુરુ|বেঙ্গালুরু|ಬೆಂಗಳೂರು/iu,
  Pune: /\bpune\b|पुणे|पुण्य|પુણે|পুনে|ಪುಣೆ/iu,
};

type ChatInput = {
  message?: unknown;
  chat_history?: Array<{ role?: string; text?: unknown }>;
  state?: {
    user_profile?: { city?: unknown };
    business_context?: { business_name?: unknown; category?: unknown; candidate_zones?: unknown };
  };
};

const topicGroups = [
  { group: "food", pattern: /\b(food|meal|restaurant|momos?|tiffin|vada pav|snacks?)\b|खाना|जेवण|જમવાનું|খাবার/iu },
  { group: "drinks", pattern: /\b(tea|chai|caf[eé]s?|coffee|juice|drinks?)\b|चाय|चहा|ચા|চা/iu },
  { group: "tailoring", pattern: /\b(tailors?|tailoring|silai|stitching)\b|सिलाई|शिवण/iu },
  { group: "repair", pattern: /\b(phone repair|mobile repair|electronics)\b/iu },
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

function includesPhrase(text: string, phrase: string) {
  const normalized = normalize(phrase);
  return normalized.length >= 2 && ` ${text} `.includes(` ${normalized} `);
}

function citiesMentioned(message: string) {
  return (Object.keys(cityNames) as City[]).filter((city) => cityNames[city].test(message));
}

async function cityEvidence(city: City, question: string, business: string, zones: string[]) {
  const [categoryCounts, latest, wardNames, markets, areas] = await Promise.all([
    prisma.place.groupBy({
      by: ["category"], where: { city }, _count: { _all: true }, orderBy: { _count: { category: "desc" } },
    }),
    prisma.place.findFirst({ where: { city }, orderBy: { retrievedAt: "desc" }, select: { retrievedAt: true } }),
    prisma.ward.findMany({ where: { city }, select: { id: true, name: true } }),
    prisma.supplyMarket.findMany({ where: { city: { name: city } }, select: { name: true }, orderBy: { name: "asc" }, take: 8 }),
    prisma.area.findMany({
      where: { city: { name: city } },
      select: { name: true, samples: { select: { category: true, confidence: true, supplyDistanceKm: true, supplyMarket: { select: { name: true } } } } },
      orderBy: { name: "asc" }, take: 24,
    }),
  ]);
  const normalized = normalize(question);
  const matchingCategories = (topic: string) => {
    const matchingTags = BUSINESS_GROUPS.filter((group) =>
      topicGroups.some((rule) => rule.group === group.id && rule.pattern.test(topic)) ||
      group.tags.some((tag) => includesPhrase(topic, tag))).flatMap((group) => group.tags);
    return categoryCounts.filter(({ category }) => matchingTags.includes(category) || includesPhrase(topic, category));
  };
  const questionCategories = matchingCategories(normalized);
  const categoryMatches = questionCategories.length ? questionCategories : matchingCategories(normalize(business));
  const tags = categoryMatches.slice(0, 12).map(({ category }) => category);
  const matchingWards = wardNames.filter(({ name }) =>
    includesPhrase(normalized, name) || zones.some((zone) => includesPhrase(normalize(name), zone) || includesPhrase(normalize(zone), name)),
  ).slice(0, 6);
  const [wardStats, stations, mandi, events, densityCells, weather, news] = await Promise.all([
    matchingWards.length || tags.length ? prisma.wardCategoryStat.findMany({
      where: {
        ward: { city },
        ...(matchingWards.length ? { wardId: { in: matchingWards.map(({ id }) => id) } } : {}),
        ...(tags.length ? { category: { in: tags } } : {}),
        ...(!matchingWards.length ? { gap: { gt: 0 } } : {}),
      },
      select: { category: true, count: true, per10k: true, gap: true, ward: { select: { name: true, population: true, confidence: true } } },
      orderBy: matchingWards.length ? [{ wardId: "asc" }, { count: "desc" }] : [{ gap: "desc" }, { wardId: "asc" }],
      take: 12,
    }) : [],
    /\b(rush|busy|station|metro|commut|footfall|hour)/iu.test(question) ? prisma.rushStation.findMany({
      where: { city }, select: { name: true, source: true, weekday: true, weekend: true },
      orderBy: { name: "asc" }, take: 25,
    }) : [],
    /\b(mandi|wholesale|supplier|commodity|ingredient|prices?)\b|मंडी|बाज़ार/iu.test(question) ? prisma.mandiPrice.findMany({
      where: { city }, select: { commodity: true, date: true, pricePerKg: true, sample: true }, orderBy: { date: "desc" }, take: 30,
    }) : [],
    /\b(festival|season|event|holiday)/iu.test(question) ? prisma.cityEvent.findMany({
      where: { city: { in: [city, "Both"] } }, select: { name: true, month: true, effect: true }, orderBy: { month: "asc" }, take: 12,
    }) : [],
    tags.length && /\b(opportunit\w*|competit\w*|where|compare|areas?|neighbou?rhoods?|locations?|gaps?)\b|इलाक|भाग|कहाँ|कुठे/iu.test(question)
      ? prisma.densityCell.findMany({
        where: { city }, select: { lat: true, lng: true, landmarkName: true, count: true, categories: true },
      })
      : [],
    /\b(weather|rain|temperature|humidity)\b|मौसम|बारिश|पाऊस|हवामान/iu.test(question) ? prisma.weatherHour.findFirst({
      where: { city }, orderBy: { timestampLocal: "desc" },
      select: { timestampLocal: true, timezone: true, temperatureC: true, precipitationMm: true, sourceUrl: true },
    }) : null,
    /\b(news|headlines?)\b|खबर|बातम्या/iu.test(question) ? prisma.newsDigest.findFirst({
      where: { city }, orderBy: { date: "desc" },
      select: {
        date: true, sample: true, summary: true, items: { select: { title: true, tag: true }, take: 5 },
      },
    }) : null,
  ]);
  const citywidePlaceExamples = !matchingWards.length && tags.length ? await prisma.place.findMany({
    where: { city, name: { not: null }, category: { in: tags } },
    select: { name: true, category: true, openingHours: true, sourceUrl: true },
    orderBy: { id: "asc" }, take: 4,
  }) : [];
  const relevantAreas = areas.filter(({ name }) => includesPhrase(normalized, name) || zones.some((zone) => normalize(zone) === normalize(name)));
  return {
    city,
    mapSource: "OpenStreetMap snapshot, ODbL-1.0 © OpenStreetMap contributors",
    retrievedAt: latest?.retrievedAt.toISOString() ?? null,
    mappedPlaces: latest ? categoryCounts.reduce((sum, category) => sum + category._count._all, 0) : null,
    categories: (categoryMatches.length ? categoryMatches : categoryCounts).slice(0, 12)
      .map(({ category, _count }) => ({ category, mapped: _count._all })),
    categoryScope: categoryMatches.length ? "matching categories" : "most mapped categories",
    wardStats,
    citywidePlaceExamples,
    lowCompetitionMapCells: matchingWards.length ? [] : compareCells(densityCells.map((cell) => ({
      ...cell, landmark: cell.landmarkName, categories: (cell.categories ?? {}) as Record<string, number>,
    })), tags).slice(0, 4).map(({ lat, lng, landmark, count, peers, anchors }) => ({
      lat, lng, landmark, mappedPlaces: count, mappedCategoryPeers: peers, mappedAnchors: anchors,
    })),
    sampleAreas: (relevantAreas.length ? relevantAreas : areas)
      .slice(0, 5).map((area) => ({ ...area, samples: area.samples.slice(0, 3) })),
    supplyMarkets: markets,
    rushStations: stations.filter(({ name }) => includesPhrase(normalized, name)).concat(stations)
      .filter(({ name }, index, all) => all.findIndex((station) => station.name === name) === index)
      .slice(0, 3).map(({ name, source, weekday, weekend }) => ({
        name, source, weekdayPeak: peakHour(weekday), weekendPeak: peakHour(weekend),
      })),
    mandiPrices: mandi.sort((a, b) => Number(includesPhrase(normalized, b.commodity)) - Number(includesPhrase(normalized, a.commodity))).slice(0, 8),
    seasonalEvents: events,
    historicalWeatherObservation: weather,
    latestSavedNewsDigest: news,
  };
}

function peakHour(curve: unknown) {
  return Array.isArray(curve) && curve.length === 24 ? curve.indexOf(Math.max(...curve)) : null;
}

export async function getAdvisorCityContext(input: ChatInput) {
  if (typeof input.message !== "string" || input.message.length > 3000) return undefined;
  const savedCity = input.state?.user_profile?.city === "Pune" ? "Pune" : "Bengaluru";
  const business = input.state?.business_context;
  const recent = Array.isArray(input.chat_history) ? input.chat_history.slice(-6).reverse() : [];
  const lastCityQuestion = recent.find((item) =>
    item?.role === "user" && typeof item.text === "string" && citiesMentioned(item.text).length);
  const mentioned = citiesMentioned(input.message);
  const both = /\b(?:both|compare the two) (?:cities|markets)\b|दोनों शहर|दोन्ही शहर/iu.test(input.message);
  const fallbackCities = citiesMentioned(typeof lastCityQuestion?.text === "string" ? lastCityQuestion.text : "");
  const cities: City[] = both ? ["Bengaluru", "Pune"]
    : mentioned.length ? mentioned
      : /\b(there|that city|same city)\b|वहाँ|तिथे/iu.test(input.message) && fallbackCities.length ? fallbackCities : [savedCity];
  const zones = Array.isArray(business?.candidate_zones)
    ? business.candidate_zones.filter((item): item is string => typeof item === "string").slice(0, 6)
    : [];
  const category = [business?.business_name, business?.category].filter((item) => typeof item === "string").join(" ");
  const results = await Promise.allSettled(cities.map((city) =>
    cityEvidence(city, input.message as string, category, city === savedCity ? zones : [])));
  const snapshots = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  return { snapshots, unavailableCities: cities.filter((_, index) => results[index].status === "rejected") };
}

import type { City } from "../types";

/**
 * Source rows for the map database. They mirror the backend's
 * city_market_sample.json and add approximate coordinates for each pin.
 * The API route also serves these directly if the database is not set up.
 */

export type SeedCity = {
  name: City;
  center: [number, number];
  zoom: number;
  areas: Array<{ name: string; lat: number; lng: number }>;
  supplyMarkets: Array<{ name: string; lat: number; lng: number }>;
  samples: Array<{
    area: string;
    category: string;
    placesFound: number;
    population: number;
    cityMedianPlacesPer10000: number;
    supplyMarket: string | null;
    supplyDistanceKm: number | null;
    confidence: string;
  }>;
};

export const seedCities: SeedCity[] = [
  {
    name: "Bengaluru",
    center: [12.945, 77.625],
    zoom: 13,
    areas: [
      { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
      { name: "Ejipura", lat: 12.9387, lng: 77.6271 },
      { name: "Domlur", lat: 12.9609, lng: 77.6387 },
      { name: "Jakkasandra", lat: 12.9226, lng: 77.6386 },
      { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
    ],
    supplyMarkets: [{ name: "KR Market", lat: 12.9634, lng: 77.5774 }],
    samples: [
      {
        area: "BTM Layout",
        category: "fast_food",
        placesFound: 7,
        population: 16080,
        cityMedianPlacesPer10000: 5.42,
        supplyMarket: "KR Market",
        supplyDistanceKm: 6.8,
        confidence: "Sample data",
      },
    ],
  },
  {
    name: "Pune",
    center: [18.546, 73.897],
    zoom: 13,
    areas: [
      { name: "Nagar Road", lat: 18.5545, lng: 73.9128 },
      { name: "Yerawada", lat: 18.5534, lng: 73.8889 },
      { name: "Dhole Patil Road", lat: 18.5367, lng: 73.8826 },
    ],
    supplyMarkets: [{ name: "Market Yard (Gultekdi)", lat: 18.4866, lng: 73.8636 }],
    samples: [],
  },
];

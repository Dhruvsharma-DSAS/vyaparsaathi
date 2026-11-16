"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardTitle, Icon, Loading, Notice, Pill, StatGrid } from "@/components/ui";
import { mapLayers, type MapLayerId } from "@/lib/config";
import { gapColours, type GapLabel } from "@/lib/map/gap";
import { BUSINESS_GROUPS, categoryLabel, compareCells, tagsForFilter } from "@/lib/map/groups";
import type { MapPayload, MapPlace } from "@/lib/map/types";
import { useApp } from "@/state/AppProvider";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-surface-2" /> });

const legend: Array<GapLabel | "none"> = ["big gap", "some gap", "normal", "crowded", "none"];

type PlacesResponse = { places: MapPlace[]; inView: number; cityTotal: number; shown: number };
const nf = (value: number) => value.toLocaleString("en-IN");

export function MapPanel() {
  const { copy, vyaparState } = useApp();
  const { t, x } = copy;
  const city = vyaparState.user_profile.city;
  const [result, setResult] = useState<{ city: string; data: MapPayload | null; error: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<MapLayerId, boolean>>(
    () => Object.fromEntries(mapLayers.map((layer) => [layer.id, layer.defaultOn])) as Record<MapLayerId, boolean>,
  );
  const [placeFilter, setPlaceFilter] = useState("");
  const [placeResult, setPlaceResult] = useState<({ key: string } & PlacesResponse) | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/map?city=${encodeURIComponent(city)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: MapPayload) => { if (active) setResult({ city, data: payload, error: "" }); })
      .catch(() => { if (active) setResult({ city, data: null, error: t.connection }); });
    return () => { active = false; };
  }, [city, t.connection]);

  const current = result?.city === city ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? "";

  // Places inside the visible map area, for the chosen filter ("" = every place).
  const [bbox, setBbox] = useState("");
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: string } | null>(null);
  const placeKey = `${city}|${placeFilter}|${bbox}`;
  useEffect(() => {
    if (!layers.places || !bbox) return;
    let active = true;
    const query = new URLSearchParams({ city, filter: placeFilter, bbox, limit: "1500" });
    fetch(`/api/places?${query}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: PlacesResponse) => { if (active) setPlaceResult({ key: placeKey, ...payload }); })
      .catch(() => { if (active) setPlaceResult({ key: placeKey, places: [], inView: 0, cityTotal: 0, shown: 0 }); });
    return () => { active = false; };
  }, [layers.places, city, placeFilter, bbox, placeKey]);
  const placeData = layers.places && placeResult?.key === placeKey ? placeResult : null;
  // Keep the last pins on screen while the next area loads, so panning doesn't flicker.
  const places = layers.places && placeResult?.key.startsWith(`${city}|${placeFilter}|`) ? placeResult.places : [];

  const analyserFilter = placeFilter || "group:food";
  const analyserTags = tagsForFilter(analyserFilter) ?? [];
  const analyserLabel = placeFilter.startsWith("group:") || !placeFilter
    ? BUSINESS_GROUPS.find((group) => `group:${group.id}` === analyserFilter)?.label ?? ""
    : categoryLabel(placeFilter);
  const opportunities = useMemo(
    // Busy squares only (30+ mapped places), so "few of this type" means a real gap, not an empty field.
    () => (data ? compareCells(data.density, analyserTags, 30).slice(0, 6) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- analyserTags is derived from analyserFilter
    [data, analyserFilter],
  );
  const onViewChange = useCallback((next: string) => setBbox(next), []);
  const filterTotal = placeFilter && data
    ? data.placeCategories.filter((item) => (tagsForFilter(placeFilter) ?? []).includes(item.category)).reduce((sum, item) => sum + item.count, 0)
    : data?.totalPlaces ?? 0;
  const groupCount = (tags: string[]) => data?.placeCategories.filter((item) => tags.includes(item.category)).reduce((sum, item) => sum + item.count, 0) ?? 0;

  const labels = useMemo(() => ({ sample: x.mapSample, noSample: x.mapNoSample, supply: "Supply" }), [x.mapSample, x.mapNoSample]);
  const onSelect = useCallback((area: string) => setSelected(area), []);
  const selectedArea = data?.areas.find((area) => area.name === selected);
  const selectedSample = selectedArea?.samples[0];

  return (
    <>
      <Card className="p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon name="map" className="text-accent" />{x.mapTitle} · {city}</h2>
          {data && <Pill tone={data.source === "database" ? "ok" : "accent"}>{data.source === "database" ? "Prisma DB" : "Seed data"}</Pill>}
        </div>
        {error && <Notice tone="bad">{error}</Notice>}
        {!data && !error && <Loading label={t.weatherLoading} />}
        <div className="mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {mapLayers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              aria-pressed={layers[layer.id]}
              onClick={() => setLayers((previous) => ({ ...previous, [layer.id]: !previous[layer.id] }))}
              className={clsx(
                "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                layers[layer.id] ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-muted",
              )}
            >
              <Icon name={layer.icon} className="text-[16px]" />{layer.label}
            </button>
          ))}
        </div>
        {layers.places && data && data.placeCategories.length > 0 && (
          <div className="mb-3 space-y-2 px-1">
            <select
              aria-label="Which places to show"
              value={placeFilter}
              onChange={(event) => setPlaceFilter(event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
            >
              <option value="">All places ({nf(data.totalPlaces)})</option>
              <optgroup label="Business groups">
                {BUSINESS_GROUPS.map((group) => <option key={group.id} value={`group:${group.id}`}>{group.label} ({nf(groupCount(group.tags))})</option>)}
              </optgroup>
              <optgroup label="Single category">
                {data.placeCategories.map((item) => <option key={item.category} value={item.category}>{categoryLabel(item.category)} ({nf(item.count)})</option>)}
              </optgroup>
            </select>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted" role="status">
              <span className="font-bold text-ink">{nf(filterTotal)}</span> mapped in {city}
              <span aria-hidden="true">·</span>
              {placeData ? <><span className="font-bold text-ink">{nf(placeData.inView)}</span> in this view{placeData.inView > placeData.shown && <> · showing {nf(placeData.shown)} (zoom in for all)</>}</> : t.weatherLoading}
            </p>
          </div>
        )}
        {data && <LeafletMap data={data} layers={layers} places={places} selected={selected} onSelect={onSelect} labels={labels} onViewChange={onViewChange} focus={focus} />}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-muted">
          {legend.map((label) => (
            <li key={label} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full ring-2 ring-surface" style={{ background: gapColours[label] }} />
              {label === "none" ? x.mapNoSample : label}
            </li>
          ))}
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-dashed border-ink bg-accent" />Supply market</li>
        </ul>
        {layers.places && (
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted" aria-label="Place colours">
            {BUSINESS_GROUPS.map((group) => (
              <li key={group.id} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: group.colour }} />{group.label}</li>
            ))}
            <li className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo" />Schools, hospitals, stations, offices</li>
          </ul>
        )}
        <p className="mt-3 px-1 text-xs leading-relaxed text-muted">{x.mapNote}</p>
        {data?.snapshotDate && (
          <p className="mt-1 px-1 text-[11px] text-muted">
            © OpenStreetMap contributors (ODbL) · snapshot {new Date(data.snapshotDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · mapped places are not sales or footfall
          </p>
        )}
      </Card>

      {data && opportunities.length > 0 && (
        <Card>
          <CardTitle
            icon="travel_explore"
            title="Opportunity areas"
            sub={`Busy ~1 km squares with the fewest ${analyserLabel.toLowerCase()} mapped. Schools, hospitals, offices and stations nearby bring daily footfall. A hint to check on the ground, not proof of demand.`}
          />
          <ol className="space-y-2">
            {opportunities.map((cell, index) => (
              <li key={`${cell.lat},${cell.lng}`}>
                <button
                  type="button"
                  onClick={() => setFocus({ lat: cell.lat, lng: cell.lng, key: `${cell.lat},${cell.lng},${Date.now()}` })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line/70 px-3 py-2.5 text-left transition hover:border-accent/60 hover:bg-accent-soft/40"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-sm font-extrabold text-accent">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{cell.landmark ? `Near ${cell.landmark}` : `${cell.lat.toFixed(3)}, ${cell.lng.toFixed(3)}`}</span>
                    <span className="block text-[11px] text-muted">
                      {nf(cell.peers)} {analyserLabel.toLowerCase()} of {nf(cell.count)} places ({(cell.share * 100).toFixed(1)}%) · {nf(cell.anchors)} anchors
                    </span>
                  </span>
                  <Icon name="my_location" className="text-[20px] text-accent" />
                </button>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardTitle icon="list" title={t.chooseCity} />
            <ul className="space-y-2">
              {data.areas.map((area) => (
                <li key={area.name}>
                  <button
                    type="button"
                    onClick={() => setSelected(area.name)}
                    aria-pressed={selected === area.name}
                    className={clsx(
                      "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm transition",
                      selected === area.name ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50",
                    )}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: gapColours[area.samples[0]?.label ?? "none"] }} />
                      {area.name}
                    </span>
                    <span className="text-xs text-muted">{area.samples.length ? area.samples[0].label : x.mapNoSample}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card ruled>
            {selectedArea && selectedSample ? (
              <>
                <CardTitle icon="analytics" title={selectedArea.name} sub={`${selectedSample.confidence} · ${selectedSample.category}`} aside={<Pill tone="ok">{selectedSample.label}</Pill>} />
                <StatGrid stats={[
                  { label: t.placesFound, value: selectedSample.placesFound },
                  { label: t.population, value: selectedSample.population.toLocaleString("en-IN") },
                  { label: t.placesPerTenThousand, value: selectedSample.placesPer10000, tone: "accent" },
                  { label: t.cityMedian, value: selectedSample.cityMedianPlacesPer10000 },
                  ...(selectedSample.supplyMarket ? [{ label: "Supply market", value: `${selectedSample.supplyMarket} · ${selectedSample.supplyDistanceKm ?? "—"} km`, wide: true }] : []),
                ]} />
                <p className="mt-4 text-sm text-muted">{t.verifyGround}</p>
              </>
            ) : (
              <div className="grid h-full min-h-40 place-items-center text-center text-sm text-muted">
                <p><Icon name="touch_app" className="mb-2 block text-3xl text-accent" />{selectedArea ? t.noCategorySample : x.mapNote}</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardTitle, Icon, Loading, Notice, Pill, StatGrid } from "@/components/ui";
import { mapLayers, type MapLayerId } from "@/lib/config";
import { gapColours, type GapLabel } from "@/lib/map/gap";
import type { MapPayload, MapPlace } from "@/lib/map/types";
import { useApp } from "@/state/AppProvider";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-surface-2" /> });

const legend: Array<GapLabel | "none"> = ["big gap", "some gap", "normal", "crowded", "none"];

export function MapPanel() {
  const { copy, vyaparState } = useApp();
  const { t, x } = copy;
  const city = vyaparState.user_profile.city;
  const [result, setResult] = useState<{ city: string; data: MapPayload | null; error: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<MapLayerId, boolean>>(
    () => Object.fromEntries(mapLayers.map((layer) => [layer.id, layer.defaultOn])) as Record<MapLayerId, boolean>,
  );
  const [placeCategory, setPlaceCategory] = useState("");
  const [placeResult, setPlaceResult] = useState<{ key: string; places: MapPlace[]; total: number } | null>(null);

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

  const chosenCategory = placeCategory || data?.placeCategories[0]?.category || "";
  const placeKey = `${city}|${chosenCategory}`;
  useEffect(() => {
    if (!layers.places || !chosenCategory) return;
    let active = true;
    fetch(`/api/places?city=${encodeURIComponent(city)}&category=${encodeURIComponent(chosenCategory)}&limit=600`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload: { places: MapPlace[]; total: number }) => { if (active) setPlaceResult({ key: placeKey, ...payload }); })
      .catch(() => { if (active) setPlaceResult({ key: placeKey, places: [], total: 0 }); });
    return () => { active = false; };
  }, [layers.places, city, chosenCategory, placeKey]);
  const places = layers.places && placeResult?.key === placeKey ? placeResult.places : [];

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
          <div className="mb-3 flex items-center gap-2 px-1 text-xs">
            <select
              aria-label="Place category"
              value={chosenCategory}
              onChange={(event) => setPlaceCategory(event.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1.5"
            >
              {data.placeCategories.map((item) => <option key={item.category} value={item.category}>{item.category} ({item.count})</option>)}
            </select>
            <span className="text-muted">{placeResult?.key === placeKey ? `${placeResult.places.length} of ${placeResult.total} shown · © OpenStreetMap (ODbL)` : t.weatherLoading}</span>
          </div>
        )}
        {data && <LeafletMap data={data} layers={layers} places={places} selected={selected} onSelect={onSelect} labels={labels} />}
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-muted">
          {legend.map((label) => (
            <li key={label} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full ring-2 ring-surface" style={{ background: gapColours[label] }} />
              {label === "none" ? x.mapNoSample : label}
            </li>
          ))}
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-dashed border-ink bg-accent" />Supply market</li>
        </ul>
        <p className="mt-3 px-1 text-xs leading-relaxed text-muted">{x.mapNote}</p>
      </Card>

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

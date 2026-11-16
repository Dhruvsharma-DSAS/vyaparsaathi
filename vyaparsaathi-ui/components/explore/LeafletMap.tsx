"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { MapLayerId } from "@/lib/config";
import { gapColours } from "@/lib/map/gap";
import type { MapPayload, MapPlace } from "@/lib/map/types";

type Props = {
  data: MapPayload;
  layers: Record<MapLayerId, boolean>;
  places: MapPlace[];
  selected: string | null;
  onSelect: (area: string) => void;
  labels: { sample: string; noSample: string; supply: string };
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;
const drawOrder: MapLayerId[] = ["wards", "density", "places", "stations", "areas"];

/** Plain Leaflet on OpenStreetMap tiles. Each layer is redrawn from the Prisma-backed payload. */
export default function LeafletMap({ data, layers, places, selected, onSelect, labels }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupsRef = useRef<Record<MapLayerId, L.LayerGroup> | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const fittedCity = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false, preferCanvas: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    groupsRef.current = { wards: L.layerGroup(), density: L.layerGroup(), places: L.layerGroup(), stations: L.layerGroup(), areas: L.layerGroup() };
    return () => {
      map.remove();
      mapRef.current = null;
      groupsRef.current = null;
      fittedCity.current = null; // a new map instance needs its view set again
    };
  }, []);

  // Rebuild layer contents when the city data changes.
  useEffect(() => {
    const map = mapRef.current;
    const groups = groupsRef.current;
    if (!map || !groups) return;
    Object.values(groups).forEach((group) => group.clearLayers());
    markersRef.current.clear();

    data.wards.forEach((ward) => {
      if (!ward.geometry) return;
      L.geoJSON(ward.geometry as GeoJSON.GeoJsonObject, {
        style: {
          color: "#15803d", weight: 1,
          fillColor: ward.topGap ? "#4ade80" : "#94a3b8",
          fillOpacity: ward.topGap ? Math.min(0.08 + ward.topGap.gap * 0.35, 0.4) : 0.05,
        },
      })
        .bindTooltip(`${escapeHtml(ward.name)} · ${ward.population.toLocaleString("en-IN")}${ward.topGap ? ` · gap: ${escapeHtml(ward.topGap.category)}` : ""}`, { sticky: true })
        .addTo(groups.wards);
    });

    const maxCount = Math.max(1, ...data.density.map((cell) => cell.count));
    data.density.forEach((cell) => {
      const share = cell.count / maxCount;
      L.circleMarker([cell.lat, cell.lng], { radius: 3 + share * 11, stroke: false, fillColor: "#15803d", fillOpacity: 0.12 + share * 0.45 })
        .bindTooltip(`${cell.count} places${cell.landmark ? ` · near ${escapeHtml(cell.landmark)}` : ""}`)
        .addTo(groups.density);
    });

    data.stations.forEach((station) => {
      L.circleMarker([station.lat, station.lng], { radius: 9, color: "#fff", weight: 2, fillColor: "#0f5e57", fillOpacity: 0.95 })
        .bindTooltip(`${escapeHtml(station.name)} · peak ${hour(station.peakHour)} (${station.peakValue}/100)`, { direction: "top" })
        .addTo(groups.stations);
    });

    data.areas.forEach((area) => {
      const sample = area.samples[0];
      const marker = L.circleMarker([area.lat, area.lng], {
        radius: sample ? 13 : 9, color: "#fff", weight: 2, fillColor: gapColours[sample?.label ?? "none"], fillOpacity: 0.95,
      })
        .bindTooltip(area.name, { direction: "top", offset: [0, -10] })
        .bindPopup(`<strong>${escapeHtml(area.name)}</strong><br/>${escapeHtml(sample ? `${labels.sample}: ${sample.label}` : labels.noSample)}`)
        .on("click", () => onSelect(area.name))
        .addTo(groups.areas);
      markersRef.current.set(area.name, marker);
    });
    data.supplyMarkets.forEach((market) => {
      L.circleMarker([market.lat, market.lng], { radius: 8, color: "#142019", weight: 2, fillColor: "#4ade80", fillOpacity: 1, dashArray: "3 3" })
        .bindTooltip(`${labels.supply}: ${escapeHtml(market.name)}`, { direction: "top" })
        .addTo(groups.areas);
    });

    if (fittedCity.current !== data.city) {
      fittedCity.current = data.city;
      const points = [...data.areas, ...data.supplyMarkets].map((point) => L.latLng(point.lat, point.lng));
      if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
      else map.setView(data.center, data.zoom);
    }
  }, [data, labels, onSelect]);

  useEffect(() => {
    const group = groupsRef.current?.places;
    if (!group) return;
    group.clearLayers();
    places.forEach((place) => {
      L.circleMarker([place.lat, place.lng], { radius: 4, color: "#fff", weight: 1, fillColor: "#d97706", fillOpacity: 0.9 })
        .bindTooltip(escapeHtml(place.name ?? place.category))
        .addTo(group);
    });
  }, [places]);

  // Show or hide each group; re-adding in draw order keeps pins above polygons.
  useEffect(() => {
    const map = mapRef.current;
    const groups = groupsRef.current;
    if (!map || !groups) return;
    drawOrder.forEach((id) => {
      groups[id].remove();
      if (layers[id]) groups[id].addTo(map);
    });
  }, [layers, data, places]);

  useEffect(() => {
    markersRef.current.forEach((marker, name) => marker.setStyle({ weight: name === selected ? 5 : 2, color: name === selected ? "#142019" : "#fff" }));
    if (selected) markersRef.current.get(selected)?.openPopup();
  }, [selected, data]);

  return <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-2xl" aria-label="Area map" role="region" />;
}

import type { City } from "../types";
import type { GapLabel } from "./gap";

export type MapSample = {
  category: string;
  placesFound: number;
  population: number;
  cityMedianPlacesPer10000: number;
  placesPer10000: number;
  gapFraction: number;
  label: GapLabel;
  supplyMarket: string | null;
  supplyDistanceKm: number | null;
  confidence: string;
};

export type MapArea = { name: string; lat: number; lng: number; approximate: boolean; samples: MapSample[] };

export type MapWard = {
  id: string;
  name: string;
  population: number;
  geometry: GeoJSON.Geometry | null;
  /** Category with the largest gap against the city median, if any. */
  topGap: { category: string; gap: number } | null;
};

export type MapDensityCell = { lat: number; lng: number; count: number; landmark: string | null };

export type MapStation = { name: string; lat: number; lng: number; kind: string; peakHour: number; peakValue: number };

export type MapPlace = { id: string; name: string | null; category: string; lat: number; lng: number };

export type MapPayload = {
  city: City;
  center: [number, number];
  zoom: number;
  areas: MapArea[];
  supplyMarkets: Array<{ name: string; lat: number; lng: number }>;
  wards: MapWard[];
  density: MapDensityCell[];
  stations: MapStation[];
  placeCategories: Array<{ category: string; count: number }>;
  source: "database" | "seed-fallback";
};

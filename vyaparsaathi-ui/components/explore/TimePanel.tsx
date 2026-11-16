"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Button, Card, CardTitle, Loading, Notice, Pill } from "@/components/ui";
import type { useMarketData } from "@/hooks/useMarketData";
import { api } from "@/lib/api";
import { hourLabel } from "@/lib/format";
import type { RushResult, WeatherResult } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

type Props = { market: ReturnType<typeof useMarketData> };

export function TimePanel({ market }: Props) {
  const { copy, vyaparState } = useApp();
  const { t } = copy;
  const rushSample = market.data?.rush_samples[0];
  const workingHours = vyaparState.user_profile.working_hours;
  const [rushState, setRushState] = useState<{ key: string; result: RushResult | null; error: string } | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const rushKey = rushSample ? `${rushSample.station}|${workingHours ?? rushSample.working_hours}` : "";

  useEffect(() => {
    if (!rushSample) return;
    let active = true;
    api.rushClock(rushSample.hourly_rush_index, workingHours ?? rushSample.working_hours)
      .then((result) => { if (active) setRushState({ key: rushKey, result, error: "" }); })
      .catch(() => { if (active) setRushState({ key: rushKey, result: null, error: t.noCategorySample }); });
    return () => { active = false; };
  }, [rushSample, rushKey, workingHours, t.noCategorySample]);

  const rush = rushState?.key === rushKey ? rushState.result : null;
  const rushError = rushState?.key === rushKey ? rushState.error : "";

  const requestWeather = () => {
    setWeatherError("");
    setWeather(null);
    if (!navigator.geolocation) return setWeatherError(t.weatherError);
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setWeather(await api.weather(coords.latitude, coords.longitude));
        } catch {
          setWeatherError(t.weatherError);
        } finally {
          setWeatherLoading(false);
        }
      },
      () => { setWeatherError(t.weatherError); setWeatherLoading(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 },
    );
  };

  const hour = new Date().getHours();
  const upcoming = weather?.hourly.slice(hour, hour + 6) ?? [];
  const alert = upcoming.find((forecast) => forecast.advice !== "normal");
  const advice = alert?.advice === "rain" ? t.rainAdvice : alert?.advice === "heat" ? t.heatAdvice : t.normalAdvice;
  const inWindow = (h: number) => rush !== null && h >= rush.best_start_hour && h < rush.best_end_hour;

  return (
    <>
      {market.loading && <Loading label={t.weatherLoading} />}
      {market.error && <Notice tone="bad">{market.error}</Notice>}
      {rushSample && (
        <Card ruled>
          <CardTitle icon="schedule" title={`${t.timeTitle} · ${rushSample.station}`} sub={rushSample.day_type} aside={<Pill>{rushSample.confidence}</Pill>} />
          <div className="flex h-40 items-end gap-3">
            {Object.entries(rushSample.hourly_rush_index).map(([h, value]) => (
              <div key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold tabular-nums">{value}</span>
                <div
                  className={clsx("w-full rounded-t-xl transition-all", inWindow(Number(h)) ? "bg-accent" : "bg-indigo/40")}
                  style={{ height: `${Math.max(value, 6)}%` }}
                  aria-label={`${hourLabel(h)} ${value}`}
                />
                <span className="text-[11px] text-muted">{hourLabel(h)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-accent-soft p-4">
            <p className="text-xs text-muted">{t.bestWindow}</p>
            <p className="mt-1 text-xl font-semibold">
              {rush ? `${hourLabel(rush.best_start_hour)}–${hourLabel(rush.best_end_hour)} · ${rush.average_rush_index}/100` : rushError || "…"}
            </p>
          </div>
        </Card>
      )}
      {market.data && !rushSample && <Notice tone="info">{t.noCategorySample}</Notice>}

      <div className="grid gap-5">
        <Card>
          <CardTitle icon="partly_cloudy_day" title={t.weatherTitle} sub={t.weatherLocation} />
          <Button onClick={requestWeather} disabled={weatherLoading} icon="my_location">{weatherLoading ? t.weatherLoading : t.weatherButton}</Button>
          {weatherError && <Notice tone="bad" className="mt-3">{weatherError}</Notice>}
          {weather && (
            <>
              <Notice tone={alert ? "warn" : "ok"} className="mt-4 text-sm">{advice}</Notice>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {upcoming.slice(0, 6).map((forecast) => (
                  <li key={forecast.time} className="rounded-2xl bg-surface-2/60 p-2 text-center text-xs">
                    <span className="block font-bold">{forecast.time.slice(11, 16)}</span>
                    {Math.round(forecast.temperature_celsius)}° · {forecast.precipitation_probability}%
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card>
          <CardTitle icon="newspaper" title={t.cityPulse} />
          <p className="text-sm text-muted">{t.noNews}</p>
        </Card>
      </div>
    </>
  );
}

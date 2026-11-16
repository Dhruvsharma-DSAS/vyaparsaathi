"use client";

import { useState } from "react";
import { Card, CardTitle, Loading, Notice, Pill, SelectField, StatGrid } from "@/components/ui";
import type { useMarketData } from "@/hooks/useMarketData";
import { marketCategories } from "@/lib/config";
import { useApp } from "@/state/AppProvider";

type Props = { market: ReturnType<typeof useMarketData> };

export function MarketPanel({ market }: Props) {
  const { copy } = useApp();
  const { t } = copy;
  const [category, setCategory] = useState("fast_food");
  const sample = market.data?.market_samples.find((item) => item.category === category);

  return (
    <>
      <SelectField
        id="market-category"
          label={t.category}
          value={category}
          onChange={setCategory}
          options={marketCategories.map((item) => ({ value: item.id, label: item.label(copy) }))}
        />

      {market.loading && <Loading label={t.weatherLoading} />}
      {market.error && <Notice tone="bad">{market.error}</Notice>}

      {sample && (
        <Card ruled>
          <CardTitle
            icon="analytics"
            title={sample.area}
            sub={`${sample.confidence} · ${sample.supply_market} (${sample.supply_distance_km} km)`}
            aside={<Pill tone={sample.label === "big gap" ? "ok" : "accent"}>{sample.label}</Pill>}
          />
          <StatGrid stats={[
            { label: t.placesFound, value: sample.places_found },
            { label: t.population, value: sample.population.toLocaleString("en-IN") },
            { label: t.placesPerTenThousand, value: sample.places_per_10000, tone: "accent" },
            { label: t.cityMedian, value: sample.city_median_places_per_10000 },
          ]} />
          <p className="mt-4 text-sm text-muted">{t.verifyGround}</p>
        </Card>
      )}
      {market.data && !sample && <Notice tone="info">{t.noCategorySample}</Notice>}

    </>
  );
}

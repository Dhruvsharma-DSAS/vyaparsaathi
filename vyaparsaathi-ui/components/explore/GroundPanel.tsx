"use client";

import { useState } from "react";
import { Button, Card, CardTitle, Field, Notice, Rows, StatGrid } from "@/components/ui";
import { api } from "@/lib/api";
import { footfallFields } from "@/lib/config";
import { formatRupees, median, toNumber } from "@/lib/format";
import { useApp } from "@/state/AppProvider";

export function GroundPanel() {
  const app = useApp();
  const { copy, groundInputs, setGroundInputs, footfallResult, setFootfallResult, rentBurdenResult, setRentBurdenResult,
    priceChecks, setPriceChecks, financeInputs, vyaparState } = app;
  const { t, money, ground } = copy;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof groundInputs, value: string, resetResults = true) => {
    setGroundInputs((previous) => ({ ...previous, [key]: value }));
    if (resetResults) { setFootfallResult(null); setRentBurdenResult(null); }
  };

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    setError("");
    try { await task(); } catch { setError(money.error); } finally { setLoading(false); }
  };

  const estimateFootfall = () => {
    const [people, minutes, hours, rate] = footfallFields.map((field) => toNumber(groundInputs[field.key]));
    if ([people, minutes, hours, rate].some((value) => value === null || value < 0) || !minutes || !hours || rate! > 100) {
      return setError(money.error);
    }
    void run(async () => {
      setFootfallResult(await api.footfall({ people_count: people!, minutes_counted: minutes, selling_hours: hours, buying_rate: rate! / 100 }));
      setRentBurdenResult(null);
    });
  };

  const addPrice = () => {
    const price = toNumber(groundInputs.observedPrice);
    if (price === null || price <= 0) return setError(money.error);
    setPriceChecks((previous) => [...previous, price]);
    setField("observedPrice", "", false);
    setError("");
  };

  const compareRent = () => {
    const rent = toNumber(groundInputs.monthlyRent);
    const units = footfallResult?.estimated_units_per_day ?? toNumber(financeInputs.dailyUnits);
    const price = toNumber(financeInputs.sellingPrice);
    if (rent === null || rent < 0 || units === null || units < 0 || price === null || price < 0) return setError(money.error);
    void run(async () => setRentBurdenResult(await api.rentBurden({ monthly_rent: rent, estimated_daily_units: units, selling_price: price })));
  };

  const sortedPrices = [...priceChecks].sort((a, b) => a - b);
  const priceMedian = median(priceChecks);
  const zones = vyaparState.business_context.candidate_zones;

  return (
    <>
      <Card ruled>
        <CardTitle icon="footprint" title={ground.groundTitle} sub={ground.groundNote} />
        <p className="-mt-2 mb-4 text-xs font-semibold text-muted">{t.city}: {vyaparState.user_profile.city}{zones.length > 0 && ` · ${zones.join(", ")}`}</p>
        {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
        <div className="grid grid-cols-2 gap-3">
          {footfallFields.map((field) => (
            <Field key={field.key} label={field.label(copy)} value={groundInputs[field.key]} onChange={(value) => setField(field.key, value)} />
          ))}
        </div>
        <Button className="mt-4" icon="calculate" onClick={estimateFootfall} disabled={loading}>{loading ? money.loading : ground.estimateFootfall}</Button>
        {footfallResult && (
          <div className="mt-4">
            <StatGrid stats={[
              { label: ground.peoplePerHour, value: footfallResult.people_per_hour },
              { label: ground.estimatedUnits, value: footfallResult.estimated_units_per_day, tone: "accent" },
            ]} />
          </div>
        )}
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardTitle icon="sell" title={ground.priceTitle} />
          <div className="flex items-end gap-2">
            <Field className="flex-1" label={ground.observedPrice} value={groundInputs.observedPrice} onChange={(value) => setField("observedPrice", value, false)} />
            <Button variant="outline" icon="add" onClick={addPrice}>{ground.addPrice}</Button>
          </div>
          {priceChecks.length > 0 && (
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {sortedPrices.map((price, index) => (
                  <span key={`${price}-${index}`} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold tabular-nums">{formatRupees(price)}</span>
                ))}
              </div>
              <Rows rows={[
                { label: ground.checkedPrices, value: priceChecks.length },
                ...(priceMedian !== null ? [{ label: ground.priceMedian, value: formatRupees(priceMedian), strong: true }] : []),
                ...(financeInputs.sellingPrice ? [{ label: ground.proposedPrice, value: formatRupees(Number(financeInputs.sellingPrice)) }] : []),
              ]} />
            </div>
          )}
        </Card>

        <Card>
          <CardTitle icon="real_estate_agent" title={ground.compareRent} sub={ground.rentNote} />
          <div className="flex items-end gap-2">
            <Field className="flex-1" label={ground.rent} value={groundInputs.monthlyRent} onChange={(value) => { setField("monthlyRent", value, false); setRentBurdenResult(null); }} />
            <Button variant="outline" icon="balance" onClick={compareRent} disabled={loading}>{loading ? money.loading : "OK"}</Button>
          </div>
          {rentBurdenResult && (
            <div className="mt-4">
              <Rows rows={[
                { label: ground.rentShare, value: rentBurdenResult.rent_share_percent === null ? "—" : `${rentBurdenResult.rent_share_percent}%`, strong: true },
                { label: ground.estimatedUnits, value: formatRupees(rentBurdenResult.estimated_monthly_sales) },
              ]} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

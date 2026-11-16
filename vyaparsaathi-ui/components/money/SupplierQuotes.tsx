"use client";

import { useState } from "react";
import { Button, Card, CardTitle, Field, Icon, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { supplierFields } from "@/lib/config";
import { formatRupees, toNumber } from "@/lib/format";
import type { SupplierInputs } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

const emptyInputs: SupplierInputs = { supplier: "", quantity: "1", unitPrice: "", transport: "0", charges: "0" };

export function SupplierQuotes() {
  const { copy, supplierQuotes, setSupplierQuotes } = useApp();
  const { money } = copy;
  const [inputs, setInputs] = useState<SupplierInputs>(emptyInputs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const add = async () => {
    const quantity = toNumber(inputs.quantity);
    const unitPrice = toNumber(inputs.unitPrice);
    const transport = toNumber(inputs.transport);
    const charges = toNumber(inputs.charges);
    if (!inputs.supplier.trim() || quantity === null || quantity <= 0 || [unitPrice, transport, charges].some((value) => value === null || value < 0)) {
      return setError(money.error);
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.landedCost({ unit_price: unitPrice!, quantity, transport_cost: transport!, other_charges: charges! });
      setSupplierQuotes((previous) => [...previous, { supplier: inputs.supplier.trim(), landedCost: result.landed_cost_per_unit }]
        .sort((a, b) => a.landedCost - b.landedCost));
      setInputs(emptyInputs);
    } catch {
      setError(money.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle icon="local_shipping" title={money.landedTitle} />
      <div className="grid grid-cols-2 gap-3">
        {supplierFields.map((field) => (
          <Field
            key={field.key}
            className={field.wide ? "col-span-2" : undefined}
            type={field.type}
            min={field.min}
            label={field.label(copy)}
            value={inputs[field.key]}
            onChange={(value) => setInputs((previous) => ({ ...previous, [field.key]: value }))}
          />
        ))}
      </div>
      {error && <Notice tone="bad" className="mt-3">{error}</Notice>}
      <Button className="mt-3" variant="outline" icon="add" onClick={() => void add()} disabled={loading}>{money.addSupplier}</Button>
      {supplierQuotes.length > 0 && (
        <ol className="mt-4 space-y-2">
          {supplierQuotes.map((quote, index) => (
            <li key={`${quote.supplier}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2/60 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                {index === 0 ? <Icon name="workspace_premium" filled className="text-[18px] text-accent" /> : <span className="w-[18px] text-center text-xs text-muted">{index + 1}</span>}
                {quote.supplier}
              </span>
              <span className="text-right font-semibold tabular-nums">{formatRupees(quote.landedCost)} <span className="text-xs font-normal text-muted">/ {money.perUnit}</span></span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

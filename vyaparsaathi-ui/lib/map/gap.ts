/**
 * Same rules as the backend's calculate_market_gap (city_planner.py),
 * so the map and the Explore tab always agree on a label.
 */
export type GapLabel = "big gap" | "some gap" | "normal" | "crowded" | "insufficient data";

export function marketGap(placeCount: number, population: number, cityMedian: number) {
  const perTenThousand = population > 0 ? (placeCount / population) * 10000 : 0;
  let gap = 0;
  let label: GapLabel;
  if (cityMedian <= 0 || population <= 0) {
    label = "insufficient data";
  } else if (perTenThousand > cityMedian * 1.5) {
    label = "crowded";
  } else {
    gap = Math.min(1, Math.max(0, (cityMedian - perTenThousand) / cityMedian));
    const rounded = Math.round(gap * 100);
    label = rounded >= 50 ? "big gap" : rounded >= 20 ? "some gap" : "normal";
  }
  return {
    placesPer10000: Math.round(perTenThousand * 100) / 100,
    gapFraction: Math.round(gap * 1000) / 1000,
    label,
  };
}

export const gapColours: Record<GapLabel | "none", string> = {
  "big gap": "#15803d",
  "some gap": "#d97706",
  normal: "#0f5e57",
  crowded: "#b3263e",
  "insufficient data": "#6b6578",
  none: "#9a93a8",
};

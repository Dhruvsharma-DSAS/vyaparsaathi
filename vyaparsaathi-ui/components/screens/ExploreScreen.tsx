"use client";

import { GroundPanel } from "@/components/explore/GroundPanel";
import { MapPanel } from "@/components/explore/MapPanel";
import { MarketPanel } from "@/components/explore/MarketPanel";
import { TimePanel } from "@/components/explore/TimePanel";
import { Banner, Notice, PageHeader, SectionTabs } from "@/components/ui";
import { useMarketData } from "@/hooks/useMarketData";
import { exploreTabs } from "@/lib/config";
import { useApp } from "@/state/AppProvider";

/** Explore keeps the original two tabs: Market (now with the area map) and Rush Clock (with weather and the ground kit). */
export function ExploreScreen() {
  const { copy, exploreTab, setExploreTab, vyaparState, isOnline } = useApp();
  const { t } = copy;
  const city = vyaparState.user_profile.city;
  const market = useMarketData(city, isOnline, t.connection);

  return (
    <div>
      <PageHeader
        title={exploreTab === "market" ? `${t.marketTitle} · ${city}` : t.timeTitle}
        sub={exploreTab === "market" ? t.marketMessage : undefined}
      />
      {exploreTab === "market" && <Banner src="/illustrations/explore-map.svg" alt="" />}
      {market.stale && <Notice className="mt-3">{t.cachedNotice}</Notice>}
      <SectionTabs
        tabs={exploreTabs.map((tab) => ({ id: tab.id, label: tab.label(copy) }))}
        value={exploreTab}
        onChange={setExploreTab}
      />
      <div className="mt-4 space-y-4">
        {exploreTab === "market" ? (
          <>
            <MarketPanel market={market} />
            <MapPanel />
          </>
        ) : (
          <>
            <TimePanel market={market} />
            <GroundPanel />
          </>
        )}
      </div>
      <Notice className="mt-4">{t.sampleNotice}</Notice>
    </div>
  );
}

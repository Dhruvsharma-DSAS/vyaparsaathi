-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "centerLat" REAL NOT NULL,
    "centerLng" REAL NOT NULL,
    "defaultZoom" INTEGER NOT NULL DEFAULT 13
);

-- CreateTable
CREATE TABLE "Area" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "approximate" BOOLEAN NOT NULL DEFAULT true,
    "cityId" INTEGER NOT NULL,
    CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplyMarket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    CONSTRAINT "SupplyMarket_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketSample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "placesFound" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,
    "cityMedianPlacesPer10000" REAL NOT NULL,
    "supplyDistanceKm" REAL,
    "confidence" TEXT NOT NULL DEFAULT 'Sample data',
    "source" TEXT NOT NULL DEFAULT 'VyaparSaathi city guide sample',
    "areaId" INTEGER NOT NULL,
    "supplyMarketId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketSample_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketSample_supplyMarketId_fkey" FOREIGN KEY ("supplyMarketId") REFERENCES "SupplyMarket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Area_cityId_name_key" ON "Area"("cityId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyMarket_cityId_name_key" ON "SupplyMarket"("cityId", "name");

-- CreateIndex
CREATE INDEX "MarketSample_category_idx" ON "MarketSample"("category");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSample_areaId_category_key" ON "MarketSample"("areaId", "category");

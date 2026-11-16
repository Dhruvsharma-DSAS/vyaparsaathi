-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT NOT NULL,
    "categoryKind" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "openingHours" TEXT,
    "cuisine" TEXT,
    "wheelchair" TEXT,
    "osmVersion" INTEGER NOT NULL,
    "sourceUpdatedAt" DATETIME NOT NULL,
    "retrievedAt" DATETIME NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "dataKind" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WeatherHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "timestampLocal" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "temperatureC" REAL NOT NULL,
    "relativeHumidityPct" REAL NOT NULL,
    "precipitationMm" REAL NOT NULL,
    "windSpeedKmh" REAL NOT NULL,
    "retrievedAt" DATETIME NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "dataKind" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "popSource" TEXT,
    "areaKm2" REAL NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "confidence" TEXT,
    "sources" JSONB,
    "geometry" JSONB
);

-- CreateTable
CREATE TABLE "WardCategoryStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wardId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "per10k" REAL,
    "gap" REAL,
    CONSTRAINT "WardCategoryStat_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryMedian" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "medianPer10k" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "RushStation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "kind" TEXT NOT NULL,
    "weekday" JSONB NOT NULL,
    "weekend" JSONB NOT NULL,
    "source" TEXT
);

-- CreateTable
CREATE TABLE "DensityCell" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "city" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "count" INTEGER NOT NULL,
    "categories" JSONB NOT NULL,
    "landmarkName" TEXT,
    "landmarkCategory" TEXT,
    "landmarkUrl" TEXT
);

-- CreateTable
CREATE TABLE "BusinessType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hindi" TEXT,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "peak" TEXT,
    "price" REAL NOT NULL,
    "unit" TEXT,
    "typicalUnitsPerDay" REAL,
    "monthlyFixed" REAL,
    "startup" JSONB NOT NULL,
    "licenceIds" JSONB NOT NULL,
    "schemeIds" JSONB NOT NULL,
    "recipeId" TEXT,
    CONSTRAINT "BusinessType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grams" REAL,
    "retailPerKg" REAL,
    "mandiItem" TEXT,
    "fixedCost" REAL,
    CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "forModels" JSONB NOT NULL,
    "forText" TEXT,
    "maxAmount" REAL,
    "detail" TEXT,
    "needs" JSONB NOT NULL,
    "url" TEXT,
    "checkedOn" TEXT,
    "sourceUrl" TEXT
);

-- CreateTable
CREATE TABLE "Licence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "why" TEXT,
    "where" TEXT,
    "url" TEXT,
    "time" TEXT,
    "checkedOn" TEXT,
    "sourceUrl" TEXT
);

-- CreateTable
CREATE TABLE "CityEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "effect" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MandiPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "pricePerKg" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "sample" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "NewsDigest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sample" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "digestId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT,
    CONSTRAINT "NewsItem_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "NewsDigest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetSource" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "file" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "sha256" TEXT,
    "description" TEXT,
    "meta" JSONB,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModelReport" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "report" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "BoundaryFile" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "featureCount" INTEGER NOT NULL,
    "geojson" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Place_city_category_idx" ON "Place"("city", "category");

-- CreateIndex
CREATE INDEX "Place_lat_lng_idx" ON "Place"("lat", "lng");

-- CreateIndex
CREATE INDEX "WeatherHour_city_timestampLocal_idx" ON "WeatherHour"("city", "timestampLocal");

-- CreateIndex
CREATE INDEX "Ward_city_idx" ON "Ward"("city");

-- CreateIndex
CREATE INDEX "WardCategoryStat_category_idx" ON "WardCategoryStat"("category");

-- CreateIndex
CREATE UNIQUE INDEX "WardCategoryStat_wardId_category_key" ON "WardCategoryStat"("wardId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMedian_city_category_key" ON "CategoryMedian"("city", "category");

-- CreateIndex
CREATE UNIQUE INDEX "RushStation_city_name_key" ON "RushStation"("city", "name");

-- CreateIndex
CREATE INDEX "DensityCell_city_idx" ON "DensityCell"("city");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_recipeId_position_key" ON "RecipeItem"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CityEvent_name_city_key" ON "CityEvent"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "MandiPrice_date_city_commodity_period_key" ON "MandiPrice"("date", "city", "commodity", "period");

-- CreateIndex
CREATE UNIQUE INDEX "NewsDigest_date_city_key" ON "NewsDigest"("date", "city");

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "defaultZoom" INTEGER NOT NULL DEFAULT 13,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "approximate" BOOLEAN NOT NULL DEFAULT true,
    "cityId" INTEGER NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyMarket" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "cityId" INTEGER NOT NULL,

    CONSTRAINT "SupplyMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSample" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "placesFound" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,
    "cityMedianPlacesPer10000" DOUBLE PRECISION NOT NULL,
    "supplyDistanceKm" DOUBLE PRECISION,
    "confidence" TEXT NOT NULL DEFAULT 'Sample data',
    "source" TEXT NOT NULL DEFAULT 'VyaparSaathi city guide sample',
    "areaId" INTEGER NOT NULL,
    "supplyMarketId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT NOT NULL,
    "categoryKind" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "openingHours" TEXT,
    "cuisine" TEXT,
    "wheelchair" TEXT,
    "osmVersion" INTEGER NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3) NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "dataKind" TEXT NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherHour" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "timestampLocal" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "relativeHumidityPct" DOUBLE PRECISION NOT NULL,
    "precipitationMm" DOUBLE PRECISION NOT NULL,
    "windSpeedKmh" DOUBLE PRECISION NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "dataKind" TEXT NOT NULL,

    CONSTRAINT "WeatherHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "popSource" TEXT,
    "areaKm2" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT,
    "sources" JSONB,
    "geometry" JSONB,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WardCategoryStat" (
    "id" SERIAL NOT NULL,
    "wardId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "per10k" DOUBLE PRECISION,
    "gap" DOUBLE PRECISION,

    CONSTRAINT "WardCategoryStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMedian" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "medianPer10k" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CategoryMedian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RushStation" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "kind" TEXT NOT NULL,
    "weekday" JSONB NOT NULL,
    "weekend" JSONB NOT NULL,
    "source" TEXT,

    CONSTRAINT "RushStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DensityCell" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,
    "categories" JSONB NOT NULL,
    "landmarkName" TEXT,
    "landmarkCategory" TEXT,
    "landmarkUrl" TEXT,

    CONSTRAINT "DensityCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hindi" TEXT,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "peak" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "typicalUnitsPerDay" DOUBLE PRECISION,
    "monthlyFixed" DOUBLE PRECISION,
    "startup" JSONB NOT NULL,
    "licenceIds" JSONB NOT NULL,
    "schemeIds" JSONB NOT NULL,
    "recipeId" TEXT,

    CONSTRAINT "BusinessType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" SERIAL NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "grams" DOUBLE PRECISION,
    "retailPerKg" DOUBLE PRECISION,
    "mandiItem" TEXT,
    "fixedCost" DOUBLE PRECISION,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "forModels" JSONB NOT NULL,
    "forText" TEXT,
    "maxAmount" DOUBLE PRECISION,
    "detail" TEXT,
    "needs" JSONB NOT NULL,
    "url" TEXT,
    "checkedOn" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "why" TEXT,
    "where" TEXT,
    "url" TEXT,
    "time" TEXT,
    "checkedOn" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "Licence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityEvent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "effect" TEXT NOT NULL,

    CONSTRAINT "CityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandiPrice" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "sample" BOOLEAN NOT NULL,

    CONSTRAINT "MandiPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsDigest" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sample" BOOLEAN NOT NULL,

    CONSTRAINT "NewsDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" SERIAL NOT NULL,
    "digestId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetSource" (
    "key" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "sha256" TEXT,
    "description" TEXT,
    "meta" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetSource_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ModelReport" (
    "name" TEXT NOT NULL,
    "report" JSONB NOT NULL,

    CONSTRAINT "ModelReport_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "BoundaryFile" (
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "featureCount" INTEGER NOT NULL,
    "geojson" TEXT NOT NULL,

    CONSTRAINT "BoundaryFile_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" JSONB,
    "planUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyMarket" ADD CONSTRAINT "SupplyMarket_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSample" ADD CONSTRAINT "MarketSample_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSample" ADD CONSTRAINT "MarketSample_supplyMarketId_fkey" FOREIGN KEY ("supplyMarketId") REFERENCES "SupplyMarket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WardCategoryStat" ADD CONSTRAINT "WardCategoryStat_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessType" ADD CONSTRAINT "BusinessType_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "NewsDigest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

# Real data catalogue

Collected at 2026-11-09T05:54:17.487243+00:00.

These are downloaded snapshots, not a continuous live feed. No additional external calls occur unless explicitly enabled or a collector is manually run with --allow-network.

## business_pois.csv

32,307 records. SHA-256: `2c696c942f22da6f20e43e4dc675bd40be977a48784343919ea7f85f822dacc3`.

OSM coverage is incomplete. Bounding boxes include suburbs. Object edit time is not field verification. Nodes and polygons may describe the same business.

| Column | Missing values |
| --- | ---: |
| `record_id` | 0 |
| `city` | 0 |
| `name` | 2,071 |
| `category` | 0 |
| `category_kind` | 0 |
| `latitude` | 0 |
| `longitude` | 0 |
| `opening_hours` | 29,221 |
| `cuisine` | 28,159 |
| `wheelchair` | 29,925 |
| `osm_version` | 0 |
| `source_updated_at` | 0 |
| `retrieved_at_utc` | 0 |
| `source_url` | 0 |
| `license` | 0 |
| `data_kind` | 0 |

### Source queries

- bengaluru: https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A150%5D%3B%28nwr%5B%22shop%22%5D%2812.75%2C77.35%2C13.20%2C77.85%29%3Bnwr%5B%22amenity%22~%22restaurant%7Ccafe%7Cfast_food%7Cmarketplace%7Cbank%7Cschool%7Ccollege%7Chospital%7Cpharmacy%22%5D%2812.75%2C77.35%2C13.20%2C77.85%29%3B%29%3Bout+center+meta%3B
- pune: https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A150%5D%3B%28nwr%5B%22shop%22%5D%2818.35%2C73.65%2C18.75%2C74.05%29%3Bnwr%5B%22amenity%22~%22restaurant%7Ccafe%7Cfast_food%7Cmarketplace%7Cbank%7Cschool%7Ccollege%7Chospital%7Cpharmacy%22%5D%2818.35%2C73.65%2C18.75%2C74.05%29%3B%29%3Bout+center+meta%3B

## weather_hourly.csv

17,520 records. SHA-256: `eb43138493586167804508ea9de445d81c8b57560282ca0b74a12339ffb78c7b`.

ERA5 model reanalysis, not a street sensor or live sales observation. Weather grid coordinates differ from the requested city center.

| Column | Missing values |
| --- | ---: |
| `record_id` | 0 |
| `city` | 0 |
| `timestamp_local` | 0 |
| `timezone` | 0 |
| `latitude` | 0 |
| `longitude` | 0 |
| `temperature_c` | 0 |
| `relative_humidity_pct` | 0 |
| `precipitation_mm` | 0 |
| `wind_speed_kmh` | 0 |
| `retrieved_at_utc` | 0 |
| `source_url` | 0 |
| `license` | 0 |
| `data_kind` | 0 |

### Source queries

- bengaluru: https://archive-api.open-meteo.com/v1/archive?latitude=12.9716&longitude=77.5946&start_date=2025-11-03&end_date=2026-11-02&hourly=temperature_2m%2Crelative_humidity_2m%2Cprecipitation%2Cwind_speed_10m&timezone=Asia%2FKolkata&models=era5
- pune: https://archive-api.open-meteo.com/v1/archive?latitude=18.5204&longitude=73.8567&start_date=2025-11-03&end_date=2026-11-02&hourly=temperature_2m%2Crelative_humidity_2m%2Cprecipitation%2Cwind_speed_10m&timezone=Asia%2FKolkata&models=era5

## Column interpretation

`record_id` is the unique source object ID or city/hour pair. `retrieved_at_utc` is collection time, not field-observation time. `data_kind` distinguishes mapped snapshots and ERA5 reanalysis.

POI coordinates are WGS84 latitude/longitude; way/relation coordinates are bounding-box centers from Overpass, not entrances. `source_updated_at` is OSM object modification time. `category_kind` identifies the shop or amenity tag. Blank name/opening_hours/cuisine/wheelchair fields are unknown, not zero or false. Shops take category precedence over amenities when both tags are present.

Weather timestamps are local Asia/Kolkata hours. Temperature is Celsius, humidity is percent, precipitation is millimetres per hour and wind speed is km/h. Coordinates are the ERA5 grid selected by the provider. `source_url` includes the date range and model. Null weather hours are excluded rather than imputed.

## Licensing and attribution

POIs: © OpenStreetMap contributors, available under ODbL 1.0. Preserve database attribution and applicable share-alike terms when redistributing a derived database. https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/

Weather: Open-Meteo / ERA5 (Copernicus/ECMWF), CC BY 4.0. https://open-meteo.com/en/docs/historical-weather-api and https://creativecommons.org/licenses/by/4.0/ . Free Open-Meteo hosted API access is for non-commercial use; check provider terms for commercial use.

Raw downloads remain local and are excluded from Git. The collector and manifest preserve reproducible query details.

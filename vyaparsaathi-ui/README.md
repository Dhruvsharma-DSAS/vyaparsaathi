# VyaparSaathi City

VyaparSaathi helps small-business owners explore a city market, plan costs, check permits and record a short pilot. The interface supports English, Hindi, Marathi, Gujarati and Bengali.

## Main areas

- **Home**: choose Bengaluru or Pune and start in Discover or Launch mode.
- **Saathi**: complete a short planning profile by text or voice.
- **Explore**: review available market samples, busy-hour guidance, weather and ground checks.
- **My plan**: work through cost estimates, preliminary scheme matches, licence checks and the 7-day pilot ledger.

Planning answers and entries are saved in the current browser on the current device. Offline data is shown with a stale-data notice. Calculations, weather, translation and advisor responses need a working API connection.

## Run locally

Start the API from `vyaparsaathi-ai`:

```bash
uvicorn main:app --reload
```

Start the UI from this directory:

```bash
npm install
npm run dev
```

The UI uses `http://127.0.0.1:8000` by default. Set `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`) to use another API URL.

## Data notes

Market and business-template figures are labelled samples, not live local counts or quotes. There are no ward boundary files or verified City Pulse headlines in this repository. Scheme matches are preliminary; confirm current requirements with the linked official portal, lender or city office.

## Database (Prisma)

Everything the app reads besides the Python API lives in one PostgreSQL database managed by Prisma. Set `DATABASE_URL` in `.env` (see `.env.example`).

| Data | Tables | Source file in `prisma/data/` |
| --- | --- | --- |
| 32,307 mapped places | `Place` | `real/business_pois.csv` (© OpenStreetMap contributors, ODbL-1.0) |
| 17,520 hourly weather rows | `WeatherHour` | `real/weather_hourly.csv` (ERA5 via Open-Meteo, CC-BY-4.0) |
| 258 wards with boundaries and category counts | `Ward`, `WardCategoryStat`, `CategoryMedian` | `city/*/ward_stats.json`, `city/*/wards.geojson` |
| Station rush curves | `RushStation` | `city/*/rush_clock.json` |
| Map density grid | `DensityCell` | `real/*_map.json` |
| Business types, recipes, schemes, licences, events | `BusinessType`, `Recipe`, `RecipeItem`, `Scheme`, `Licence`, `CityEvent` | `common/*.json` |
| Sample mandi prices and news | `MandiPrice`, `NewsDigest`, `NewsItem` | `daily/*.json` |
| Raw boundary GeoJSON | `BoundaryFile` | `raw/*.geojson` |
| Checksums and provenance, weather model report | `DatasetSource`, `ModelReport` | `real/manifest.json`, `real/summary.json`, `real/weather_report.json` |
| Market-area pins | `City`, `Area`, `SupplyMarket`, `MarketSample` | `lib/map/seed-data.ts` |
| Accounts | `User`, `Session` | created by sign-up |

Set it up once after `npm install` (about 10 seconds against a nearby database):

```bash
npm run db:setup
```

`npm run db:seed` reloads every dataset; it is safe to run again. `npm run db:studio` opens a table browser.

API routes: `GET /api/map?city=Bengaluru` (areas, wards, density, stations, place categories), `GET /api/places?city=Pune&category=cafe`, `GET /api/data` (row counts). If the database is unreachable, `/api/map` falls back to the seed pins so the map still loads. Hosting steps for Vercel, Render and Prisma Postgres are in [DEPLOY.md](../DEPLOY.md).

## Accounts

Users can continue as a guest (plan kept in this browser only) or sign up with name, email and password (`/api/auth/register`, `/login`, `/logout`, `/me`). Passwords are stored as salted scrypt hashes; sessions are random tokens in an httpOnly cookie, with only their SHA-256 hash in the `Session` table. Each user's plan is saved to their account (`PUT /api/auth/plan`) and restored when they sign in on another device. Signing out clears the plan from that browser.

## Images and video

`public/illustrations/*.svg` and `public/media/saathi-story.{mp4,webm}` are original artwork made for this app (no stock assets).

## Code layout

- `app/page.tsx`: picks the screen; each screen lives in `components/screens/`
- `components/explore`, `components/money`: the panels for each screen
- `components/ui.tsx`: shared cards, fields, tabs and stat grids
- `lib/config.ts`: nav items, tabs and form fields as arrays that the UI maps over
- `lib/i18n/`: English, Hindi, Marathi, Gujarati and Bengali text
- `state/AppProvider.tsx`: saved plan state (same browser storage key as before, so existing plans carry over)
- `lib/pitch.ts`: the lender pitch sheet readiness checks
- `lib/auth/`, `state/AuthProvider.tsx`, `components/auth/`: sign-in and sessions
- `prisma/import-data.ts`: loads every file in `prisma/data/` into the database

`npm test` runs the unit tests in `tests/`.

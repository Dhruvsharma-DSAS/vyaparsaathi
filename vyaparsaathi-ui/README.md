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

The UI uses `http://127.0.0.1:8000` by default. Set `NEXT_PUBLIC_API_BASE_URL` before starting Next.js to use another API URL.

## Data notes

Market and business-template figures are labelled samples, not live local counts or quotes. There are no ward boundary files or verified City Pulse headlines in this repository. Scheme matches are preliminary; confirm current requirements with the linked official portal, lender or city office.

# Deploying VyaparSaathi City

Three pieces, each on a free tier:

| Piece | Folder | Host |
| --- | --- | --- |
| PostgreSQL database (map data, places, weather, accounts) | `vyaparsaathi-ui/prisma` | Prisma Postgres (or Neon / Supabase / Render Postgres) |
| Python API (chat, calculations, weather) | `vyaparsaathi-ai` | Render |
| Web app (Next.js) | `vyaparsaathi-ui` | Vercel |

Do them in this order: database, then API, then web app.

## 1. Database (Prisma Postgres)

1. Go to <https://console.prisma.io>, create a project and a **Prisma Postgres** database. Pick the region closest to your users (e.g. Asia Pacific).
2. Copy the **connection string** (`postgres://…`). This is your `DATABASE_URL`.
3. Load the tables and all data once, from your computer:

   ```bash
   cd vyaparsaathi-ui
   cp .env.example .env        # then paste DATABASE_URL into .env
   npm install
   npm run db:setup            # creates the tables and imports everything in prisma/data (~31 MB)
   ```

   `npm run db:setup` is safe to run again; it reloads every dataset. Accounts are not touched.

Using Neon, Supabase or Render Postgres instead works the same way: only the `DATABASE_URL` changes.

## 2. Python API (Render)

1. In Render: **New > Blueprint**, connect this GitHub repository. Render reads `render.yaml` and creates the `vyaparsaathi-api` web service.
2. When asked, fill in:
   - `GOOGLE_API_KEY`: a Google AI Studio key for the Saathi chat (<https://aistudio.google.com> > Get API key).
   - `GROQ_API_KEY`: a Groq key (<https://console.groq.com/keys>). Set both keys to enable explicit model selection in Saathi. Auto can fall back to the other provider. Set `LLM_PROVIDER=groq` to make Auto try Groq first.
   - `CORS_ORIGINS`: your Vercel URL, e.g. `https://vyaparsaathi.vercel.app` (you can put `*` first and change it after step 3).
3. Wait for the deploy, then open `https://<your-service>.onrender.com/health`. It should show `{"status":"ok","ai_providers":["gemini","groq"]}` (only the providers whose keys you set). Copy the service URL.

Saathi uses Gemini 3.5 Flash-Lite and Groq GPT-OSS 20B by default. Set `GEMINI_MODEL` or `GROQ_MODEL` on Render to override the defaults. Replies and chat translation use the selected provider. The Next.js proxy reads Pune and Bengaluru market context from the existing Prisma database.

Free Render services sleep after 15 minutes without traffic, so the first request after an idle period can still take about a minute.

## 3. Web app (Vercel)

1. In Vercel: **Add New > Project**, import this GitHub repository.
2. Set **Root Directory** to `vyaparsaathi-ui`. Framework is detected as Next.js; `vercel.json` sets the build command.
3. Add **Environment Variables** (Production and Preview):
   - `DATABASE_URL`: the same connection string as step 1.
   - `NEXT_PUBLIC_API_BASE_URL`: the Render URL from step 2 (no trailing slash).
4. Deploy. Each build runs `prisma migrate deploy`, so new migrations apply automatically.
5. Put the Vercel URL into `CORS_ORIGINS` on Render (step 2) and redeploy the API.

## Checks after deploying

- The login page loads; **Continue as guest** opens the app without an account.
- Explore > Market: the area map shows the **Prisma DB** badge and the ward / density / station layers.
- Settings > Database lists the row counts (32,307 places, 17,520 weather hours, …).
- Create an account, change something, sign in from another browser: the plan comes back.
- Money > Calculate plan returns numbers (this calls the Render API).

## Local development

```bash
# API
cd vyaparsaathi-ai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # add GOOGLE_API_KEY for the chat
uvicorn main:app --reload

# Web app (needs any PostgreSQL; see .env.example)
cd vyaparsaathi-ui
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

## GitHub

`.github/workflows/ci.yml` runs on every push to `main` and every pull request: lint, type check, unit tests, a real PostgreSQL migration and full data import, the production build, and the Python API tests. Vercel and Render both deploy automatically when `main` changes.

Secrets (`.env` files, database URLs, API keys) are git-ignored; only the `.env.example` files are committed.

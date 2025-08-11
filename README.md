# Learn & Latest AI (V1)

Mobile-first site to understand AI capabilities and stay current. Three categories, three lenses, zero fluff.

## Quick start

```bash
npm i
npm run dev
# open http://localhost:3000
```

## Ingestion (GitHub Actions)

1. Add secret `OPENAI_API_KEY` in your repo → Settings → Secrets → Actions.
2. Manually run the workflow **Daily Ingest** once to populate `public/data/items.json`.
3. The cron runs daily at 09:00 IST.

## Local ingestion

```bash
OPENAI_API_KEY=sk-xxx npm run ingest
```

## Deploy

- Import this repo into Vercel and deploy.
- Each time the Action commits `items.json`, Vercel auto-redeploys.

## Notes

- Sources: OpenAI blog, DeepMind blog, The Verge AI.
- Caching: per-article JSON in `data/cache/` keyed by content hash.
- Public feed: `public/data/items.json` (last 14 days).

# Glimpse - AI-Powered Website Audit

An async, website-specific audit pipeline that analyzes UX, conversion potential, accessibility, SEO, and performance using real PageSpeed Insights data and LLM synthesis.

## Features

- **Multi-page Analysis**: Scans homepage + up to 3 key pages (collection, product, cart)
- **Real Performance Data**: Uses Google PageSpeed Insights API (mobile strategy)
- **Evidence-Based**: Every issue is backed by actual data from the scanned pages
- **Async Pipeline**: Fire-and-forget architecture with progress polling
- **LLM Synthesis**: OpenAI-powered report generation with structured output

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Netlify Functions │────▶│  Supabase   │
│  (React)    │◀────│  (Serverless)    │◀────│  (Postgres) │
└─────────────┘     └──────────────────┘     └─────────────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
              ┌──────────┐   ┌──────────┐
              │ PSI API  │   │ OpenAI   │
              └──────────┘   └──────────┘
```

## Quick Start

### 1. Clone and Install

```bash
cd glimpse-app
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Get your credentials from **Settings > API**

### 3. Get API Keys

- **PageSpeed Insights**: [Google Cloud Console](https://console.cloud.google.com) → Enable "PageSpeed Insights API" → Create credentials
- **OpenAI**: [platform.openai.com](https://platform.openai.com/api-keys)

### 4. Configure Environment

Create a `.env` file in the project root:

```env
# Frontend (safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (secrets - DO NOT COMMIT)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PSI_API_KEY=your-google-psi-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 5. Run Locally

```bash
npm run dev
```

This uses Netlify CLI to run both the Vite dev server and functions locally.

Open [http://localhost:8888](http://localhost:8888)

## Deploy to Netlify

### Via Netlify Dashboard

1. Push code to GitHub
2. Connect repo in Netlify Dashboard
3. Add environment variables in **Site Settings > Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PSI_API_KEY`
   - `OPENAI_API_KEY`

### Via CLI

```bash
npx netlify login
npx netlify init
npx netlify deploy --prod
```

## Project Structure

```
glimpse-app/
├── netlify/
│   └── functions/           # Serverless functions
│       ├── start-audit.ts   # Creates audit job, triggers run-audit
│       ├── get-audit.ts     # Polls audit status/results
│       ├── run-audit.ts     # Main audit pipeline
│       └── shared/
│           ├── types.ts     # Shared TypeScript types
│           └── supabase.ts  # Server-side Supabase client
├── src/
│   ├── components/
│   │   └── ReportDisplay.tsx
│   ├── pages/
│   │   ├── HomePage.tsx     # URL input form
│   │   └── ReportPage.tsx   # Progress + Report display
│   ├── lib/
│   │   ├── api.ts           # API client functions
│   │   └── supabase.ts      # Frontend Supabase client
│   ├── App.tsx              # Router setup
│   ├── App.css              # Component styles
│   └── index.css            # Global styles
├── supabase/
│   └── schema.sql           # Database schema
├── netlify.toml             # Netlify config
└── ENV_SETUP.md             # Detailed env var instructions
```

## API Endpoints

### POST `/.netlify/functions/start-audit`

Start a new audit.

**Request:**
```json
{ "url": "example.com" }
```

**Response:**
```json
{ "auditId": "uuid" }
```

### GET `/.netlify/functions/get-audit?auditId=<uuid>`

Get audit status/results.

**Response:**
```json
{
  "auditId": "uuid",
  "status": "queued|running|done|error",
  "progress": 0-100,
  "error": null,
  "report": { ... }  // Only when status=done
}
```

## Report Schema

```typescript
{
  site: { rootUrl, platform, industry },
  pages: [{ type, url, scores, vitals, evidence, failingAudits }],
  scores: { overall, ux, conversion, performance, seo, accessibility },
  benchmarks: { industry, industryAvgOverall, industryAvgPerformance, note },
  issueSummary: { critical, high, medium },
  issues: [{
    severity: "critical|high|medium",
    title, pages, evidence, impact, fix,
    proOnlyFix: boolean
  }],
  recommendations: [{ priority, title, effort, impact }]
}
```

## Manual Test Plan

### Step 1: Start an Audit
```bash
curl -X POST http://localhost:8888/.netlify/functions/start-audit \
  -H "Content-Type: application/json" \
  -d '{"url": "shopify.com"}'
```

Expected: Returns `{ "auditId": "..." }`

### Step 2: Poll for Status
```bash
curl "http://localhost:8888/.netlify/functions/get-audit?auditId=<auditId>"
```

Expected: Returns status updates (queued → running → done)

### Step 3: Verify in Browser
1. Open http://localhost:8888
2. Enter a URL (e.g., `allbirds.com`)
3. Watch progress animation
4. Review generated report

## Troubleshooting

### "Missing API keys" error
- Ensure all env vars are set in `.env` for local dev
- For Netlify, check Site Settings > Environment Variables

### PSI API rate limits
- Free tier: 25,000 requests/day
- Consider caching results for same URLs

### Function timeout
- Netlify free tier: 10s timeout
- Pro tier: 26s timeout
- The async architecture handles long audits gracefully

## Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Netlify Functions (serverless)
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google PageSpeed Insights, OpenAI GPT-4o-mini
- **Styling**: Custom CSS with CSS variables

## License

MIT

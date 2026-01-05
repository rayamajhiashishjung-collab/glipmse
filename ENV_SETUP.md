# Environment Variables Setup

## Netlify Dashboard (Server-Side Secrets)

Go to **Netlify Dashboard > Site Settings > Environment Variables** and add:

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | Supabase Dashboard > Settings > API |
| `PSI_API_KEY` | Google PageSpeed Insights API key | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Enable PageSpeed Insights API |
| `OPENAI_API_KEY` | OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |

## Local Development (.env file)

Create a `.env` file in the project root:

```env
# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For local function development, create `.env` in the project root with ALL variables:

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend (Netlify Functions) - DO NOT COMMIT!
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PSI_API_KEY=your-psi-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the contents of `supabase/schema.sql`
4. Get your credentials from Settings > API

## Google PageSpeed Insights API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable "PageSpeed Insights API"
4. Create credentials > API Key
5. (Optional) Restrict the API key to PageSpeed Insights API only

## OpenAI API

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add billing/credits if needed


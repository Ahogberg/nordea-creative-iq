# Deployment Guide — Nordea CreativeIQ

## Overview

The app is a Next.js 16 frontend that uses Remotion 4 to render MP4 videos. Rendering requires either Chromium + a writable filesystem (self-hosted) or Remotion Lambda on AWS (serverless). This guide covers both paths.

## Environment variables

| Variable | Values | Purpose |
|----------|--------|---------|
| `RENDER_BACKEND` | `local` \| `lambda` \| `disabled` | Selects the rendering backend. Defaults to `local`. |
| `VERCEL` | auto-set by Vercel | When present + `RENDER_BACKEND=local`, the render API returns 501 with an explanatory error. |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | secret | AI generation keys. If missing, scene generation falls back to mock data. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Supabase project URL (auth). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | key | Supabase anon key. |
| `REMOTION_LAMBDA_FUNCTION_NAME` | string | Name of the deployed Lambda (when `RENDER_BACKEND=lambda`). |
| `REMOTION_LAMBDA_SERVE_URL` | URL | Remotion bundle site URL. |
| `REMOTION_LAMBDA_REGION` | AWS region | Defaults to `eu-central-1`. |
| `REMOTION_AWS_ACCESS_KEY_ID` | secret | AWS credentials for Lambda. |
| `REMOTION_AWS_SECRET_ACCESS_KEY` | secret | AWS credentials for Lambda. |

## Path 1 — Vercel (recommended for pilot)

Frontend runs on Vercel serverless. MP4 rendering is delegated to Remotion Lambda on AWS.

### Step 1: Deploy the frontend

```bash
vercel --prod
```

Set these env vars in the Vercel dashboard:

```
RENDER_BACKEND=disabled   # temporary until Lambda is configured
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

Deploy first with `RENDER_BACKEND=disabled`. The app will load, preview will work (it runs client-side via `@remotion/player`), but MP4 export will return a helpful 501.

### Step 2: Set up Remotion Lambda (AWS)

One-time setup, locally:

```bash
# 1. Install the Lambda client + CLI
npm install @remotion/lambda-client
npx remotion lambda policies validate   # verify AWS perms

# 2. Deploy the render Lambda function
npx remotion lambda functions deploy

# 3. Deploy the serve URL (the bundled Remotion project)
npx remotion lambda sites create remotion/index.ts --site-name=nordea-creativeiq
```

The CLI prints the function name and serve URL. Add them + AWS creds to Vercel env:

```
RENDER_BACKEND=lambda
REMOTION_LAMBDA_FUNCTION_NAME=remotion-render-<id>
REMOTION_LAMBDA_SERVE_URL=https://remotionlambda-....s3.eu-central-1.amazonaws.com/sites/nordea-creativeiq/index.html
REMOTION_LAMBDA_REGION=eu-central-1
REMOTION_AWS_ACCESS_KEY_ID=...
REMOTION_AWS_SECRET_ACCESS_KEY=...
```

Redeploy (`vercel --prod`). Export an MP4 from Motion Studio to confirm. Lambda writes outputs to an S3 bucket; the URL returned in the render record is a public S3 URL.

### Rebuilding scenes

When scene components change, redeploy the bundle site:

```bash
npx remotion lambda sites create remotion/index.ts --site-name=nordea-creativeiq
```

AWS caches the previous version by name — same name just overwrites.

## Path 2 — Self-hosted (VM or Docker)

Runs Chromium locally, writes MP4s to `public/renders/`. Simpler; no AWS required.

### Docker

```dockerfile
FROM node:20-slim

# Chromium deps for Remotion
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
    libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
    libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 lsb-release wget xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

ENV RENDER_BACKEND=local
EXPOSE 3000
CMD ["npm", "start"]
```

Mount `public/renders` as a volume for persistence.

### Nordea-internal infra

Similar pattern. Ensure outbound HTTPS to Remotion's CDN is allowed on first render (Chromium downloads automatically). Run behind OAuth proxy to enforce `@nordea.com` login.

## Path 3 — Disabled rendering (preview-only)

Set `RENDER_BACKEND=disabled`. Preview works, export returns 501. Useful for demos or read-only environments.

## Quality settings

### 4K rendering

Set `config.quality: "4k"` in Motion Studio or the config editor. Dimensions double (e.g. `story` becomes 2160×3840). Render time roughly 3–4× HD. Recommended for final deliverables, not draft previews.

### FPS

Framerate is fixed at 30 FPS. Change `FPS` constant in `lib/remotion/DynamicVideo.tsx` and `remotion/Root.tsx` to bump to 60.

## Troubleshooting

### "Rendering är inte konfigurerad för detta miljö"

Running on Vercel with `RENDER_BACKEND=local`. Switch to `lambda` or `disabled`.

### First render is slow

Local Chromium downloads ~150 MB on first invocation. Lambda cold-starts take ~5s. Subsequent renders are much faster.

### Lambda "function not found"

Verify `REMOTION_LAMBDA_FUNCTION_NAME` matches a deployed function in the selected region (`npx remotion lambda functions ls`).

### S3 access denied

The Lambda function's IAM role needs `s3:PutObject` on the output bucket and `s3:GetObject` for the serve URL bucket. `npx remotion lambda policies validate` diagnoses perms.

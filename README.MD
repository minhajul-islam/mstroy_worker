# Next.js API: Cloudflare R2 Signed URL

A minimal Next.js app (App Router) exposing `/api/getPlayableLink` to generate a pre-signed URL for a Cloudflare R2 object (via S3 API). Works on Vercel.

## Endpoint
`GET /api/getPlayableLink?key=path/to/file.mp4&ttl=600`

- key: required. Object key in your R2 bucket
- ttl: optional seconds, default 3600, max 86400

Response:
```json
{ "url": "https://<account>.r2.cloudflarestorage.com/<bucket>/path/to/file.mp4?...", "expiresIn": 600 }
```

## Setup
1. Install deps
```bash
npm install
```
2. Copy env and fill values
```bash
cp .env.example .env.local
```
3. Dev server
```bash
npm run dev
```

## Required env vars
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- One of: R2_ENDPOINT (preferred) or R2_ACCOUNT_ID
- Optional: CORS_ALLOW_ORIGIN (default "*")

## Deploy to Vercel
- Push repo and import into Vercel, or run `npx vercel`
- Add env vars in Vercel Project Settings -> Environment Variables

## Notes
- Uses `forcePathStyle: true` to keep bucket in path segment
- Does not check object existence when generating a URL

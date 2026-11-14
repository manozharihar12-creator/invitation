# Mamatha & Tarun Kumar — Wedding Invitation

**Where Forever Begins** — Thursday, 3 December 2026, 12:13 PM
Shri Manikeshwari Function Hall, Yanagundi, Tq. Sedam, Dist. Gulbarga — 585214

Cinematic film-reel invite: canvas FramePlayer (1210 frames, CDN proxy for CORS), Three.js golden dust + god-rays + bride/groom cutouts, hero skyline clip-mask.

## Run locally

```powershell
cd D:\manoz\mamatharun
node server.js
# https://mamatharun.site  health -> /health
```

Zero deps — pure Node `http` + `https` proxy.

Env:

```
PORT=3000 HOST=0.0.0.0 NODE_ENV=production
CDN_BASE=https://cdn.riwaaz.in/wedding-websites/themes/rameswaram
LOG_LEVEL=silent|info|debug
```

## Production ready — what was hardened

- `server.js` — security headers, path-traversal guard, GET/HEAD allowlist, proper mimes, HTML no-cache + assets immutable cache, Graceful shutdown SIGTERM/SIGINT, health endpoint, local manifest fallback, CDN timeout 15s
- `api/cdn.js` + `api/health.js` — Vercel/Netlify serverless compat (works with `?path=` rewrite), CORS, manifest fallback, immutable frame caching
- `vercel.json` — modern `rewrites` + `headers`, frame assets immutable, security headers
- `netlify.toml` — functions + redirects + headers
- `Dockerfile` + `docker-compose.yml` + `.dockerignore` — non-root user, healthcheck, prod env
- `render.yaml`, `Procfile`, `ecosystem.config.js` — Render/Heroku/PM2
- `nginx.conf.example` — reverse-proxy example with CDN proxy
- SEO: OG + Twitter + canonical + preload `es-module-shims`, `robots.txt`, `sitemap.xml`

## Deploy

### Vercel (recommended — 0 config)

```bash
vercel --prod
# or push to GitHub and Import Project
```

- Static files served natively, `/api/cdn/*` -> Vercel function (CORS fix), `/health` -> `/api/health`
- Set env `CDN_BASE` if you self-host frames
- CDN frames proxied to `cdn.riwaaz.in` so film works despite Riwaaz no ACAO

### Netlify

```bash
netlify deploy --prod
# or connect repo — it uses netlify.toml + api/ functions + _redirects fallback
```

### Docker

```bash
docker build -t mamatharun .
docker run -p 3000:3000 -e NODE_ENV=production mamatharun
# or
docker-compose up -d
```

### Render / Railway / Fly / Heroku

- Render: uses `render.yaml` — just connect repo, healthCheck `/health`
- Railway / Fly: `node server.js`, uses $PORT env
- Heroku: `Procfile` present

### Nginx / VPS

```bash
node server.js &
# use nginx.conf.example as template
# pm2 start ecosystem.config.js --env production
pm2 save
```

## API

- `GET /` → index.html (wedding film)
- `GET /health` → {status, version, uptime}
- `GET /api/cdn/frames/manifest.json` → CDN proxied + local fallback `public/assets/frames-manifest.json`
- `GET /api/cdn/frames/desktop/001.webp?v=cors2` → CDN frame sheet
- `GET /api/cdn/poster.jpg` / `hero-skyline.json` → CDN
- All assets + `/public/*`, `/js/*`, `/*.css` cached immutable in prod

## Customize

- `index.html` — couple names, phone contacts (data + tel: links), maps link
- `js/wedding.js` — events, ICS generation
- `public/assets/bride.png`, `groom.png` — replace the bride and groom PNG cutouts (served at `/assets/*`)

## Verification

```
styles-exact.css 25201 bytes original
poster.jpg 48752 bytes exact CDN copy
hero-skyline.json 146336 bytes exact
frames-manifest.json 24fps, 1210 frames, 152 sheets
```
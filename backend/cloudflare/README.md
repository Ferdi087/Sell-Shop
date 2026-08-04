# Cloudflare Worker Backend fuer Sell-Shop

Dieses Backend loest das CORS-Problem von GitHub Pages, indem Backblaze B2 nur serverseitig angesprochen wird.

## 1) Voraussetzungen

- Node.js installiert
- Cloudflare-Account
- Wrangler CLI

```bash
npm i -g wrangler
```

## 2) Dateien vorbereiten

- `wrangler.toml.example` nach `wrangler.toml` kopieren
- In `wrangler.toml` den Origin anpassen:
  - `ALLOWED_ORIGIN = "https://ferdi087.github.io"`

## 3) Secrets setzen

Im Ordner `backend/cloudflare` ausfuehren:

```bash
wrangler secret put B2_KEY_ID
wrangler secret put B2_APP_KEY
```

Optional (wenn nicht im Key eingeschraenkt):

```bash
wrangler secret put B2_BUCKET_ID
wrangler secret put B2_BUCKET_NAME
```

## 4) Deploy

```bash
wrangler deploy
```

Danach bekommst du eine URL wie:

- `https://sell-shop-api.<name>.workers.dev`

## 5) Frontend konfigurieren

Im Projekt-Root eine `.env` anlegen:

```env
VITE_API_BASE_URL=https://sell-shop-api.<name>.workers.dev
```

Dann neu bauen/deployen:

```bash
npm run build
```

## 6) Verfuegbare Endpunkte

- `GET /tools`
- `GET /games`
- `GET /download-url?fileName=v/tool/tool.exe`

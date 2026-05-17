# Deployment

API routes are stateless and read every secret from the environment at request time, so the app runs anywhere that hosts a Next.js Node server. The two supported targets are **Fly.io** (managed containers) and **self-hosted Docker Compose**; both reuse the existing [Dockerfile](Dockerfile) and the standalone Next.js output it builds.

For environment variables and per-route behavior, see the [Environment](README.md#environment) and [API](README.md#api) sections of the README. For the rate-limiter design that REDIS_URL feeds, see the [Design Decisions](README.md#design-decisions) entry on rate limiting.

## Fly.io

Fly reads the repo's [Dockerfile](Dockerfile) directly and runs the resulting image as a long-lived machine, so there are no cold starts and the Node runtime is unrestricted — important because the limiter and the RapidAPI call both depend on `node:` APIs that don't run on edge platforms.

```bash
# 1. Once per machine
fly auth login

# 2. Create the app — accept defaults; do NOT let it provision a Postgres or
#    deploy yet (you want secrets set first). This writes a fly.toml; commit it.
fly launch --no-deploy

# 3. Provision Upstash Redis inside Fly's private network and capture the URL
fly redis create   # follow the prompts; copy the redis:// connection string

# 4. Set secrets (REDIS_URL pastes the string from the previous step)
fly secrets set \
  GOOGLE_GEMINI_API_KEY=... \
  RAPIDAPI_KEY=... \
  REDIS_URL=redis://...

# 5. Deploy
fly deploy
```

Notes:
- Pick a region close to your users when `fly launch` asks — image search and Gemini latency dominate request time, so the app region mostly affects baseline RTT.
- Fly machines stay running by default. If you want scale-to-zero for a low-traffic demo, set `auto_stop_machines = true` and `min_machines_running = 0` in the generated `fly.toml` — the first request after idle eats one cold start (~1–2s).
- Update deploys with `fly deploy`; roll back with `fly releases` + `fly deploy --image <previous>`.

## Self-hosting via Docker Compose

[docker-compose.yml](docker-compose.yml) brings up the app alongside a Redis sidecar and wires `REDIS_URL` automatically.

```bash
# At the repo root, create a .env with your API keys (Compose interpolates these
# into the `app` service's environment block).
cat > .env <<'EOF'
GOOGLE_GEMINI_API_KEY=...
RAPIDAPI_KEY=...
EOF

docker compose up --build -d
```

The app listens on `0.0.0.0:3000` inside the container and is published to the host on the same port. For production self-hosts, front it with a reverse proxy that terminates TLS and forwards `X-Forwarded-For` (Caddy and Nginx do this by default) — the rate limiter keys on that header, so without it every caller shares one bucket. The bundled Redis is persistence-disabled by design (rate-limit counters resetting on container restart is acceptable; restart loops are not); add a volume if you ever store anything else there.

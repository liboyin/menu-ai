# MenuAI

A stateless web app that turns a photo of a restaurant menu into an interactive, filterable digital menu with an AI chat assistant grounded in that menu. See [PRD.md](PRD.md) for product scope.

## Architecture

Next.js 15 single-page app (App Router) with two API routes. No database, no session storage — the menu JSON lives in the browser state and is re-sent with every chat request.

```
assets/                             UAT test fixtures (images committed; non_image.txt gitignored)
src/
├── app/
│   ├── api/
│   │   ├── process-menu/route.ts   POST: images → ProcessedMenu
│   │   └── chat/route.ts           POST: { message, menu } → { response }
│   ├── layout.tsx                  Root layout + metadata
│   ├── page.tsx                    Upload-or-display switch
│   └── globals.css                 Tailwind entry + custom utilities
├── components/
│   ├── ImageUpload.tsx             Drag-drop / file picker (JPG/PNG/WEBP)
│   ├── MenuDisplay.tsx             Header, filter+card list, chat container
│   ├── MenuCard.tsx                Single-dish horizontal card
│   ├── MenuFilters.tsx             Price range + ingredient search
│   └── ChatInterface.tsx           Chat panel (sidebar desktop, modal mobile)
├── lib/
│   ├── menu-processor.ts           Gemini vision call + image enrichment
│   ├── chat-processor.ts           Gemini chat call grounded in menu JSON
│   └── rate-limit.ts               Per-IP rate limiting (Memory or Redis)
├── types/menu.ts                   MenuItem, ProcessedMenu
└── test-helpers/menu-data.ts       Shared fixtures
```

The single shared type is in [src/types/menu.ts](src/types/menu.ts):

```ts
interface MenuItem {
  id: string
  name: string
  price: string | null          // raw string with currency, or null for market/unknown
  description?: string
  ingredients: string[]
  image?: string                // URL from image search or placeholder
}
interface ProcessedMenu { items: MenuItem[] }
```

## Dataflow

**Upload → Display:**

1. User selects/drops images in [ImageUpload](src/components/ImageUpload.tsx). The client filters to `image/jpeg|png|webp` and POSTs a `multipart/form-data` with field name `images` to `/api/process-menu`.
2. [`processMenuImages`](src/lib/menu-processor.ts) base64-encodes each image, calls Gemini (`gemini-3.1-flash-lite`) once with all images plus a prompt that asks for a strict JSON array of `{id, name, price, description, ingredients}`. A regex extracts the first `[...]` block from the response.
3. For each item, [`searchDishImage`](src/lib/menu-processor.ts) calls the RapidAPI Real-time Image Search endpoint by dish name and attaches the first result URL. Failures (missing key, network error, no result) resolve to `https://placehold.co/600x400?text=Image+Not+Found` rather than throwing.
4. The enriched `ProcessedMenu` is returned to the client and stored in React state. [MenuDisplay](src/components/MenuDisplay.tsx) takes over the page.

**Filtering:** [MenuFilters](src/components/MenuFilters.tsx) computes min/max from numeric prices (currency symbols stripped via `replace(/[^0-9.]/g, '')`) and recomputes the filtered list whenever range or ingredient text changes. Items with `price === null` always pass the price filter. Ingredient match is a case-insensitive substring over `item.ingredients`.

**Chat:** [ChatInterface](src/components/ChatInterface.tsx) POSTs `{ message, menu }` JSON to `/api/chat`. [`generateChatResponse`](src/lib/chat-processor.ts) inlines the full menu JSON into a system-style prompt that tells Gemini to answer only from the menu and refuse out-of-scope questions. The response is rendered as markdown via `react-markdown`.

## Design Decisions

- **Single multi-modal call, no OCR step.** Gemini handles layout interpretation, text extraction, and structuring in one prompt — the PRD originally proposed OCR + LLM and was revised to drop OCR.
- **Stateless / no backend storage.** The menu JSON is the only state. Chat re-sends it each turn so the server has zero session memory; this also makes the API trivially horizontal-scalable.
- **`price` is `string | null`, not a number.** Preserves currency symbols and original formatting for display. Numeric conversion only happens inside the filter for range comparison.
- **Null-priced items pass every price filter.** A "market price" dish should never be hidden by a budget slider — the user has no number to compare against, so excluding it would be a silent data loss.
- **Trivial ingredients filtered at the LLM prompt**, not in client code. The prompt explicitly skips salt/water/pepper/sugar/oil so they never enter the data model.
- **Image search failures degrade, not fail.** Menu rendering must work even when RAPIDAPI_KEY is missing, so `searchDishImage` returns a placeholder URL on every error path. `next.config.js` allows remote images from any host because dish image URLs are arbitrary.
- **Chat is sidebar on desktop, full-height modal on mobile.** `MenuDisplay` renders `<ChatInterface>` twice — once in `hidden lg:block` for desktop and once inside a `lg:hidden` modal toggled by a header button.
- **Model:** `gemini-3.1-flash-lite` for both endpoints, chosen for cost/latency over Pro.
- **Rate limiting is per-IP and shared via Redis when `REDIS_URL` is set.** Both routes consume one point per call against a 10-per-hour bucket keyed on the first `x-forwarded-for` entry (Vercel and most reverse proxies set this). When `REDIS_URL` is unset, the limiter falls back to a per-process in-memory store — fine for single-container self-hosts, but insufficient on Vercel or behind a load balancer where each instance keeps its own counter. The limiter fails *open* (logs and allows) when Redis is unreachable, since its purpose is to cap third-party API spend, not enforce correctness.

## API

### `POST /api/process-menu`
- Body: `multipart/form-data`, field `images` (1–4 files, max 5MB each)
- 200: `ProcessedMenu`
- 400: `{ error: "No images provided" }` / `{ error: "Too many images: limit is 4" }` / `{ error: "Image \"<name>\" exceeds 5MB limit" }`
- 429: `{ error: "Rate limit exceeded. Please try again later." }` — with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` headers
- 500: `{ error: "Failed to process menu images" }`

### `POST /api/chat`
- Body: `application/json`, `{ message: string, menu: ProcessedMenu }`
- 200: `{ response: string }` (markdown)
- 400: `{ error: "Message and menu are required" }`
- 429: `{ error: "Rate limit exceeded. Please try again later." }` — with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` headers
- 500: `{ error: "Failed to process chat message" }`

Successful responses also carry `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers reflecting the caller's current bucket.

## Environment

Copy `.env.example` at the repo root to `.env.local`, and provide your API keys:

- `GOOGLE_GEMINI_API_KEY` — required. Both routes throw without it.
- `RAPIDAPI_KEY` — optional. Without it, every dish gets the placeholder image.
- `REDIS_URL` — optional locally, required for multi-instance deployments (Vercel, multi-container self-hosts). Without it the rate limiter is per-process. The bundled [docker-compose.yml](docker-compose.yml) wires this to a sidecar Redis automatically.

## Development

The repo ships a dev container ([.devcontainer/devcontainer.json](.devcontainer/devcontainer.json), `mcr.microsoft.com/devcontainers/typescript-node`). Per [AGENTS.md](AGENTS.md), AI agents should work inside the container.

```bash
npm install
npm run dev          # next dev on http://localhost:3000
npm run build        # production build
npm run lint         # next lint (ESLint flat config, next/core-web-vitals + next/typescript)
npm run test         # jest
npm run test:coverage   # jest --coverage; 85% gate on statements/branches/functions/lines
```

Tests use Jest + `jest-environment-jsdom` + `@testing-library/react`. Module-level mocks live alongside their targets (`src/lib/__mocks__/https.ts`, `src/lib/__mocks__/@google/generative-ai.ts`, `src/__mocks__/react-markdown.tsx`). Shared fixtures are in [src/test-helpers/menu-data.ts](src/test-helpers/menu-data.ts). Test conventions are documented in [AGENTS.md](AGENTS.md).

## Deployment

Designed for serverless platforms (Vercel is the natural fit given Next.js). API routes are stateless and read both keys from environment variables at request time.

**Self-hosting via Docker Compose:** [docker-compose.yml](docker-compose.yml) brings up the app alongside a Redis sidecar and wires `REDIS_URL` automatically. Provide `GOOGLE_GEMINI_API_KEY` and `RAPIDAPI_KEY` via your shell or a root-level `.env`, then `docker compose up --build`.

**Vercel:** set `GOOGLE_GEMINI_API_KEY`, `RAPIDAPI_KEY`, and a Redis URL (Vercel KV or Upstash) under Environment Variables. Without `REDIS_URL` the in-memory limiter still works inside a single Lambda, but each cold start and each parallel Lambda instance keeps its own counter, so the per-IP cap effectively multiplies by the number of warm instances.

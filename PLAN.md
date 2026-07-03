# MenuAI — Project Review & Improvement Plan (Hand-over)

**Date:** 2026-07-03
**Author:** Claude (comprehensive project review; read-only — no code changes made)
**Verification at time of review:** `npm run lint` clean; `npm run test:coverage` 119/119 passing, all measured files ≥85% on every metric.

This document is a hand-over: a full review of the project (bugs, security/infra concerns, code smells, doc drift) followed by a prioritized improvement plan scoped to the product's designed purpose (see [PRD.md](PRD.md)). Each finding links to the relevant file/line as of commit `a518912`.

---

## Overall verdict

Well-above-average small project. Documentation discipline is exemplary (README design-decision log, PRD with change history, UAT plan with executed results), the pure-function extraction into `lib/` makes testing honest, and infra decisions (fail-open limiter, graceful image degradation, SVG blocking) are deliberate and written down. Findings are mostly at the edges: the LLM trust boundary, the rate limiter's spoofability, one genuinely broken UI path (chat markdown), and the absence of CI.

---

## 1. Correctness bugs

### 1.1 Chat markdown renders unstyled — `prose` classes are dead
[ChatInterface.tsx:143](src/components/ChatInterface.tsx#L143) uses `prose prose-sm`, but `@tailwindcss/typography` is not in [package.json](package.json). Tailwind v4's preflight strips list bullets/margins and nothing restores them — while [chat-processor.ts:44](src/lib/chat-processor.ts#L44) explicitly instructs Gemini to "Use markdown for lists". The most common bot answer shape (a list of dishes) renders as flat, unbulleted text. Same family as UAT DEF-01 (Tailwind v3/v4 drift); invisible to jsdom tests.

### 1.2 LLM output trusted far beyond what's validated
[menu-processor.ts:140-142](src/lib/menu-processor.ts#L140-L142) only checks `item.name` is truthy. Downstream assumes much more:

- `filterMenuItems` calls `item.ingredients.some(...)` ([menu-filters.ts:74](src/lib/menu-filters.ts#L74)) and `MenuCard` calls `item.ingredients.slice(0,4)` ([MenuCard.tsx:65](src/components/MenuCard.tsx#L65)) — missing/non-array `ingredients` crashes the render.
- If Gemini returns `price` as a JSON number (UAT DEF-02 showed the format drifting), `extractPrice`'s `priceStr.replace` throws ([menu-filters.ts:19](src/lib/menu-filters.ts#L19)). The `string | null` type is a fiction at this boundary.
- `id` (used as React key) is whatever the model emits; duplicates break the list. `id` could be assigned server-side after parsing instead of requested in the prompt.

### 1.3 No error boundary
No `error.tsx`/`global-error.tsx` in [src/app/](src/app/). Combined with 1.2, one malformed LLM item turns the app into Next's default error screen with no path back.

### 1.4 Server error detail never reaches the user
[menu-client.ts:33](src/lib/menu-client.ts#L33) throws a generic `'Failed to process menu images'` for any non-OK response. The 400 bodies ("Too many images: limit is 4", "exceeds 5MB limit") and — worse — the 429 rate-limit message are discarded; a rate-limited user is told processing "failed" with no hint to wait. Chat has the same flaw ([ChatInterface.tsx:82-83](src/components/ChatInterface.tsx#L82-L83)). The error contract is documented in the README but never consumed.

### 1.5 Client doesn't enforce the upload limits it's judged by
[ImageUpload.tsx](src/components/ImageUpload.tsx) filters MIME type but not count (≤4) or size (≤5MB). Modern phone photos are routinely 4–8MB, so the most natural mobile flow can fail with the generic message from 1.4. Meanwhile the server never validates MIME at all ([process-menu/route.ts:50](src/app/api/process-menu/route.ts#L50) casts `formData.getAll()` with `as File[]` unchecked) — the two layers validate disjoint things.

### 1.6 Chat has no conversation memory
[ChatInterface.tsx:76-79](src/components/ChatInterface.tsx#L76-L79) sends only the current message + menu; prior turns are never included, so follow-ups ("which of those is cheapest?") cannot work. PRD F2.2 calls this "conversational AI". The stateless *server* is documented; the conversation having no context is an undocumented product limitation.

### 1.7 Two `ChatInterface` mounts = divergent chat histories
README documents that [MenuDisplay.tsx](src/components/MenuDisplay.tsx#L94-L118) renders the chat twice (desktop sidebar + mobile modal), but not the consequence: each instance owns its own `messages` state, so resizing/rotating loses the visible conversation. Lifting messages state into `MenuDisplay` fixes it cheaply.

### 1.8 Minor
- `Date.now().toString()` message IDs can collide ([ChatInterface.tsx:60](src/components/ChatInterface.tsx#L60)).
- `MenuFilters` initializes `priceRange` to `[0,100]` and corrects it in an effect, so items priced >$100 flicker out and back on first render ([MenuFilters.tsx:25-37](src/components/MenuFilters.tsx#L25-L37)); the broader "sync state via useEffect chains" pattern is a known React antipattern — derived data would be simpler computed in the parent with `useMemo`.
- `extractPrice` turns European `"12,50"` into `1250` (mitigated by the prompt's `$X.XX` normalization, but fragile on exactly the data 1.2 shows can drift).

---

## 2. Security & infra concerns

### 2.1 Rate limiter trivially bypassable on the primary deployment target
[rate-limit.ts:122-131](src/lib/rate-limit.ts#L122-L131) keys on the *first* `x-forwarded-for` entry. Vercel overwrites that header, but Fly.io — the documented target — *appends* to whatever the client sends, as do default nginx configs. So `curl -H "X-Forwarded-For: $RANDOM"` gets a fresh bucket per request, defeating the limiter's stated purpose (capping third-party API spend). Fix: prefer a platform-authoritative header (`Fly-Client-IP` on Fly), or take the right-most untrusted-hop entry, and document the trust model per target. The README's claim that first-entry is what "Vercel and most reverse proxies set" is the one factually shaky design-decision entry.

### 2.2 Wildcard `remotePatterns` makes `/_next/image` an open proxy / SSRF vector
[next.config.js](next.config.js) allows `http(s)://**`, so the optimizer will fetch *any* URL passed to `/_next/image?url=...` — including internal addresses and cloud metadata endpoints, from the server, with no rate limit (it's not an API route). The README documents the wildcard and the SVG mitigation, but not this consequence. Options: mark dish images `unoptimized` (browser fetches directly — kills SSRF, loses optimization, leaks user IPs to arbitrary hosts), or proxy through an own route with private-IP blocking.

### 2.3 `/api/chat` accepts an unbounded, unvalidated body
[chat/route.ts:43](src/app/api/chat/route.ts#L43) destructures `{message, menu}` with no size cap or shape check, and [chat-processor.ts:36](src/lib/chat-processor.ts#L36) inlines `menu.items` straight into the prompt. Each of a caller's 10 hourly requests can carry megabytes of "menu" into Gemini — the rate limit caps request *count*, not token *cost*, which is the thing being protected. A cheap items-count/JSON-size cap and shape check closes it. (Prompt injection through `message`/menu content is inherent to the design and low-stakes here, but deserves a line in the design-decision log as accepted risk.)

### 2.4 No CI whatsoever
No `.github/workflows/`. [AGENTS.md](AGENTS.md) makes `test:coverage` + `lint` a MUST after every change, but only agent discipline enforces it. Single highest-leverage infra gap: a ~20-line GitHub Actions workflow (lint, coverage, `next build`, optionally the Docker build) turns the documented gate into a real one. Relatedly, [update_dependencies.sh](update_dependencies.sh) says "run monthly" but nothing runs it.

### 2.5 Coverage gate has a silent hole
[jest.config.js](jest.config.js) sets per-file 80% thresholds but no `collectCoverageFrom`, so Jest only measures files that tests happen to import. [page.tsx](src/app/page.tsx) and [layout.tsx](src/app/layout.tsx) appear nowhere in the coverage report — untested files are invisible to the "≥80% for each file" rule rather than failing it.

### 2.6 Container/runtime hygiene
No `HEALTHCHECK` in [Dockerfile](Dockerfile) and no healthcheck for the `app` service in [docker-compose.yml](docker-compose.yml) (redis has one); no `/api/health` endpoint for Fly checks. Observability is bare `console.error`, triple-logged: `analyzeMenuWithAI` logs and rethrows, `processMenuImages` logs and rewraps, the route logs again — producing `"Failed to process menu images: Failed to analyze menu with AI: ..."` which is then discarded for a generic 500. One structured log at the route with a request ID would say more with less.

### 2.7 Unbounded fan-out to RapidAPI
[menu-processor.ts:30-35](src/lib/menu-processor.ts#L30-L35) fires one image-search request per item concurrently — a 60-item menu is 60 simultaneous calls, which is how RapidAPI's own limits get tripped, quietly yielding 60 placeholders. A small concurrency pool (5–8) fixes it.

### 2.8 package.json / repo hygiene
- No `"private": true` (accidental `npm publish` footgun); `"main": "index.js"` points at a nonexistent file; `description` empty.
- `typescript`, `eslint`, `eslint-config-next`, `@types/*` in `dependencies` instead of `devDependencies` (runtime image unaffected due to standalone output, but the categorization misleads).
- Uncommitted working-tree drift at review time: modified `package-lock.json`, untracked `.vscode/` and `.devcontainer/devcontainer-lock.json` — decide commit-or-ignore.
- [DEPLOYMENT.md](DEPLOYMENT.md) says `fly launch` "writes a fly.toml; commit it," yet none is committed — either Fly was never used or the instruction wasn't followed.

---

## 3. Code smells & antipatterns

- **Hand-rolled `https.request` + manual Promise** in [menu-processor.ts:169-231](src/lib/menu-processor.ts#L169-L231), on a Node 22 baseline that has global `fetch`. `fetch(url, { signal: AbortSignal.timeout(8000) })` deletes ~50 lines *and* the custom [https mock](src/lib/__mocks__/https.ts). Contradicts the AGENTS.md guideline to use up-to-date platform features; reads as legacy accretion.
- **Regex JSON extraction** (`text.match(/\[[\s\S]*\]/)`, [menu-processor.ts:128](src/lib/menu-processor.ts#L128)) when Gemini supports structured output (`responseMimeType: 'application/json'` + `responseSchema`). Structured output would eliminate the regex, most of the prompt's "return only valid JSON" pleading, and half of finding 1.2.
- **Deprecated SDK.** `@google/generative-ai` was deprecated in favor of `@google/genai` (support ended late 2025). Still works, but accumulating risk on the project's most critical dependency. (The unusual `gemini-3.1-flash-lite` model name is explicitly documented as intentional in [UAT_SETUP.md](UAT_SETUP.md) — good.)
- **Placeholder URL literal repeated five times** in menu-processor.ts — extract a constant.
- **[types/menu.test.ts](src/types/menu.test.ts) tests nothing.** It constructs object literals and asserts their own properties; interfaces are erased at compile time. By the project's own test guideline ("a test that does not fail when business logic changes is wrong") this file should be deleted.
- **Accessibility gaps** (PRD NF1.5): icon-only buttons (chat toggle, modal close, send, clear) lack `aria-label`; the mobile chat modal has no `role="dialog"`, focus trap, or Escape handling — UAT-15's pass criterion "menu content underneath is not focusable" is not actually implemented; the price-range label isn't associated with its inputs.

---

## 4. Documentation drift (violations of the project's own MUST rules)

- [UAT_PLAN.md:3](UAT_PLAN.md#L3) says "Next.js 15 SPA"; README and lockfile say Next 16.
- [UAT_PLAN.md](UAT_PLAN.md) UAT-26 expects placeholder `https://placehold.co/600x400?text=...` without `.png` — but the `.png` suffix is load-bearing (the documented SVG/XSS mitigation). The UAT expectation would pass on a regression of that exact defense.
- [README.md:107](README.md#L107) annotates `npm run lint` as "next lint"; the script is plain `eslint .`.
- Undocumented behaviors worth a design-decision line: chat has no conversation history (1.6), XFF trust model (2.1), image-optimizer exposure (2.2), accepted prompt-injection surface (2.3).

---

## 5. Improvement plan (within the designed purpose)

### P0 — correctness & security, small diffs
1. **Harden the LLM trust boundary**: validate/coerce items after parsing (zod or a hand-rolled coercer: `ingredients` → string array, `price` → string|null, drop unknown fields), assign `id`s server-side. Fixes 1.2 and shrinks the prompt.
2. **Fix rate-limit keying** (right-most XFF hop / `Fly-Client-IP`; document per-target trust). **Add a shape + size cap on the chat body** (2.1, 2.3).
3. **Fix chat markdown**: add `@tailwindcss/typography` (or ~a dozen lines of scoped CSS for lists/strong in `globals.css`) (1.1).
4. **Add `src/app/error.tsx`; surface server error bodies** (esp. 429) in `menu-client.ts` and `ChatInterface` (1.3, 1.4).
5. **Mirror the 4-image/5MB limits client-side** with a visible message; validate MIME server-side (1.5).
6. **`"private": true`, remove `"main"`, move tooling to `devDependencies`** (2.8).

### P1 — infra
7. **GitHub Actions**: lint + `test:coverage` + `next build` on push/PR; optionally a monthly scheduled job wrapping `update_dependencies.sh` (2.4).
8. **`collectCoverageFrom: ['src/**/*.{ts,tsx}']`** so the 80% per-file gate sees every file (2.5).
9. **`/api/health` route + Docker/compose healthchecks**; one structured log line per request at the routes; un-nest the double error wrapping (2.6).
10. **Decide the `/_next/image` policy** (unoptimized vs. allowlist vs. proxy) and record it in README Design Decisions (2.2).

### P2 — product-visible wins, still in scope
11. **Client-side downscale/re-encode before upload** (canvas → JPEG ≤ ~1600px). Simultaneously fixes the 5MB phone-photo failure and attacks the observed 35s processing latency (UAT DEF-04) at its input-size root, plus cuts Gemini cost.
12. **Return the menu immediately, enrich dish images afterward** (lazy per-card fetch or a second endpoint) — image search is pure decoration and currently gates first paint of the whole menu.
13. **Send a bounded chat history** (last ~6 turns) with each request; **lift chat state into `MenuDisplay`** so both mounts share one conversation (1.6, 1.7). Consider streaming the chat response for the NF4 <2s feel.
14. **Switch to Gemini structured output; migrate `@google/generative-ai` → `@google/genai`; replace `https.request` with `fetch` + `AbortSignal.timeout`.**
15. **A11y pass** (aria-labels, dialog semantics + focus trap + Escape); **cap RapidAPI concurrency** (2.7).

### P3 — hygiene
16. Delete `types/menu.test.ts`; fix the three doc-drift items in §4; extract the placeholder constant; resolve the untracked `.vscode/`/lockfile state; commit a `fly.toml` if Fly is real.

---

## Recommended starting point

**P0.1 + P0.2 together**: everything user-facing rests on unvalidated model output, and everything cost-facing rests on a spoofable rate limiter — those two diffs close both of the project's real trust gaps.

## Notes for whoever picks this up

- Work inside the dev container (AGENTS.md requirement); `npm run test:coverage` and `npm run lint` must pass after every change.
- Update README/PRD/UAT docs in the same change as any behavior they describe (single-source-of-truth rule).
- Commit message format and per-change commit granularity are specified in [AGENTS.md](AGENTS.md).
- Items in this plan are individually small; each P0/P1 item is a good single commit. P2 items 11–13 are user-visible and should get a UAT scenario each when implemented.

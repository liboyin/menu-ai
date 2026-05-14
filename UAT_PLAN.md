# MenuAI — UAT Test Plan (Playwright-MCP)

**Target:** MenuAI (Next.js 15 SPA, `src/app/page.tsx`)
**Execution environment:** Claude Code desktop app with the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) enabled.
**Author:** Claude
**Last updated:** 2026-05-13

This plan validates the functional and non-functional requirements in [PRD.md](PRD.md) against the running app. Tests are intended to be executed sequentially by a human-supervised Claude Code session that drives a real browser via Playwright-MCP. Each scenario is self-contained so it can be re-run on its own; shared fixtures (dev server, sample image) are set up once in **Section 2**.

> ⚠️ This plan must not be run from inside the project's dev container — Playwright-MCP launches a real Chromium on the host. Use the Claude Code desktop app on macOS/Windows/Linux host with the repo cloned locally.

---

## 1. Scope

### 1.1 In scope
- Functional requirements F1.1–F1.4 (ingestion), F2.1–F2.2 (display & chat), F3.1–F3.4 (filtering) from [PRD.md](PRD.md).
- Non-functional NF1.5 (UI/UX), NF4 (perceived performance).
- End-to-end golden path: upload → process → display → filter → chat → reset.

### 1.2 Out of scope
- Unit/integration coverage (covered by `npm run test:coverage`).
- Real backend load testing.
- Network-condition simulation beyond Playwright defaults.
- Authentication / multi-user (the app is stateless).
- QR code menus and handwritten menus (PRD §6 Out of Scope).

---

## 2. Prerequisites & Setup

### 2.1 Host requirements
- Node.js 20+ and `npm` available.
- Repo cloned at a known absolute path (referred to below as `$REPO`).
- Valid `.env.local` at `$REPO/.env.local` containing `GOOGLE_GEMINI_API_KEY` and `RAPIDAPI_KEY`. **Do not run UAT against a placeholder key — F1.2/F1.3 require live keys.**
- Playwright-MCP installed and registered in Claude Code's MCP settings (`@playwright/mcp` or equivalent).

### 2.2 Test fixtures
| Fixture | Path | Purpose |
| :--- | :--- | :--- |
| `sample_menu.jpg` | `$REPO/sample_menu.jpg` | Known-good menu, used by UAT-02 / UAT-03 / UAT-07 onward |
| `not_a_menu.png` | tester-supplied | Photo of an unrelated subject for UAT-21 |
| `category_priced_menu.jpg` | tester-supplied | Menu whose prices are stated per category (e.g. "Sandwiches $15") rather than per item, for UAT-25 |
| `non_image.txt` | tester-supplied | Plain text file for UAT-05 (invalid file-type rejection) |

The tester is responsible for sourcing `not_a_menu.png`, `category_priced_menu.jpg`, and `non_image.txt`. If unavailable, mark the corresponding scenarios as **Blocked**, not Failed.

### 2.3 Bring-up sequence (run once per session)
1. From `$REPO`, run `npm install` (only if `node_modules/` is stale).
2. Start the dev server in a terminal: `npm run dev`. Wait for the line `▲ Next.js … Ready in …`.
3. In Claude Code, instruct the agent to:
   - `browser_install` (only on first run).
   - `browser_navigate` to `http://localhost:3000`.
   - `browser_snapshot` and confirm the landing-page header reads **"MenuAI"**.
4. Verify [.env.local](.env.local) is loaded by checking the dev server log — there should be no `GOOGLE_GEMINI_API_KEY is not set` warning on the first upload.

### 2.4 Tear-down
- Close the browser (`browser_close`).
- Stop the dev server with `Ctrl+C` in its terminal.
- No cleanup of server-side state is needed — the app is stateless (NF2).

---

## 3. Playwright-MCP tool cheat-sheet

Mapped to the [Playwright MCP](https://github.com/microsoft/playwright-mcp) tool names. Use exactly these in test steps below.

| Action | MCP tool | Notes |
| :--- | :--- | :--- |
| Open URL | `browser_navigate` | Always check the response for `200`. |
| Snapshot DOM (preferred over screenshot for assertions) | `browser_snapshot` | Returns the accessibility tree with `ref` IDs. |
| Take screenshot | `browser_take_screenshot` | Use for visual evidence only. |
| Click an element | `browser_click` | Pass the `ref` from the most recent snapshot. |
| Type text | `browser_type` | For input fields. `submit: true` to press Enter. |
| Upload file | `browser_file_upload` | Pass absolute path(s); auto-detects the dialog. |
| Drag & drop | `browser_drag` | Used for the drag-and-drop image upload. |
| Resize viewport | `browser_resize` | Use the widths in §4.2 for responsive checks. |
| Wait for selector / text | `browser_wait_for` | Prefer `text:` over hard timeouts. |
| Read console errors | `browser_console_messages` | Assert no `error`-level messages at end of each scenario. |
| Read network calls | `browser_network_requests` | Used to verify `/api/process-menu` and `/api/chat`. |
| Run JS in page | `browser_evaluate` | Use sparingly, e.g. to read `localStorage` (should always be empty — NF2). |

**Convention:** before every interaction, take a `browser_snapshot`. After every interaction that changes state, take another snapshot and assert on the diff.

---

## 4. Test environment matrix

### 4.1 Browser
Default: Chromium (Playwright bundled). Re-run **smoke set** (UAT-01, UAT-02, UAT-09, UAT-15, UAT-18) on Firefox and WebKit if cross-browser sign-off is needed.

### 4.2 Viewports

| Profile | `browser_resize` (W × H) | Purpose |
| :--- | :--- | :--- |
| Mobile | 390 × 844 (iPhone 14) | F2.2.4 modal chat, F3.4 collapsible filters, F2.1 horizontal cards |
| Tablet | 820 × 1180 (iPad Air) | Sanity check breakpoint behaviour |
| Desktop | 1440 × 900 | F2.2.4 sidebar chat, NF1.5 desktop layout |

Each functional scenario runs **once per applicable viewport** as called out in its "Run on" row.

---

## 5. Test scenarios

> Convention: each scenario lists **Pre**, **Steps**, **Expected**, **Pass criteria**, and **Run on** (viewports). Scenarios assume the bring-up in §2.3 has completed and the browser is on `http://localhost:3000`.

### UAT-01 — Landing page renders with empty state
**Maps to:** F1.1, NF1.5
**Run on:** Mobile, Tablet, Desktop

- **Pre:** Fresh browser session, no menu processed yet.
- **Steps:**
  1. `browser_navigate` → `http://localhost:3000`.
  2. `browser_snapshot`.
- **Expected:**
  - Heading "MenuAI" visible.
  - Tagline "Upload any menu photo and instantly understand every dish with AI".
  - Drop zone with text "Upload menu photos" and "Choose Photos" button.
  - File-type hints "JPG", "PNG", "WEBP".
  - Three feature bullets ("Instant ingredient analysis", "Smart dietary filtering", "Ask questions about dishes").
- **Pass criteria:** All elements present; `browser_console_messages` returns no `error` entries.

---

### UAT-02 — Upload menu via file picker (golden path)
**Maps to:** F1.1, F1.2, F1.3
**Run on:** Desktop (primary), Mobile (smoke)

- **Pre:** UAT-01 passed; `sample_menu.jpg` exists at `$REPO/sample_menu.jpg`.
- **Steps:**
  1. `browser_snapshot` to locate the **Choose Photos** label (it wraps the hidden `<input type="file">`).
  2. `browser_file_upload` with `["$REPO/sample_menu.jpg"]`.
  3. Wait for the upload area to show "Analyzing menu..." and the spinner overlay (`browser_wait_for` text "Processing...").
  4. `browser_wait_for` text "dishes found" with a generous timeout (NF4 target: under 20 s; cap the wait at **45 s** to allow Gemini latency).
- **Expected:**
  - During wait: drop zone shows "AI is reading your menu and extracting dish information"; spinner is animating.
  - After: header reads `<N> dishes found` with `N ≥ 1`.
  - `browser_network_requests` shows exactly one `POST /api/process-menu` with status `200`.
- **Pass criteria:** Menu screen renders with at least one `MenuCard`; processing completed within 45 s; no console errors.

---

### UAT-03 — Upload menu via drag-and-drop
**Maps to:** F1.1
**Run on:** Desktop

- **Pre:** UAT-01 passed; on landing page.
- **Steps:**
  1. `browser_snapshot` to get the drop-zone `ref`.
  2. `browser_drag` with `sample_menu.jpg` from the OS file path onto the drop zone. (Use Playwright-MCP's file-drag helper; if unsupported, simulate via `DataTransfer` in `browser_evaluate` — see §6.)
  3. Observe drop-zone style change: border becomes blue, background slightly scaled.
  4. Wait for processing to complete as in UAT-02.
- **Expected:** During drag-over, the snapshot shows the drop-zone class includes `border-blue-400`. After drop, behaviour matches UAT-02.
- **Pass criteria:** Visual drag-active state observed; menu renders successfully.

---

### UAT-04 — Multi-image upload
**Maps to:** F1.1 ("one or more images")
**Run on:** Desktop

- **Pre:** Landing page; two valid menu images available (`sample_menu.jpg` + a second one; if a second is not available, mark **Blocked**).
- **Steps:** `browser_file_upload` with both paths in a single call.
- **Expected:** Single `POST /api/process-menu` with both files as `images[]` (verify via `browser_network_requests`). Resulting menu contains items from both images.
- **Pass criteria:** Both requests merged into one response; combined item count > items from `sample_menu.jpg` alone.

---

### UAT-05 — Non-image files are filtered out
**Maps to:** F1.1 (input `accept` filter)
**Run on:** Desktop

- **Pre:** Landing page; `non_image.txt` available.
- **Steps:** `browser_file_upload` with `["$REPO/non_image.txt"]`.
- **Expected:** No network request is made; the drop zone remains in its idle state (see `ImageUpload.tsx:38-44` — the component filters by MIME type before calling `onImagesSelected`).
- **Pass criteria:** `browser_network_requests` shows **no** `/api/process-menu` call; no error banner appears; UI is unchanged.

---

### UAT-06 — Processing loading state
**Maps to:** F1.2 (UX during async work), NF4
**Run on:** Desktop

- **Pre:** Landing page.
- **Steps:**
  1. `browser_file_upload` with `sample_menu.jpg`.
  2. Immediately `browser_snapshot`.
- **Expected:** Spinner overlay present; "Choose Photos" button gone; drop zone has `opacity-50 pointer-events-none`. The user cannot trigger a second upload while one is in flight.
- **Pass criteria:** Element states match. Time from upload to first paint of the menu screen logged and **must be < 20 s** for a baseline-quality menu image (NF4).

---

### UAT-07 — Menu card content
**Maps to:** F2.1
**Run on:** Mobile, Desktop

- **Pre:** UAT-02 passed; menu visible.
- **Steps:** `browser_snapshot` and inspect 3–5 random `MenuCard` instances.
- **Expected:** Each card has:
  - Dish name (heading, `<h3>`).
  - Either a `next/image` with `alt={item.name}` OR a placeholder SVG icon when `item.image` is absent (see `MenuCard.tsx` image slot).
  - Either a formatted price (e.g. `$12.99`) **or** italic text "Market price".
  - When `item.description` is present, a paragraph rendered with `line-clamp-2` below the price row (truncated to two lines).
  - Up to 4 ingredient pills + `"+N more"` overflow when applicable.
  - Footer "AI-analyzed ingredients" disclaimer.
- **Pass criteria:** No card has missing name; no card crashes due to absent fields. At least one inspected card with a `description` shows the truncated paragraph; at least one without `description` omits it entirely.

---

### UAT-08 — Market-price items render correctly
**Maps to:** F1.2.2, F2.1
**Run on:** Desktop

- **Pre:** Menu rendered. If the sample menu contains no market-price item, supply a fixture image that does and re-process; otherwise mark **Blocked**.
- **Steps:** Locate a card whose item came back with `price: null` in the network response.
- **Expected:** That card's price slot shows italic "Market price"; the price filter (UAT-09) still includes it.
- **Pass criteria:** Visual + filter behaviour match F1.2.2.

---

### UAT-09 — Filter by price range
**Maps to:** F3.1
**Run on:** Mobile, Desktop

- **Pre:** Menu rendered with at least 3 priced items and 1 market-price item if available.
- **Steps (Desktop):**
  1. Read all currently displayed prices from snapshot.
  2. `browser_type` a new minimum into the first `$` input (e.g. the median priced item's price).
  3. `browser_snapshot` after the input's `onChange` debounces.
  4. Repeat by lowering the maximum.
- **Expected:**
  - Items with `extractPrice(price)` outside the range disappear.
  - Items with `price === null` **always remain** (see `MenuFilters.tsx:35-37`).
  - The blue "active filter" dot appears next to "Filters".
  - `Clear all` link appears.
- **Pass criteria:** Filtering matches calculation; clearing restores all items.

---

### UAT-10 — Filter by ingredient
**Maps to:** F3.2, F3.3
**Run on:** Mobile, Desktop

- **Pre:** Menu rendered. Identify one ingredient that appears in at least one card (e.g. "chicken").
- **Steps:**
  1. `browser_type` "chicken" into the "Contains Ingredient" input.
  2. `browser_snapshot`.
  3. Click the **×** clear icon inside the input; snapshot again.
- **Expected:**
  - Only cards whose `ingredients[]` contains "chicken" (case-insensitive substring) remain.
  - Clear icon resets the input and restores cards.
  - Helper text "Common ingredients like salt, pepper, and oil are filtered out" remains visible.
- **Pass criteria:** Filter matches `MenuFilters.tsx:41-47` semantics.

---

### UAT-11 — Trivial-ingredient exclusion at extraction
**Maps to:** F3.3
**Run on:** Desktop

- **Pre:** Menu rendered (UAT-02 passed).
- **Steps:**
  1. Confirm helper text under the ingredient filter reads "Common ingredients like salt, pepper, and oil are filtered out."
  2. Open the most recent `POST /api/process-menu` response in `browser_network_requests` and scan every `items[].ingredients` array.
  3. As an additional spot-check, type each trivial token (`salt`, `water`, `pepper`, `sugar`, `oil`) into the "Contains Ingredient" filter one at a time.
- **Expected:**
  - Helper text present.
  - **No** item in the API response contains `salt`, `water`, `pepper`, `sugar`, or `oil` as an entry in its `ingredients` array (case-insensitive). Per PRD §3.3 F3.3 (v1.4+), exclusion happens at LLM-extraction time, not client-side filtering — these tokens must be absent from the data model.
  - Filtering by any trivial token yields the "No matches found" empty state (see UAT-12).
- **Pass criteria:** Trivial tokens absent from every `ingredients[]`; helper text matches; any leakage logged as an S2 defect against F3.3.

---

### UAT-12 — Combined filters & empty state
**Maps to:** F3.1, F3.2
**Run on:** Desktop

- **Pre:** Menu rendered.
- **Steps:** Set the ingredient filter to a string guaranteed not to match (e.g. "zzqx").
- **Expected:** The grid is replaced by the empty-state card with heading "No matches found" and copy "Try adjusting your filters or search terms" (see `MenuDisplay.tsx:71-81`).
- **Pass criteria:** Empty state renders; clearing the filter restores all cards.

---

### UAT-13 — Mobile filter collapse / expand
**Maps to:** F3.4
**Run on:** Mobile only

- **Pre:** `browser_resize` 390×844; menu rendered.
- **Steps:**
  1. `browser_snapshot`. Confirm the filter body is hidden by default (the `<div>` with `hidden sm:block`).
  2. Click the "Filters" header.
  3. Snapshot again.
- **Expected:** Body becomes visible; chevron rotates 180°.
- **Pass criteria:** Toggle behaviour works; active-filter dot is visible on the collapsed header when applicable.

---

### UAT-14 — Chat sidebar on desktop
**Maps to:** F2.2, F2.2.4
**Run on:** Desktop

- **Pre:** `browser_resize` 1440×900; menu rendered.
- **Steps:** `browser_snapshot`.
- **Expected:**
  - Sidebar is present on the right (`lg:col-span-1`).
  - Sidebar header `<h3>` reads "AI Assistant" with subtitle "Ask questions about this menu".
  - First (bot) message in the thread reads exactly: "Hi! I can help you find dishes on this menu. Ask about dietary restrictions, ingredients, or specific dishes."
  - Four "Quick questions" buttons visible because `messages.length === 1`.
- **Pass criteria:** All elements present with exact copy as above; no mobile modal trigger button (the speech-bubble icon should be `lg:hidden`).

---

### UAT-15 — Chat modal on mobile
**Maps to:** F2.2.4
**Run on:** Mobile

- **Pre:** `browser_resize` 390×844; menu rendered.
- **Steps:**
  1. Click the speech-bubble icon in the header.
  2. `browser_snapshot`.
  3. Click the dark overlay (or the X button).
  4. Snapshot again.
- **Expected:** Modal slides in from the bottom (height ≈ 80vh, rounded top corners). Clicking outside or X dismisses it; backdrop applies `bg-opacity-50` overlay.
- **Pass criteria:** Open + close paths work; menu content underneath is not focusable while modal is open.

---

### UAT-16 — Quick-question prefills the input
**Maps to:** F2.2.2 (UX)
**Run on:** Desktop

- **Pre:** Chat sidebar visible (greeting state).
- **Steps:** Click "What are the vegan options?".
- **Expected:** Input field's value becomes the clicked text (see `ChatInterface.tsx:100-103`). It is **not** auto-submitted.
- **Pass criteria:** Value matches; no network call is made yet.

---

### UAT-17 — Dietary query end-to-end
**Maps to:** F2.2.1, F2.2.2
**Run on:** Desktop

- **Pre:** Chat sidebar visible.
- **Steps:**
  1. `browser_type` "Which dishes are gluten-free?" into the chat input with `submit: true`.
  2. `browser_wait_for` the "Thinking…" indicator to appear, then disappear.
  3. Capture the assistant reply.
- **Expected:**
  - Exactly one `POST /api/chat` with `200`.
  - Request body contains `{ message, menu }` per `ChatInterface.tsx:62-71`.
  - Reply references **only** dishes that exist in the currently-rendered menu (F2.2.1). If it mentions a dish not on the menu, **fail** the scenario.
  - Quick-questions section disappears once `messages.length > 1`.
  - Response time logged (NF4 target < 2 s; allow up to 5 s).
- **Pass criteria:** All checks pass.

---

### UAT-18 — General dish query
**Maps to:** F2.2.3
**Run on:** Desktop

- **Pre:** Chat sidebar visible.
- **Steps:** Send "Do you have any omelettes?".
- **Expected:** The bot either lists matching items from the menu, or says no, but its claim must align with the items currently shown.
- **Pass criteria:** Same as UAT-17, plus answer factually consistent with the rendered menu.

---

### UAT-19 — Chat error handling
**Maps to:** F2.2 (resilience)
**Run on:** Desktop

- **Pre:** Chat sidebar visible.
- **Steps:**
  1. In Claude Code, before sending: use `browser_evaluate` to monkey-patch `window.fetch` so that calls to `/api/chat` reject. Example:
     ```js
     const orig = window.fetch;
     window.fetch = (u, o) => String(u).includes('/api/chat')
       ? Promise.reject(new Error('forced'))
       : orig(u, o);
     ```
  2. Submit any chat message.
- **Expected:** Bot replies "Sorry, I encountered an error. Please try again." (see `ChatInterface.tsx:88-94`). No app crash.
- **Pass criteria:** Error message shown; UI remains interactive; restore `fetch` after the scenario.

---

### UAT-20 — Reset returns to landing
**Maps to:** UX (no PRD ID)
**Run on:** Desktop

- **Pre:** Menu rendered.
- **Steps:** Click "New Menu" in the header.
- **Expected:** Landing page from UAT-01 reappears with empty state; `processedMenu` is cleared (see `src/app/page.tsx:42-45`).
- **Pass criteria:** Header "MenuAI" visible; uploading a new menu starts a fresh flow.

---

### UAT-21 — Unreadable image error path
**Maps to:** F1.4
**Run on:** Desktop

- **Pre:** Landing page. `not_a_menu.png` available.
- **Steps:** Upload the unreadable image.
- **Expected:** Per PRD §3.1 F1.4 (v1.4+), the backend must return an error response when the model cannot reliably interpret the image, and the frontend must surface a generic failure notice. Acceptable outcomes:
  - Backend returns 500 with `{ error: "Failed to process menu images" }` → frontend shows the red glass-effect "Processing failed" card (see `src/app/page.tsx:72-90`). **This is the expected path.**
  - Backend returns 200 with `items: []` → frontend renders "0 dishes found". This is a tolerated soft-success today but does **not** strictly meet F1.4's "must return an error response" requirement; log an S3 defect noting the empty-list bypass.
- **Pass criteria:** No unhandled exception in console; user is informed processing did not succeed. Capture screenshot for evidence.

---

### UAT-22 — Stateless guarantee
**Maps to:** NF2
**Run on:** Desktop

- **Pre:** After completing UAT-02 (a menu is rendered).
- **Steps:**
  1. `browser_evaluate` `Object.keys(localStorage)` and `Object.keys(sessionStorage)`.
  2. `browser_evaluate` `document.cookie`.
- **Expected:** All return empty (or only standard Next.js dev cookies; specifically, no app-set keys like `menu`, `userId`, `token`).
- **Pass criteria:** No app-set persistence found.

---

### UAT-23 — Responsive breakpoints
**Maps to:** NF1.5
**Run on:** Mobile, Tablet, Desktop (resize within a single browser context).

- **Pre:** Menu rendered.
- **Steps:** Sequentially `browser_resize` to 390×844, 820×1180, 1440×900. Snapshot at each step.
- **Expected:**
  - Mobile: filters collapsed by default; chat opens as modal; cards stack vertically with horizontal layout (image left, text right per `MenuCard.tsx`).
  - Tablet: filters expanded; chat still hidden behind the icon (since `lg:` breakpoint is 1024px).
  - Desktop: filters expanded; chat sidebar visible in the right column.
- **Pass criteria:** Each breakpoint matches expectations; no horizontal scrollbar appears at any width.

---

### UAT-24 — Console & network hygiene (cross-cutting)
**Run on:** Desktop, end of session

- **Steps:** After running the full pass, call `browser_console_messages` and `browser_network_requests`.
- **Expected:**
  - No `error`-level console messages from app code (warnings for missing image alt or third-party scripts are acceptable but should be noted).
  - No 4xx/5xx responses other than those triggered intentionally in UAT-21 or UAT-19.
- **Pass criteria:** Clean console; all unintentional failed requests logged as defects.

---

### UAT-25 — Category-level pricing is inferred per item
**Maps to:** F1.2.2
**Run on:** Desktop

- **Pre:** Landing page; `category_priced_menu.jpg` available. The fixture must depict a menu where each dish's price is **not** printed next to the dish — instead, a single price is stated at the category/section level (e.g. a "Sandwiches — $15" header above a list of named sandwiches, or "All pizzas $18"). Include at least two categories with different prices so the inference is observable.
- **Steps:**
  1. `browser_file_upload` with `["$REPO/category_priced_menu.jpg"]`.
  2. Wait for processing to complete (same timing budget as UAT-02).
  3. `browser_snapshot` and read the price on every rendered card.
  4. Inspect the `POST /api/process-menu` response in `browser_network_requests` and confirm each `items[].price` matches the category header in the fixture.
  5. Exercise the price filter (UAT-09 mechanics) using a range that brackets one category's price but excludes the other.
- **Expected:**
  - Every dish renders a concrete price (e.g. `$15.00`); **no** card falls back to "Market price" for items whose category price is legible.
  - Items in the same category share an identical price.
  - Items in different categories carry the price from their respective category headers, not a single average or the first-seen value.
  - Price-range filtering correctly partitions items by their inferred category price.
- **Pass criteria:** All inferred prices match the source image's category headers; filter behaviour is consistent with those prices; no console errors. If the model returns `price: null` for every item despite a legible category header, log an S2 defect against F1.2.2 (price inference).

---

### UAT-26 — Image-search failure degrades gracefully
**Maps to:** F1.3 (graceful degradation — see README "Design Decisions")
**Run on:** Desktop

- **Pre:** Landing page. The tester needs the ability to either (a) temporarily unset `RAPIDAPI_KEY` in `.env.local` and restart the dev server, or (b) monkey-patch `window.fetch` via `browser_evaluate` to fail outbound image-search calls. Option (a) is the simpler path.
- **Steps:**
  1. Stop the dev server, comment out `RAPIDAPI_KEY` in `.env.local`, restart with `npm run dev`.
  2. Upload `sample_menu.jpg` as in UAT-02.
  3. After processing, `browser_snapshot` and inspect the image slot of several cards.
  4. Open the `POST /api/process-menu` response in `browser_network_requests` and read `items[].image`.
- **Expected:**
  - Menu renders successfully — image-search failure must **not** fail the request (see [`src/lib/menu-processor.ts`](src/lib/menu-processor.ts) `searchDishImage`).
  - Every item's `image` field equals `https://placehold.co/600x400?text=Image+Not+Found`.
  - Cards render the placeholder image (no broken-image icon, no console error other than expected RAPIDAPI warnings).
- **Pass criteria:** Processing completes with no 5xx; every card shows the placeholder; no app crash. Restore `RAPIDAPI_KEY` and restart the dev server before the next scenario.

---

## 6. Notes on tricky Playwright-MCP interactions

### 6.1 File drag-and-drop
Some Playwright-MCP versions do not expose a first-class file-drag helper. If `browser_drag` cannot accept an OS path, run this in `browser_evaluate` (binding the drop target's `ref` from the latest snapshot):

```js
async (target) => {
  const file = await (await fetch('/_uat/sample_menu.jpg')).blob().then(
    b => new File([b], 'sample_menu.jpg', { type: 'image/jpeg' })
  );
  const dt = new DataTransfer();
  dt.items.add(file);
  target.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, bubbles: true }));
  target.dispatchEvent(new DragEvent('dragover',  { dataTransfer: dt, bubbles: true }));
  target.dispatchEvent(new DragEvent('drop',      { dataTransfer: dt, bubbles: true }));
}
```

To serve `sample_menu.jpg` from the dev server, copy it to `public/_uat/sample_menu.jpg` before starting the run. **Remember to remove it after UAT** — it is a test artifact, not production content.

### 6.2 Snapshots vs. screenshots
Always assert on `browser_snapshot` (accessibility tree) — it is deterministic across DPRs and theme changes. Use `browser_take_screenshot` only for evidence attachments on failed scenarios.

### 6.3 Waits
Avoid fixed `sleep` calls. Prefer:
- `browser_wait_for` with a `text:` predicate for state transitions.
- `browser_network_requests` polling for backend completion (the `POST /api/process-menu` reaching `200`).

### 6.4 Re-running a scenario
Each scenario can be reset by clicking **New Menu** (UAT-20). When the page is in error state, navigate back to `/` instead.

---

## 7. Reporting template

For each scenario record the following — recommend a single `UAT_RESULTS_<date>.md` next to this file. (Create only after a run; don't pre-commit empty results.)

```
### UAT-XX
- Status: Pass | Fail | Blocked
- Viewport(s): Mobile / Tablet / Desktop
- Duration: <seconds end-to-end>
- Evidence: <path to screenshot / snapshot excerpt>
- Notes: <observations, deviations from expected, console warnings>
```

Severity classifications for defects:
- **S1 (blocker)** — Golden path broken (UAT-02, UAT-17).
- **S2 (major)** — A scenario fails but the feature has a workaround.
- **S3 (minor)** — Visual, copy, or non-functional issue.
- **S4 (cosmetic)** — Spacing, hover states, etc.

---

## 8. Exit criteria

UAT is considered **passed** when:
- All **smoke scenarios** (UAT-01, UAT-02, UAT-09, UAT-10, UAT-15, UAT-17, UAT-20) pass on Mobile and Desktop.
- No open S1 or S2 defects.
- NF4 timings observed: process-menu p50 < 20 s on a ~1 MB JPEG; chat round-trip p50 < 5 s.
- `browser_console_messages` shows no app-origin `error` entries on a clean run.

---

## 9. Open questions for the product owner

1. **F1.4 empty-list contract:** PRD §3.1 F1.4 (v1.4+) requires the backend to return an error response when the model cannot reliably interpret the image. When the model instead returns 200 with `items: []`, should the frontend (a) treat that as a soft-success and render "0 dishes found", or (b) detect the empty list and surface the generic "Processing failed" notice? UAT-21 currently tolerates (a) with an S3 defect flag.
2. **Cross-browser scope:** is WebKit/Firefox sign-off required for v1.0, or is Chromium sufficient?

Resolve these before the first full UAT pass to avoid re-runs.

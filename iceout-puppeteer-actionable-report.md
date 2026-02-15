# iceout.org Puppeteer Script Fix Report

**Date:** 2026-02-13  
**Purpose:** Actionable findings for fixing the Puppeteer scraper that targets iceout.org.  
**Note:** Live browser automation via MCP was unavailable ("MCP file system options required"); this report synthesizes existing investigation files, network logs, and codebase analysis.

---

## 1. Concrete Selectors That Work

| Purpose | Selector | Notes |
|---------|----------|-------|
| App root | `app-root` | Wait for this before scraping |
| "Verifying..." overlay | `document.body.innerText.includes("Verifying...")` | Poll until gone (~3–5s typical) |
| Language dialog | XPath `//button[contains(.,'English')]` or `page.$('button')` + text check | Click to select English |
| Language combobox | `mat-select#mat-select-0` or `combobox[aria-label="en"]` | Locale switcher in header |
| Terms dialog | XPath `//button[contains(.,'I agree')]` or text match | Click when shown |
| Scroll container (reports list) | `.mat-mdc-tab-body-content` | Tab body with overflow scroll; only visible when tab is active |
| First accordion toggle | `.mat-expansion-panel-header` (inside `.mat-mdc-tab-body-content`) | Click to expand "Category" / filter panel |
| Date input | `#mat-input-1` | Mat-datepicker input; typically read-only, opens datepicker on click |
| Report cards | `mat-card.mat-mdc-card` or `[id^="report-"]` | Cards in list; ID pattern `report-{id}` (e.g. `report-107584`) |
| Report card click target | `mat-card.cursor-pointer` or `.thumbnail-container` | Clickable area to open detail drawer/modal |

---

## 2. Required Waits / Event Ordering

1. **Navigate** → `page.goto("https://iceout.org/en/", { waitUntil: "domcontentloaded" })`
2. **Initial settle** → `sleep(5000)` (ALTCHA proof-of-work runs)
3. **ALTCHA complete** → Poll until `!body.innerText.includes("Verifying...")` (up to ~45 × 1.5s)
4. **App ready** → `page.waitForSelector("app-root", { timeout: 20000 })` or `body.innerText.includes("People Over Papers")`
5. **Language dialog** → If present, click `button:has-text("English")` or equivalent
6. **Terms dialog** → If present, click `button:has-text("I agree to the Terms of Service")`
7. **Reports list visible** → Wait for `.mat-mdc-tab-body-content` or report cards
8. **Scroll container** → Ensure active tab shows `.mat-mdc-tab-body-content.mat-mdc-tab-body-active` (tab "All Reports" or equivalent)
9. **Accordion expand** → Click `.mat-expansion-panel-header`; wait for `.mat-expanded` before interacting with date input
10. **Date input** → `#mat-input-1` is typically controlled by MatDatepicker; use datepicker interactions, not direct `type()`
11. **Report detail** → After clicking card, wait for detail drawer/modal (e.g. `.mat-drawer-opened` or detail panel) before capturing

---

## 3. Endpoint List with Content-Types

| Endpoint | Method | Query Params | Response Content-Type | Body Format |
|----------|--------|--------------|----------------------|-------------|
| `https://iceout.org/auth/altcha/` | POST | — | — | Proof-of-work solution; sets session cookies |
| `https://iceout.org/api/report-feed` | GET | `since` (ISO8601, e.g. `1970-01-01T00:00:00.000Z`) | `application/msgpack` | **MessagePack** binary array |
| `https://iceout.org/api/reports/` | GET | `archived=False`, `page=1`, `page_size=N` | `application/json` | JSON array (paginated) |
| `https://iceout.org/api/reports/{id}/` | GET | `archived=False` (optional), `incident_time__gte`, `incident_time__lte` (optional) | `application/json` | JSON object (single report) |

**Critical:** `/api/report-feed` does **not** negotiate to JSON when `Accept: application/json` is sent. The real app uses `Accept: application/msgpack`.

---

## 4. Request Headers (from api-requests-log.json)

The live app sends for report-feed:

- `Accept: application/msgpack`
- `x-csrftoken`
- `x-api-version: 1.6`
- `x-locale: en`
- `referer: https://iceout.org/en/`
- Standard browser headers (user-agent, sec-ch-ua, etc.)
- `credentials: "include"` (cookies)

---

## 5. Initial Reports List vs. Report Detail

- **Initial list:** The app uses `GET /api/report-feed?since=1970-01-01T00:00:00.000Z` (MessagePack). This is the **primary** source for the reports list view. There is no `/api/reports/` call in the captured session.
- **Report detail:** Comes from **follow-up request** `GET /api/reports/{id}/` when a card is clicked. It is **not** preloaded; the detail drawer triggers the fetch on demand.
- **Summary:** Report list = report-feed (msgpack); detail = `/api/reports/{id}/` (JSON).

---

## 6. Date Input `#mat-input-1`

- **Editable directly?** No. Angular Material date inputs use `mat-datepicker` and typically have `readonly` or are not meant for direct typing.
- **Requires:** Click input → datepicker opens → select date from calendar, or use Angular form APIs if exposed. For automation: `page.click("#mat-input-1")` then `page.click(".mat-calendar-body-cell")` (or equivalent) for the desired date.

---

## 7. Likely Reasons Current Script Fails

1. **`/api/report-feed` returns MessagePack, not JSON**
   - `fetchJson()` in `test.ts` rejects non-JSON (`contentType.includes("application/json")`).
   - Report-feed **always** returns `application/msgpack`.
   - The script's incremental-feed path (`sinceCursorIso`) calls `fetchJson(report-feed)` and `extractItems(feedPayload.json)` — `json` is null, so no items are added.

2. **Language and Terms dialogs not handled**
   - Script waits for ALTCHA and `app-root` but does not click through language selector or Terms of Service.
   - If these block the main content, the page may appear "ready" but APIs could still be blocked or the list may not render.

3. **Primary data source mismatch**
   - Script uses `/api/reports/?archived=False&page=1&page_size=N` for the main list (JSON). This **can** work if the session is valid.
   - The app itself uses report-feed for the list. If report-feed is required for some flows, the script would miss data when relying only on paginated `/api/reports/`.

4. **Session / cookies**
   - All APIs require valid session cookies (`sessionid`, `csrftoken`, `accessToken`) from completed ALTCHA.
   - Script uses `credentials: "include"` in `page.evaluate` fetch — correct. But if ALTCHA never completes or dialogs block, session may be invalid.

5. **Missing headers**
   - Script does not send `x-csrftoken`, `x-api-version`, or `x-locale`. These may be optional if cookies are correct, but the live app sends them.

---

## 8. Suggested Implementation Strategy for Puppeteer

### Option A: Prefer Paginated JSON (simplest)

- Use **only** `GET /api/reports/?archived=False&page=1&page_size=100` for the list.
- Do **not** use report-feed for incremental updates, or treat it as optional.
- Add language + Terms dialog handling before any API calls.
- Keep existing `fetchJson` for `/api/reports/` and `/api/reports/{id}/`.

**Pros:** No MessagePack parsing.  
**Cons:** May miss very fresh reports if report-feed has lower latency.

### Option B: Add MessagePack Support for Report-Feed

- After ALTCHA + dialogs, inject `@msgpack/msgpack` (or use in-page decode if bundled).
- Add `fetchMsgpack(url)` that:
  - Sends `Accept: application/msgpack`
  - Uses `response.arrayBuffer()` then `decode()`
  - Returns decoded array.
- Use report-feed for initial load and/or incremental updates; fall back to `/api/reports/` if needed.

### Option C: Network Interception

- Use `page.setRequestInterception(true)` and intercept `**/api/report-feed*` and `**/api/reports/**`.
- Capture response bodies for debugging; optionally mock or modify.
- Still need to decode MessagePack for report-feed. Interception helps with inspection, not with avoiding msgpack.

---

## 9. Recommended Code Changes (Puppeteer)

1. **Handle dialogs**
   ```ts
   // After waitForVerificationToSettle (Puppeteer XPath)
   const [langBtn] = await page.$x("//button[contains(.,'English')]");
   if (langBtn) await langBtn.click();
   await sleep(500);
   const [termsBtn] = await page.$x("//button[contains(.,'I agree')]");
   if (termsBtn) await termsBtn.click();
   await sleep(500);
   ```

2. **Stop using fetchJson for report-feed**
   - Remove or bypass the report-feed call in the incremental path, **or**
   - Add MessagePack decode: `npm i @msgpack/msgpack`, then decode `arrayBuffer` before `extractItems()`.

3. **Optional: add headers to fetch**
   - Read `x-csrftoken` from a meta tag or cookie, pass to fetch headers.
   - Add `x-api-version: "1.6"`, `x-locale: "en"` if 401/403 occurs.

4. **Wait for list before scraping**
   ```ts
   await page.waitForSelector('.mat-mdc-tab-body-content', { timeout: 15000 });
   ```

5. **Scroll container / accordion**
   - Use `.mat-mdc-tab-body-content` for scroll; first accordion: `await page.click('.mat-mdc-tab-body-content .mat-expansion-panel-header')`.

6. **Report detail**
   - Click `mat-card` (e.g. `mat-card[id^="report-"]` or first `.mat-mdc-card`).
   - Wait for detail request: `page.waitForResponse(res => res.url().includes('/api/reports/') && res.url().match(/\/api\/reports\/\d+\//))`.
   - Or wait for drawer: `page.waitForSelector('.mat-drawer-opened, [class*="detail"]')`.

---

## 10. Summary Table

| Item | Value |
|------|-------|
| Scroll container | `.mat-mdc-tab-body-content` |
| First accordion | `.mat-expansion-panel-header` (inside tab body) |
| Date input | `#mat-input-1` — datepicker, not directly editable |
| Report cards | `mat-card`, `[id^="report-"]` |
| List endpoint | `GET /api/report-feed?since={ISO}` → **MessagePack** |
| Paginated list | `GET /api/reports/?archived=False&page=1&page_size=N` → **JSON** |
| Detail endpoint | `GET /api/reports/{id}/` → **JSON** (follow-up on card click) |
| Main script bug | `fetchJson` used for report-feed; msgpack rejected |
| Dialog handling | Language + Terms not handled |
| Suggested approach | Option A (JSON only) or Option B (+ msgpack for report-feed) |

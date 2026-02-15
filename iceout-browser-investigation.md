# iceout.org Browser Automation Investigation

**Date:** 2025-02-13  
**URL:** https://iceout.org/en/

---

## 1. Final English URL

```
https://iceout.org/en/
```

Language is encoded in the path (`/en/`, `/es/`, etc.). The site may redirect to a previously chosen locale; confirm the combobox shows `en` after load.

---

## 2. Data Loading Endpoints

### Primary: Report Feed (incremental / real-time)

| Property | Value |
|----------|-------|
| **URL** | `https://iceout.org/api/report-feed` |
| **Method** | GET |
| **Query params** | `since` (ISO 8601 timestamp, e.g. `1970-01-01T00:00:00.000Z` or `2024-01-01T00:00:00.000Z`) |
| **Response** | `application/msgpack` — binary MessagePack array of report summaries |
| **Auth** | Requires session (see Anti-bot) |

**Example:**
```
GET https://iceout.org/api/report-feed?since=1970-01-01T00:00:00.000Z
```

- Returns `[]` (empty MessagePack array, byte `0x90`) when there are no reports in range.
- Does **not** negotiate to JSON when `Accept: application/json` is sent.

---

### Secondary: Paginated Reports (list)

| Property | Value |
|----------|-------|
| **URL** | `https://iceout.org/api/reports/` |
| **Method** | GET |
| **Query params** | `archived=False`, `page=1`, `page_size=N` |
| **Response** | `application/json` — array of report objects |
| **Auth** | Requires session |

**Example:**
```
GET https://iceout.org/api/reports/?archived=False&page=1&page_size=100
```

---

### Tertiary: Report Detail

| Property | Value |
|----------|-------|
| **URL** | `https://iceout.org/api/reports/{id}/` |
| **Method** | GET |
| **Query params** | `archived=False` (optional), `incident_time__gte`, `incident_time__lte` (optional) |
| **Response** | `application/json` — single report object |
| **Auth** | Requires session |

**Examples:**
```
GET https://iceout.org/api/reports/12345/
GET https://iceout.org/api/reports/12345/?archived=False
```

---

## 3. Anti-Bot: ALTCHA (Proof-of-Work)

- **No Cloudflare.** Protection is via **ALTCHA** (proof-of-work).
- On first load, a **“Verifying…”** overlay appears; the client solves a SHA-256 puzzle and sends the proof to the server.
- After verification, the server sets session cookies.

### ALTCHA Endpoint

| Property | Value |
|----------|-------|
| **URL** | `https://iceout.org/auth/altcha/` |
| **Method** | POST |
| **Response** | 200 OK or 204 No Content |

### Post-Verification Cookies

| Cookie | Purpose |
|--------|---------|
| `sessionid` | Main session identifier (HttpOnly) |
| `csrftoken` | CSRF protection |
| `accessToken` | Access token |

### Observations

1. Verification typically completes in **3–5 seconds**.
2. After verification, a **language selector** and/or **Terms of Service** dialog may appear.
3. API calls **require** a valid session; requests without cookies will not succeed.
4. The proof-of-work cannot be bypassed by simple HTTP clients; a real browser or browser automation is needed.

---

## 4. Key Headers / Credentials for API Calls

When calling the APIs after ALTCHA verification (from the same browser context):

- **Credentials:** `credentials: "include"` (for `fetch`) to send cookies.
- **Accept (optional):** `Accept: application/json, text/plain, application/*` — paginated reports honor this; report-feed does not (always msgpack).
- **No custom API keys** required.

Direct HTTP requests (curl, requests, etc.) will fail without valid cookies from a completed ALTCHA session.

---

## 5. Language and Data Display (English)

- **English base path:** `/en/`.
- **Data content** is language-agnostic; the API returns the same report data regardless of locale.
- **UI labels** (“No reports have been published yet today”, “Critical”, “Active”, etc.) come from client-side localization.
- With English selected, the main content area shows:
  - “No reports have been published yet today. Click to see reports from yesterday.” when there are no today reports.
  - Report type filters: Critical, Active, Observed, Other.

---

## 6. Robust Selectors / URL Patterns for Scraping

### DOM Selectors

| Purpose | Selector / Pattern |
|---------|--------------------|
| App root | `app-root` |
| Language combobox | `combobox[aria-label="en"]` or text "en" |
| “Verifying…” overlay | `document.body.innerText.includes("Verifying...")` |
| Language dialog | `button:has-text("English")` |
| Terms dialog | `button:has-text("I agree to the Terms of Service")` |
| Empty state | `text=No reports have been published yet today` |
| “Yesterday” hint | `text=Click to see reports from yesterday` |
| Report types | `text=Critical`, `text=Active`, `text=Observed`, `text=Other` |
| Version | `text=v0.2.105` |

### URL Patterns

- English: `https://iceout.org/en/`
- Report feed: `https://iceout.org/api/report-feed?since={ISO8601}`
- Paginated list: `https://iceout.org/api/reports/?archived=False&page=1&page_size={N}`
- Report detail: `https://iceout.org/api/reports/{id}/` or `.../{id}/?archived=False`

---

## 7. Scraping Recommendations

1. **Use browser automation** (Puppeteer, Playwright, etc.) — headless is fine, as long as ALTCHA can complete.
2. **Wait for ALTCHA** — poll until `"Verifying..."` is gone (e.g. 30 × 1.5 s).
3. **Handle dialogs** — click through language selector (e.g. “English”) and Terms of Service (“I agree”) if shown.
4. **Prefer paginated JSON** — use `GET /api/reports/?archived=False&page=1&page_size=100` for scraping; it returns JSON and avoids MessagePack parsing.
5. **Parse report-feed as MessagePack** when using it — use `@msgpack/msgpack` (JavaScript) or equivalent in other languages.
6. **Include credentials** — `credentials: "include"` for all API fetches.
7. **Rate limit** — add delays (e.g. 1–2 s) between requests to reduce block risk.
8. **Reuse session** — keep the same browser context and cookies across requests; avoid creating a new session for every run.
9. **User-Agent** — use a standard browser UA, e.g. `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...`.

---

## 8. Summary Table

| Item | Value |
|------|-------|
| Final English URL | `https://iceout.org/en/` |
| Report feed | `GET /api/report-feed?since={ISO8601}` → MessagePack |
| Paginated reports | `GET /api/reports/?archived=False&page=1&page_size=N` → JSON |
| Report detail | `GET /api/reports/{id}/` or `.../{id}/?archived=False` → JSON |
| Anti-bot | ALTCHA (proof-of-work); must solve before API access |
| Auth | Session cookies (`sessionid`, `csrftoken`, `accessToken`) |
| No Cloudflare | ALTCHA only |

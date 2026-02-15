import http from "node:http"
import { decode } from "@msgpack/msgpack"
import { Pool } from "pg"
import puppeteer, { type Browser, type Page } from "puppeteer-core"

interface Config {
	wsEndpoint: string
	databaseUrl: string
	targetUrl: string
	maxPages: number
	pageSize: number
	lookbackDays: number
	pollIntervalMs: number
	reconnectBaseMs: number
	reconnectMaxMs: number
	startHealthServer: boolean
	port: number
	runOnce: boolean
}

interface ScrapeRow {
	sourceId: string
	sourceCreatedAt: string
	incidentTime: string | null
	approved: boolean | null
	archived: boolean | null
	reportType: string | null
	locationDescription: string | null
	activityDescription: string | null
	clothingDescription: string | null
	sourceLink: string | null
	submittedBy: string | null
	numOfficials: number | null
	numVehicles: number | null
	mediaCount: number | null
	commentCount: number | null
	smallThumbnail: string | null
	activityTags: unknown[]
	enforcementTags: unknown[]
	categoryTags: unknown[]
	media: unknown[]
	comments: unknown[]
	vehicleReports: unknown[]
	lon: number | null
	lat: number | null
	rawSummary: Record<string, unknown>
	rawDetail: Record<string, unknown>
}

interface ScrapeBatchResult {
	rows: ScrapeRow[]
	pagesFetched: number
	newestCreatedAt: string | null
	oldestCreatedAt: string | null
}

interface PersistResult {
	upsertedRows: number
	geoRows: number
}

interface LastRunState {
	trigger: "startup" | "loop" | "manual"
	at: string
	pagesFetched: number
	scrapedRows: number
	upsertedRows: number
	geoRows: number
	lookbackStartIso: string
	cursorIso: string | null
}

const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const DEFAULT_TARGET_URL = "https://iceout.org/en/"
const DAY_IN_MS = 24 * 60 * 60 * 1000

function parsePositiveNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback
	return parsed
}

function getConfig(): Config {
	const wsEndpoint = process.env.BROWSERLESS_WS_ENDPOINT
	const databaseUrl = process.env.DATABASE_URL

	if (!wsEndpoint) throw new Error("Missing BROWSERLESS_WS_ENDPOINT")
	if (!databaseUrl) throw new Error("Missing DATABASE_URL")

	return {
		wsEndpoint,
		databaseUrl,
		targetUrl: process.env.TARGET_URL ?? DEFAULT_TARGET_URL,
		maxPages: parsePositiveNumber(process.env.MAX_PAGES, 80),
		pageSize: parsePositiveNumber(process.env.PAGE_SIZE, 100),
		lookbackDays: parsePositiveNumber(process.env.LOOKBACK_DAYS, 7),
		pollIntervalMs: parsePositiveNumber(process.env.POLL_INTERVAL_MS, 120_000),
		reconnectBaseMs: parsePositiveNumber(process.env.RECONNECT_BASE_MS, 2_000),
		reconnectMaxMs: parsePositiveNumber(process.env.RECONNECT_MAX_MS, 60_000),
		startHealthServer: String(process.env.START_HEALTH_SERVER ?? "true") === "true",
		port: parsePositiveNumber(process.env.PORT, 8080),
		runOnce: String(process.env.RUN_ONCE ?? "false") === "true",
	}
}

const CONFIG = getConfig()

const pool = new Pool({
	connectionString: CONFIG.databaseUrl,
	max: 10,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 10_000,
})

let browser: Browser | null = null
let page: Page | null = null
let running = false
let shuttingDown = false
let lastError: string | null = null
let lastRun: LastRunState | null = null
let cursorIso: string | null = null

pool.on("error", (error) => {
	lastError = error.message
	console.error("[listener] postgres pool error:", error)
})

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function getLookbackStartIso(): string {
	return new Date(Date.now() - CONFIG.lookbackDays * DAY_IN_MS).toISOString()
}

function getEffectiveCursorIso(lookbackStartIso: string): string {
	if (!cursorIso) return lookbackStartIso
	const cursorMs = Date.parse(cursorIso)
	const lookbackMs = Date.parse(lookbackStartIso)
	if (!Number.isFinite(cursorMs) || cursorMs < lookbackMs) return lookbackStartIso
	return cursorIso
}

function extractItemsFromPayload(payload: unknown): unknown[] {
	if (Array.isArray(payload)) return payload
	if (!payload || typeof payload !== "object") return []

	const objectPayload = payload as {
		results?: unknown[]
		items?: unknown[]
		data?: unknown[]
	}

	if (Array.isArray(objectPayload.results)) return objectPayload.results
	if (Array.isArray(objectPayload.items)) return objectPayload.items
	if (Array.isArray(objectPayload.data)) return objectPayload.data
	return []
}

async function ensureDatabaseIsReachable(): Promise<void> {
	await pool.query("select 1")
}

async function closeBrowser(): Promise<void> {
	try {
		if (page && !page.isClosed()) {
			await page.close()
		}
	} catch {}

	try {
		if (browser) {
			await browser.close()
		}
	} catch {}

	page = null
	browser = null
}

async function waitForVerificationToSettle(currentPage: Page): Promise<void> {
	const verificationPhrases = [
		"Verifying...",
		"Checking your browser",
		"Verify you are human",
		"Completing security check",
		"Just a moment",
	]
	for (let i = 0; i < 45; i += 1) {
		const isVerifying = await currentPage
			.evaluate((phrases: string[]) => {
				const bodyText = document.body?.innerText ?? ""
				return phrases.some((phrase) => bodyText.includes(phrase))
			}, verificationPhrases)
			.catch(() => false)

		if (!isVerifying) return
		await sleep(1_500)
	}
}

async function maybeClickButtonByText(currentPage: Page, textMatcher: string): Promise<boolean> {
	const escapedMatcher = textMatcher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return currentPage
		.evaluate((matcher) => {
			const regex = new RegExp(matcher, "i")
			const candidates = Array.from(document.querySelectorAll("button,[role='button']")) as HTMLElement[]

			for (const candidate of candidates) {
				if (candidate instanceof HTMLButtonElement && candidate.disabled) continue

				const label = (candidate.textContent ?? "").trim()
				if (!regex.test(label)) continue

				const rect = candidate.getBoundingClientRect()
				if (rect.width <= 0 || rect.height <= 0) continue

				candidate.click()
				return true
			}

			return false
		}, escapedMatcher)
		.catch(() => false)
}

async function settleLanguageAndTermsDialogs(currentPage: Page): Promise<void> {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const clickedLanguage = await maybeClickButtonByText(currentPage, "english")
		if (clickedLanguage) {
			await sleep(400)
		}

		const clickedTerms = await maybeClickButtonByText(currentPage, "i agree")
		if (clickedTerms) {
			await sleep(400)
		}

		if (!clickedLanguage && !clickedTerms) {
			const hasPendingDialog = await currentPage
				.evaluate(() => {
					const bodyText = (document.body?.innerText ?? "").toLowerCase()
					return bodyText.includes("terms of service") || bodyText.includes("select language")
				})
				.catch(() => false)

			if (!hasPendingDialog) {
				return
			}
		}

		await sleep(600)
	}
}

async function fetchReportFeedItems(currentPage: Page, sinceCursorIso: string): Promise<unknown[]> {
	if (!sinceCursorIso) return []

	const response = await currentPage.evaluate(async (sinceIso) => {
		const cookieParts = document.cookie.split(";").map((entry) => entry.trim())
		const csrftokenEntry = cookieParts.find((entry) => entry.startsWith("csrftoken="))
		const csrftoken = csrftokenEntry ? decodeURIComponent(csrftokenEntry.split("=")[1] ?? "") : ""

		const headers: Record<string, string> = {
			accept: "application/msgpack",
			"accept-language": "en-US,en;q=0.9",
			"x-api-version": "1.6",
			"x-locale": "en",
		}

		if (csrftoken) {
			headers["x-csrftoken"] = csrftoken
		}

		const requestUrl = `/api/report-feed?since=${encodeURIComponent(sinceIso)}`
		const feedResponse = await fetch(requestUrl, {
			method: "GET",
			credentials: "include",
			headers,
		})

		const contentType = feedResponse.headers.get("content-type")?.toLowerCase() ?? ""
		const buffer = await feedResponse.arrayBuffer()
		return {
			ok: feedResponse.ok,
			status: feedResponse.status,
			contentType,
			bytes: Array.from(new Uint8Array(buffer)),
		}
	}, sinceCursorIso)

	if (!response.ok) {
		console.warn(`[listener] report-feed failed: ${response.status}`)
		return []
	}

	if (!response.contentType.includes("msgpack")) {
		console.warn(`[listener] report-feed non-msgpack response: ${response.contentType || "unknown"}`)
		return []
	}

	try {
		const decoded = decode(new Uint8Array(response.bytes))
		return extractItemsFromPayload(decoded)
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		console.warn(`[listener] failed to decode report-feed msgpack: ${reason}`)
		return []
	}
}

async function ensureConnectedPage(): Promise<Page> {
	if (browser?.connected && page && !page.isClosed()) {
		return page
	}

	await closeBrowser()

	browser = await puppeteer.connect({
		browserWSEndpoint: CONFIG.wsEndpoint,
		defaultViewport: {
			width: 1440,
			height: 900,
		},
	})

	page = await browser.newPage()
	await page.setUserAgent(USER_AGENT)
	await page.setExtraHTTPHeaders({
		"accept-language": "en-US,en;q=0.9",
	})
	await page.goto(CONFIG.targetUrl, { waitUntil: "domcontentloaded", timeout: 90_000 })
	await sleep(5_000)
	await waitForVerificationToSettle(page)

	await Promise.race([
		page.waitForSelector("app-root", { timeout: 20_000 }).catch(() => null),
		page
			.waitForFunction(() => document.body?.innerText?.includes("People Over Papers") ?? false, {
				timeout: 20_000,
			})
			.catch(() => null),
		sleep(8_000),
	])

	await settleLanguageAndTermsDialogs(page)
	await Promise.race([page.waitForSelector(".mat-mdc-tab-body-content", { timeout: 12_000 }).catch(() => null), sleep(2_500)])

	return page
}

async function scrapeRowsFromPage(currentPage: Page, lookbackStartIso: string, feedItems: unknown[]): Promise<ScrapeBatchResult> {
	return currentPage.evaluate(
		async ({
			pageSize,
			maxPages,
			lookbackStartIso,
			feedItems,
		}: {
			pageSize: number
			maxPages: number
			lookbackStartIso: string
			feedItems: unknown[]
		}): Promise<ScrapeBatchResult> => {
			const lookbackStartMs = Date.parse(lookbackStartIso)
			const nowIso = new Date().toISOString()
			const summaryById = new Map<string, { sourceCreatedAt: string; summary: Record<string, unknown> }>()
			const detailById = new Map<string, Record<string, unknown>>()
			let pagesFetched = 0

			function toIso(value: unknown): string | null {
				if (typeof value !== "string" || !value.length) return null
				const parsed = Date.parse(value)
				if (!Number.isFinite(parsed)) return null
				return new Date(parsed).toISOString()
			}

			function toAbsoluteUrl(url: string): string | null {
				try {
					return new URL(url, location.origin).toString()
				} catch {
					return null
				}
			}

			function pickText(...values: unknown[]): string | null {
				for (const value of values) {
					if (typeof value === "string" && value.trim().length) {
						return value
					}
				}

				return null
			}

			function pickBoolean(...values: unknown[]): boolean | null {
				for (const value of values) {
					if (typeof value === "boolean") {
						return value
					}
				}

				return null
			}

			function pickNumber(...values: unknown[]): number | null {
				for (const value of values) {
					const numeric = Number(value)
					if (Number.isFinite(numeric)) {
						return numeric
					}
				}

				return null
			}

			function pickArray(...values: unknown[]): unknown[] {
				for (const value of values) {
					if (Array.isArray(value)) {
						return value
					}
				}

				return []
			}

			function parseCoordinates(...reports: Array<Record<string, unknown> | null | undefined>): { lon: number | null; lat: number | null } {
				for (const report of reports) {
					if (!report) continue

					const location = report.location as { coordinates?: unknown } | undefined
					const coords = location?.coordinates ?? report.location_coordinates ?? report.coordinates ?? null
					if (!Array.isArray(coords) || coords.length < 2) continue

					const maybeLon = Number(coords[0])
					const maybeLat = Number(coords[1])
					return {
						lon: Number.isFinite(maybeLon) ? maybeLon : null,
						lat: Number.isFinite(maybeLat) ? maybeLat : null,
					}
				}

				return {
					lon: null,
					lat: null,
				}
			}

			function normalizeSummaryCandidate(item: unknown): { sourceId: string; sourceCreatedAt: string; summary: Record<string, unknown> } | null {
				const summary = (item ?? {}) as Record<string, unknown>
				const sourceIdCandidate = summary.id ?? summary._id ?? summary.uuid
				if (sourceIdCandidate === undefined || sourceIdCandidate === null) return null

				const sourceCreatedAt =
					toIso(summary.created_at) ??
					toIso(summary.timestamp) ??
					toIso(summary.createdAt) ??
					toIso(summary.incident_time) ??
					new Date().toISOString()

				return {
					sourceId: String(sourceIdCandidate),
					sourceCreatedAt,
					summary,
				}
			}

			function isWithinLookback(sourceCreatedAt: string): boolean {
				const createdAtMs = Date.parse(sourceCreatedAt)
				if (!Number.isFinite(createdAtMs)) return true
				return createdAtMs >= lookbackStartMs
			}

			function upsertSummary(item: unknown): boolean {
				const candidate = normalizeSummaryCandidate(item)
				if (!candidate) return false
				if (!isWithinLookback(candidate.sourceCreatedAt)) return false

				const existing = summaryById.get(candidate.sourceId)
				if (!existing || Date.parse(candidate.sourceCreatedAt) >= Date.parse(existing.sourceCreatedAt)) {
					summaryById.set(candidate.sourceId, candidate)
				}

				return true
			}

			async function fetchJson(url: string): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
				const response = await fetch(url, {
					method: "GET",
					credentials: "include",
					headers: {
						accept: "application/json, text/plain, application/*",
						"accept-language": "en-US,en;q=0.9",
					},
				})

				const text = await response.text()
				const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
				const looksLikeHtml = /^\s*</.test(text)
				if (!contentType.includes("application/json") || looksLikeHtml) {
					return {
						ok: false,
						status: response.status,
						json: null,
						text: `Non-JSON response for ${url} (${contentType || "unknown content-type"}): ${text.slice(0, 180)}`,
					}
				}

				let json: unknown = null

				try {
					json = JSON.parse(text)
				} catch {
					json = null
				}

				return {
					ok: response.ok,
					status: response.status,
					json,
					text,
				}
			}

			function extractItems(payload: unknown): { items: unknown[]; next: string | null } {
				if (Array.isArray(payload)) {
					return {
						items: payload,
						next: null,
					}
				}

				if (payload && typeof payload === "object") {
					const objectPayload = payload as { results?: unknown[]; items?: unknown[]; data?: unknown[]; next?: unknown }
					const items =
						Array.isArray(objectPayload.results) ? objectPayload.results : Array.isArray(objectPayload.items) ? objectPayload.items : Array.isArray(objectPayload.data) ? objectPayload.data : []
					const next = typeof objectPayload.next === "string" ? objectPayload.next : null
					return {
						items,
						next,
					}
				}

				return {
					items: [],
					next: null,
				}
			}

			async function fetchReportDetail(reportId: string): Promise<Record<string, unknown> | null> {
				const encodedId = encodeURIComponent(reportId)
				const reportUrls = [
					`/api/reports/${encodedId}/`,
					`/api/reports/${encodedId}/?archived=False`,
					`/api/reports/${encodedId}/?archived=False&incident_time__gte=${encodeURIComponent(lookbackStartIso)}&incident_time__lte=${encodeURIComponent(nowIso)}`,
				]

				for (const reportUrl of reportUrls) {
					const payload = await fetchJson(reportUrl)
					if (!payload.ok) continue
					if (!payload.json || typeof payload.json !== "object" || Array.isArray(payload.json)) continue

					return payload.json as Record<string, unknown>
				}

				return null
			}

			function buildRow(sourceId: string, sourceCreatedAt: string, summary: Record<string, unknown>, detail: Record<string, unknown> | null): ScrapeRow {
				const primary = detail ?? summary
				const { lon, lat } = parseCoordinates(primary, summary)
				const activityTags = pickArray(
					primary.activity_tag_enums,
					primary.activity_tags_enums,
					summary.activity_tag_enums,
					summary.activity_tags_enums
				)
				const enforcementTags = pickArray(
					primary.enforcement_tag_enums,
					primary.enforcement_tags_enums,
					summary.enforcement_tag_enums,
					summary.enforcement_tags_enums
				)
				const categoryTagsFromArray = pickArray(primary.category_enums, summary.category_enums)
				const categoryEnum = pickNumber(
					primary.category_enum,
					primary.display_category_enum,
					summary.category_enum,
					summary.display_category_enum
				)
				const categoryTags =
					categoryTagsFromArray.length > 0
						? categoryTagsFromArray
						: categoryEnum === null
							? []
							: [categoryEnum]
				const media = pickArray(primary.media, summary.media)
				const comments = pickArray(primary.comments, summary.comments)
				const vehicleReports = pickArray(primary.vehicle_reports, summary.vehicle_reports)

				return {
					sourceId,
					sourceCreatedAt:
						toIso(primary.created_at) ??
						toIso(primary.timestamp) ??
						toIso(primary.createdAt) ??
						sourceCreatedAt,
					incidentTime: toIso(primary.incident_time) ?? toIso(summary.incident_time),
					approved: pickBoolean(primary.approved, summary.approved),
					archived: pickBoolean(primary.archived, summary.archived),
					reportType: pickText(primary.report_type, primary.type, summary.report_type, summary.type),
					locationDescription: pickText(primary.location_description, primary.address, summary.location_description, summary.address),
					activityDescription: pickText(primary.activity_description, summary.activity_description),
					clothingDescription: pickText(primary.clothing_description, summary.clothing_description),
					sourceLink: pickText(primary.source_link, summary.source_link),
					submittedBy: pickText(primary.submitted_by, summary.submitted_by),
					numOfficials: pickNumber(primary.num_officials, summary.num_officials),
					numVehicles: pickNumber(primary.num_vehicles, summary.num_vehicles),
					mediaCount: media.length,
					commentCount: comments.length,
					smallThumbnail: pickText(primary.small_thumbnail, summary.small_thumbnail),
					activityTags,
					enforcementTags,
					categoryTags,
					media,
					comments,
					vehicleReports,
					lon,
					lat,
					rawSummary: summary,
					rawDetail: detail ?? summary,
				}
			}

			let reportsUrl = `/api/reports/?archived=False&page=1&page_size=${encodeURIComponent(pageSize)}`
			let consecutiveOldPages = 0

			while (reportsUrl && pagesFetched < maxPages) {
				pagesFetched += 1
				const payload = await fetchJson(reportsUrl)

				if (!payload.ok) {
					throw new Error(`Failed to fetch ${reportsUrl}: ${payload.status} ${payload.text.slice(0, 180)}`)
				}

				const { items, next } = extractItems(payload.json)
				let pageAddedRecentRows = false

				for (const item of items) {
					const added = upsertSummary(item)
					if (added) {
						pageAddedRecentRows = true
					}
				}

				if (!pageAddedRecentRows) {
					consecutiveOldPages += 1
				} else {
					consecutiveOldPages = 0
				}

				if (consecutiveOldPages >= 2) break
				if (!next) break

				const resolvedNext = toAbsoluteUrl(next)
				if (!resolvedNext) break
				reportsUrl = resolvedNext
			}

			for (const item of feedItems) {
				upsertSummary(item)
			}

			const reportIds = Array.from(summaryById.keys())
			const detailConcurrency = 6

			for (let index = 0; index < reportIds.length; index += detailConcurrency) {
				const chunk = reportIds.slice(index, index + detailConcurrency)
				const chunkDetails = await Promise.all(
					chunk.map(async (reportId) => {
						const detail = await fetchReportDetail(reportId)
						return {
							reportId,
							detail,
						}
					})
				)

				for (const entry of chunkDetails) {
					if (!entry.detail) continue
					detailById.set(entry.reportId, entry.detail)
				}
			}

			const rows: ScrapeRow[] = reportIds
				.map((reportId) => {
					const source = summaryById.get(reportId)
					if (!source) return null

					const detail = detailById.get(reportId) ?? null
					return buildRow(reportId, source.sourceCreatedAt, source.summary, detail)
				})
				.filter((row): row is ScrapeRow => row !== null)
				.sort((left, right) => Date.parse(right.sourceCreatedAt) - Date.parse(left.sourceCreatedAt))

			const newestCreatedAt = rows.length ? rows[0].sourceCreatedAt : null
			const oldestCreatedAt = rows.length ? rows[rows.length - 1].sourceCreatedAt : null

			return {
				rows,
				pagesFetched,
				newestCreatedAt,
				oldestCreatedAt,
			}
		},
		{
			pageSize: CONFIG.pageSize,
			maxPages: CONFIG.maxPages,
			lookbackStartIso,
			feedItems,
		}
	)
}

const UPSERT_REPORT_SQL = `
insert into public.ice_reports (
  source_id,
  source_created_at,
  incident_time,
  approved,
  archived,
  report_type,
  location_description,
  source_url,
  lon,
  lat,
  updated_at
) values (
  $1,
  $2::timestamptz,
  $3::timestamptz,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  now()
)
on conflict (source_id, source_created_at)
do update set
  incident_time = excluded.incident_time,
  approved = excluded.approved,
  archived = excluded.archived,
  report_type = excluded.report_type,
  location_description = excluded.location_description,
  source_url = excluded.source_url,
  lon = excluded.lon,
  lat = excluded.lat,
  updated_at = now()
`

const UPSERT_REPORT_DETAIL_SQL = `
insert into public.ice_report_details (
  source_id,
  source_created_at,
  activity_description,
  clothing_description,
  source_link,
  submitted_by,
  num_officials,
  num_vehicles,
  media_count,
  comment_count,
  small_thumbnail,
  activity_tags,
  enforcement_tags,
  category_tags,
  media,
  comments,
  vehicle_reports,
  raw_summary,
  raw_detail,
  ingested_at,
  updated_at
) values (
  $1,
  $2::timestamptz,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9,
  $10,
  $11,
  $12::jsonb,
  $13::jsonb,
  $14::jsonb,
  $15::jsonb,
  $16::jsonb,
  $17::jsonb,
  $18::jsonb,
  $19::jsonb,
  now(),
  now()
)
on conflict (source_id, source_created_at)
do update set
  activity_description = excluded.activity_description,
  clothing_description = excluded.clothing_description,
  source_link = excluded.source_link,
  submitted_by = excluded.submitted_by,
  num_officials = excluded.num_officials,
  num_vehicles = excluded.num_vehicles,
  media_count = excluded.media_count,
  comment_count = excluded.comment_count,
  small_thumbnail = excluded.small_thumbnail,
  activity_tags = excluded.activity_tags,
  enforcement_tags = excluded.enforcement_tags,
  category_tags = excluded.category_tags,
  media = excluded.media,
  comments = excluded.comments,
  vehicle_reports = excluded.vehicle_reports,
  raw_summary = excluded.raw_summary,
  raw_detail = excluded.raw_detail,
  updated_at = now()
`

async function persistRows(rows: ScrapeRow[]): Promise<PersistResult> {
	if (!rows.length) {
		return {
			upsertedRows: 0,
			geoRows: 0,
		}
	}

	const client = await pool.connect()
	let geoRows = 0

	try {
		await client.query("begin")

		for (const row of rows) {
			if (Number.isFinite(row.lon) && Number.isFinite(row.lat)) {
				geoRows += 1
			}

			await client.query(UPSERT_REPORT_SQL, [
				row.sourceId,
				row.sourceCreatedAt,
				row.incidentTime,
				row.approved,
				row.archived,
				row.reportType,
				row.locationDescription,
				CONFIG.targetUrl,
				row.lon,
				row.lat,
			])

			await client.query(UPSERT_REPORT_DETAIL_SQL, [
				row.sourceId,
				row.sourceCreatedAt,
				row.activityDescription,
				row.clothingDescription,
				row.sourceLink,
				row.submittedBy,
				row.numOfficials,
				row.numVehicles,
				row.mediaCount,
				row.commentCount,
				row.smallThumbnail,
				JSON.stringify(row.activityTags),
				JSON.stringify(row.enforcementTags),
				JSON.stringify(row.categoryTags),
				JSON.stringify(row.media),
				JSON.stringify(row.comments),
				JSON.stringify(row.vehicleReports),
				JSON.stringify(row.rawSummary),
				JSON.stringify(row.rawDetail),
			])
		}

		await client.query("commit")
		return {
			upsertedRows: rows.length,
			geoRows,
		}
	} catch (error) {
		await client.query("rollback")
		throw error
	} finally {
		client.release()
	}
}

function updateCursor(rows: ScrapeRow[], fallbackIso: string): string {
	let newestIso = fallbackIso

	for (const row of rows) {
		if (Date.parse(row.sourceCreatedAt) > Date.parse(newestIso)) {
			newestIso = row.sourceCreatedAt
		}
	}

	return newestIso
}

async function runSyncCycle(trigger: LastRunState["trigger"]): Promise<void> {
	const cycleAt = new Date().toISOString()
	const lookbackStartIso = getLookbackStartIso()
	const sinceCursorIso = getEffectiveCursorIso(lookbackStartIso)

	const currentPage = await ensureConnectedPage()
	const feedItems = await fetchReportFeedItems(currentPage, sinceCursorIso)
	const batch = await scrapeRowsFromPage(currentPage, lookbackStartIso, feedItems)
	const persistResult = await persistRows(batch.rows)

	cursorIso = updateCursor(batch.rows, sinceCursorIso)
	lastRun = {
		trigger,
		at: cycleAt,
		pagesFetched: batch.pagesFetched,
		scrapedRows: batch.rows.length,
		upsertedRows: persistResult.upsertedRows,
		geoRows: persistResult.geoRows,
		lookbackStartIso,
		cursorIso,
	}
	lastError = null

	console.log("[listener] cycle success", lastRun)
}

async function triggerManualRun(): Promise<void> {
	if (running || shuttingDown) {
		return
	}

	running = true
	try {
		await runSyncCycle("manual")
	} catch (error) {
		lastError = error instanceof Error ? error.message : String(error)
		console.error("[listener] manual run failed:", lastError)
		await closeBrowser()
	} finally {
		running = false
	}
}

async function runListenerLoop(): Promise<void> {
	let backoffMs = CONFIG.reconnectBaseMs

	while (!shuttingDown) {
		running = true
		try {
			await runSyncCycle(lastRun ? "loop" : "startup")
			backoffMs = CONFIG.reconnectBaseMs
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error)
			console.error(`[listener] cycle failed: ${lastError}`)
			await closeBrowser()

			if (CONFIG.runOnce) {
				running = false
				break
			}

			const delay = Math.min(backoffMs, CONFIG.reconnectMaxMs)
			console.log(`[listener] retrying in ${delay}ms`)
			await sleep(delay)
			backoffMs = Math.min(backoffMs * 2, CONFIG.reconnectMaxMs)
			running = false
			continue
		}

		running = false

		if (CONFIG.runOnce) break
		await sleep(CONFIG.pollIntervalMs)
	}
}

function startHealthServer(): void {
	const server = http.createServer((req, res) => {
		if (req.url === "/health") {
			res.writeHead(200, { "content-type": "application/json" })
			res.end(
				JSON.stringify({
					ok: true,
					running,
					shuttingDown,
					lastRun,
					lastError,
					cursorIso,
					config: {
						targetUrl: CONFIG.targetUrl,
						lookbackDays: CONFIG.lookbackDays,
						pollIntervalMs: CONFIG.pollIntervalMs,
						maxPages: CONFIG.maxPages,
						pageSize: CONFIG.pageSize,
					},
				})
			)
			return
		}

		if (req.url === "/run-now" && req.method === "POST") {
			void triggerManualRun()
			res.writeHead(202, { "content-type": "application/json" })
			res.end(JSON.stringify({ ok: true, queued: true }))
			return
		}

		res.writeHead(200, { "content-type": "text/plain" })
		res.end("ok")
	})

	server.listen(CONFIG.port, () => {
		console.log(`[server] listening on :${CONFIG.port}`)
	})
}

async function shutdown(signal: string): Promise<void> {
	if (shuttingDown) return

	shuttingDown = true
	console.log(`[listener] shutdown requested (${signal})`)
	await closeBrowser()
	await pool.end().catch(() => undefined)
}

function registerShutdownHandlers(): void {
	process.on("SIGINT", () => {
		void shutdown("SIGINT")
	})

	process.on("SIGTERM", () => {
		void shutdown("SIGTERM")
	})
}

async function main(): Promise<void> {
	if (CONFIG.startHealthServer) {
		startHealthServer()
	}

	registerShutdownHandlers()
	await ensureDatabaseIsReachable()
	await runListenerLoop()

	if (CONFIG.runOnce) {
		console.log("[listener] run-once mode complete")
	}
}

void main()
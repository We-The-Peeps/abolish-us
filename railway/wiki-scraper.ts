import { Pool } from "pg";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

/**
 * ICE List Wiki Agent Scraper
 * One-shot script for Railway function
 */

interface Config {
  wsEndpoint: string;
  databaseUrl: string;
  targetUrl: string;
  userAgent: string;
  navigationTimeoutMs: number;
  selectorTimeoutMs: number;
  politeDelayMs: number;
  logEvery: number;
  maxBrowserResets: number;
  maxNavRetries: number;
  useMediaWikiApi: boolean;
}

interface AgentData {
  wiki_name: string;
  full_name: string | null;
  agency: string | null;
  role: string | null;
  field_office: string | null;
  state: string | null;
  status: string | null;
  verification_status: string | null;
  external_links: string[];
  notes: string | null;
  infobox: Record<string, string>;
}

interface ErrorInfo {
  name: string;
  message: string;
  stack: string | null;
}

interface BrowserState {
  browser: Browser | null;
  page: Page | null;
  resets: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  return {
    wsEndpoint: process.env.BROWSERLESS_WS_ENDPOINT || "ws://localhost:3000",
    databaseUrl,
    targetUrl: "https://wiki.icelist.is/index.php/Category:Agents",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    navigationTimeoutMs: parsePositiveInt(process.env.NAV_TIMEOUT_MS, 90_000),
    selectorTimeoutMs: parsePositiveInt(process.env.SELECTOR_TIMEOUT_MS, 12_000),
    politeDelayMs: parsePositiveInt(process.env.POLITE_DELAY_MS, 250),
    logEvery: parsePositiveInt(process.env.LOG_EVERY, 50),
    maxBrowserResets: parsePositiveInt(process.env.MAX_BROWSER_RESETS, 50),
    maxNavRetries: parsePositiveInt(process.env.MAX_NAV_RETRIES, 2),
    useMediaWikiApi: String(process.env.USE_MEDIAWIKI_API ?? "true") === "true",
  };
}

const CONFIG = getConfig();

const pool = new Pool({
  connectionString: CONFIG.databaseUrl,
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || String(error),
      stack: error.stack ?? null,
    };
  }
  return {
    name: "UnknownError",
    message:
      typeof error === "string"
        ? error
        : JSON.stringify(error) ?? String(error),
    stack: null,
  };
}

function isDetachedFrameError(error: unknown): boolean {
  const info = toErrorInfo(error);
  const msg = `${info.name}: ${info.message}`.toLowerCase();
  return (
    msg.includes("detached frame") ||
    msg.includes("disposed") ||
    msg.includes("target closed") ||
    msg.includes("session closed") ||
    msg.includes("execution context was destroyed") ||
    msg.includes("most likely because of a navigation") ||
    msg.includes("navigation failed because browser has disconnected")
  );
}

async function closeBrowser(state: BrowserState): Promise<void> {
  const { page, browser } = state;
  try {
    if (page && !page.isClosed()) await page.close().catch(() => undefined);
  } catch {}
  try {
    if (browser) await browser.close().catch(() => undefined);
  } catch {}
  state.page = null;
  state.browser = null;
}

async function ensureBrowserAndPage(state: BrowserState): Promise<Page> {
  const browserAny = state.browser as unknown as { isConnected?: () => boolean; connected?: boolean } | null;
  const browserConnected =
    browserAny?.isConnected?.() ?? browserAny?.connected ?? true;
  if (state.page && state.browser && !state.page.isClosed() && browserConnected) {
    return state.page;
  }

  state.browser = await puppeteer.connect({
    browserWSEndpoint: CONFIG.wsEndpoint,
  });
  state.page = await state.browser.newPage();
  await state.page.setUserAgent(CONFIG.userAgent);
  state.page.setDefaultNavigationTimeout(CONFIG.navigationTimeoutMs);
  state.page.setDefaultTimeout(CONFIG.selectorTimeoutMs);
  return state.page;
}

async function resetBrowser(state: BrowserState, reason: string): Promise<void> {
  state.resets += 1;
  // Keep logs short to avoid Railway log rate limiting.
  console.warn(`[scraper] resetting browser (${state.resets}): ${reason}`);
  await closeBrowser(state);
  await ensureBrowserAndPage(state);
}

async function gotoWithRetries(
  state: BrowserState,
  url: string
): Promise<Page> {
  for (let attempt = 1; attempt <= CONFIG.maxNavRetries; attempt += 1) {
    const page = await ensureBrowserAndPage(state);
    try {
      // MediaWiki pages can keep connections open; "domcontentloaded" tends to be the most reliable.
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: CONFIG.navigationTimeoutMs,
      });
      return page;
    } catch (error) {
      const willReset = isDetachedFrameError(error);
      if (willReset && state.resets < CONFIG.maxBrowserResets) {
        await resetBrowser(state, toErrorInfo(error).message);
        continue;
      }

      // Non-resettable navigation errors: just retry with a fresh Page once.
      if (attempt < CONFIG.maxNavRetries) {
        // Sometimes only the page is hosed; try closing and creating a new one.
        await closeBrowser(state);
        continue;
      }

      throw error;
    }
  }

  // Should be unreachable.
  return ensureBrowserAndPage(state);
}

async function fetchJsonWithTimeout(url: string): Promise<{
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.navigationTimeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "user-agent": CONFIG.userAgent,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: response.ok, status: response.status, json, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function* iterateAgentUrlsViaMediaWikiApi(args: {
  onPageFetched: () => void;
}): AsyncGenerator<string> {
  const origin = new URL(CONFIG.targetUrl).origin;
  let cmcontinue: string | null = null;

  while (true) {
    const api = new URL("/api.php", origin);
    api.searchParams.set("action", "query");
    api.searchParams.set("list", "categorymembers");
    api.searchParams.set("cmtitle", "Category:Agents");
    api.searchParams.set("cmtype", "page");
    api.searchParams.set("cmlimit", "500");
    api.searchParams.set("format", "json");
    api.searchParams.set("formatversion", "2");
    if (cmcontinue) api.searchParams.set("cmcontinue", cmcontinue);

    args.onPageFetched();

    // If the API call flakes, we just retry a couple times and then stop (no more URLs).
    let payload:
      | { ok: boolean; status: number; json: unknown; text: string }
      | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        payload = await fetchJsonWithTimeout(api.toString());
        break;
      } catch (error) {
        const info = toErrorInfo(error);
        console.warn(
          `[scraper] category API fetch failed (attempt ${attempt}/3): ${info.message}`
        );
        await sleep(Math.min(1_000 * attempt, 3_000));
      }
    }

    if (!payload) break;

    if (!payload.ok) {
      console.warn(
        `[scraper] category API non-200 (${payload.status}): ${payload.text.slice(
          0,
          180
        )}`
      );
      break;
    }

    const data = payload.json as {
      query?: { categorymembers?: Array<{ title?: unknown }> };
      continue?: { cmcontinue?: unknown };
    };
    const members = data?.query?.categorymembers ?? [];

    for (const member of members) {
      if (!member || typeof member !== "object") continue;
      const title = member.title;
      if (typeof title !== "string" || !title.length) continue;
      const slug = encodeURIComponent(title.replace(/ /g, "_"));
      yield new URL(`/index.php/${slug}`, origin).toString();
    }

    const next = data?.continue?.cmcontinue;
    if (typeof next === "string" && next.length) {
      cmcontinue = next;
      // Be polite to the API as well.
      await sleep(CONFIG.politeDelayMs);
      continue;
    }

    break;
  }
}

async function scrapeAgentDetail(
  state: BrowserState,
  url: string
): Promise<AgentData> {
  const page = await gotoWithRetries(state, url);

  await page
    .waitForSelector(".mw-parser-output", {
      timeout: CONFIG.selectorTimeoutMs,
    })
    .catch(() => null);

  const result = await page.evaluate((): AgentData => {
    const wiki_name =
      window.location.pathname.split("/").filter(Boolean).pop() ?? "";
    const full_name =
      document.querySelector("#firstHeading")?.textContent?.trim() ?? null;

    const infobox: Record<string, string> = {};
    const external_links: string[] = [];
    let notes = "";

    const box = document.querySelector(".infobox");
    if (box) {
      const rows = Array.from(box.querySelectorAll("tr"));
      for (const row of rows) {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (!th || !td) continue;
        const key = th.textContent?.trim() ?? "";
        const val = td.textContent?.trim() ?? "";
        if (!key.length) continue;
        infobox[key] = val;
      }
    }

    const mwOutput = document.querySelector(".mw-parser-output");
    if (mwOutput) {
      // Evidence and Sources: for this wiki, it tends to be an element with class "mw-heading".
      let inEvidence = false;
      for (const child of Array.from(mwOutput.children)) {
        const isHeading = child.classList.contains("mw-heading");
        const headingText = isHeading ? child.textContent ?? "" : "";
        if (isHeading && headingText.includes("Evidence and Sources")) {
          inEvidence = true;
          continue;
        }
        if (inEvidence) {
          if (isHeading) break;
          const anchors = Array.from(child.querySelectorAll("a"));
          for (const a of anchors) {
            const href = (a as HTMLAnchorElement).href;
            if (!href) continue;
            if (href.includes("wiki.icelist.is")) continue;
            external_links.push(href);
          }
        }
      }

      let inNotes = false;
      for (const child of Array.from(mwOutput.children)) {
        const isHeading = child.classList.contains("mw-heading");
        const headingText = isHeading ? child.textContent ?? "" : "";
        if (isHeading && headingText.includes("Notes")) {
          inNotes = true;
          continue;
        }
        if (inNotes) {
          if (isHeading) break;
          notes += `${child.textContent ?? ""}\n`;
        }
      }
    }

    const mapped: AgentData = {
      wiki_name,
      full_name,
      agency: infobox["Agency"] ?? null,
      role: infobox["Role"] ?? null,
      field_office: infobox["Field Office"] ?? null,
      state: infobox["State"] ?? null,
      status: infobox["Status"] ?? null,
      verification_status: infobox["Verification"] ?? null,
      external_links: external_links.filter(Boolean),
      notes: notes.trim().length ? notes.trim() : null,
      infobox,
    };

    return mapped;
  });

  if (!result.wiki_name || typeof result.wiki_name !== "string") {
    throw new Error("Missing wiki_name from agent page evaluate()");
  }

  return result;
}

async function main() {
  const state: BrowserState = { browser: null, page: null, resets: 0 };
  try {
    console.log("[scraper] starting");

    await ensureBrowserAndPage(state);

    let totalScraped = 0;
    let totalFailed = 0;
    let categoryPages = 0;

    const agentUrlIterator = CONFIG.useMediaWikiApi
      ? iterateAgentUrlsViaMediaWikiApi({
          onPageFetched: () => {
            categoryPages += 1;
            if (categoryPages % CONFIG.logEvery === 0) {
              console.log(`[scraper] fetched ${categoryPages} category api pages`);
            }
          },
        })
      : (async function* () {
          // Fallback: old HTML paging, kept only as a safety valve.
          let currentUrl: string | null = CONFIG.targetUrl;
          while (currentUrl) {
            categoryPages += 1;
            const page = await gotoWithRetries(state, currentUrl);
            const agentLinks = await page.evaluate(() => {
              const pagesDiv = document.querySelector("#mw-pages");
              if (!pagesDiv) return [];
              const links = Array.from(
                pagesDiv.querySelectorAll("a")
              ) as HTMLAnchorElement[];
              return links
                .filter(
                  (a) =>
                    !a.href.includes("pagefrom=") &&
                    !a.href.includes("action=edit")
                )
                .map((a) => a.href);
            });
            for (const link of agentLinks) yield link;
            currentUrl = await page.evaluate(() => {
              const nextLink = Array.from(document.querySelectorAll("a")).find(
                (a) => (a.textContent ?? "").includes("next page")
              ) as HTMLAnchorElement | undefined;
              return nextLink ? nextLink.href : null;
            });
          }
        })();

    for await (const link of agentUrlIterator) {
        let agentData: AgentData | null = null;

        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            agentData = await scrapeAgentDetail(state, link);
            break;
          } catch (error) {
            const willReset = isDetachedFrameError(error);
            if (willReset && state.resets < CONFIG.maxBrowserResets) {
              await resetBrowser(state, toErrorInfo(error).message);
              continue;
            }
            break;
          }
        }

        if (!agentData) {
          totalFailed += 1;
          if (totalFailed % CONFIG.logEvery === 0) {
            console.warn(`[scraper] failures so far: ${totalFailed}`);
          }
          continue;
        }
          
        // Upsert into Postgres
        await pool
          .query(
            `
            INSERT INTO public.wiki_agents (
              wiki_name, full_name, agency, role, field_office, state, status, 
              verification_status, external_links, notes, raw_infobox
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (wiki_name) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              agency = EXCLUDED.agency,
              role = EXCLUDED.role,
              field_office = EXCLUDED.field_office,
              state = EXCLUDED.state,
              status = EXCLUDED.status,
              verification_status = EXCLUDED.verification_status,
              external_links = EXCLUDED.external_links,
              notes = EXCLUDED.notes,
              raw_infobox = EXCLUDED.raw_infobox,
              updated_at = NOW(),
              last_scraped_at = NOW()
          `.trim(),
            [
            agentData.wiki_name,
            agentData.full_name,
            agentData.agency,
            agentData.role,
            agentData.field_office,
            agentData.state,
            agentData.status,
            agentData.verification_status,
            JSON.stringify(agentData.external_links),
            agentData.notes,
            JSON.stringify(agentData.infobox),
          ]
          )
          .catch(() => {
            totalFailed += 1;
          });

        totalScraped += 1;
        if (totalScraped % CONFIG.logEvery === 0) {
          console.log(
            `[scraper] progress: scraped=${totalScraped} failed=${totalFailed} categoryPages=${categoryPages} resets=${state.resets}`
          );
        }

        // Small delay to be nice to the wiki (and helps reduce flakiness).
        await sleep(CONFIG.politeDelayMs);
    }

    console.log(
      `[scraper] complete scraped=${totalScraped} failed=${totalFailed} categoryPages=${categoryPages} resets=${state.resets}`
    );

  } catch (error) {
    const info = toErrorInfo(error);
    console.error(`[scraper] failed: ${info.name}: ${info.message}`);
  } finally {
    await closeBrowser(state);
    await pool.end();
  }
}

main();

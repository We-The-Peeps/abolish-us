import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'

export interface GdpCountryRecord {
  rank: number
  country: string
  gdpDisplay: string
  gdpFullValueUsd: number | null
  gdpGrowthPercent: number | null
  gdpPerCapitaUsd: number | null
}

export interface GdpSnapshot {
  sourceUrl: string
  fetchedAt: string
  records: GdpCountryRecord[]
}

export interface GdpByCountryResponse extends GdpSnapshot {
  cacheStatus: 'hit' | 'miss' | 'refreshed' | 'stale-fallback'
}

const WORLDOMETERS_GDP_BY_COUNTRY_URL =
  'https://www.worldometers.info/gdp/gdp-by-country/'
const GDP_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const GDP_CACHE_FILE = path.join(process.cwd(), '.cache', 'gdp-by-country.json')

const TABLE_REGEX = /<table[\s\S]*?<\/table>/gi
const ROW_REGEX = /<tr[\s\S]*?<\/tr>/gi
const CELL_REGEX = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
const TAG_REGEX = /<[^>]+>/g

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function normalizeText(value: string): string {
  return decodeHtmlEntities(value.replace(TAG_REGEX, '')).replace(/\s+/g, ' ').trim()
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/[^0-9.\-]/g, '')
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseInteger(value: string): number | null {
  const normalized = value.replace(/[^0-9\-]/g, '')
  if (!normalized) {
    return null
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function pickGdpTable(documentHtml: string): string | null {
  const tables = documentHtml.match(TABLE_REGEX)
  if (!tables?.length) {
    return null
  }

  return (
    tables.find(
      (tableHtml) =>
        tableHtml.includes('GDP (Full Value)') && tableHtml.includes('GDP per Capita'),
    ) ?? null
  )
}

function parseGdpTable(tableHtml: string): GdpCountryRecord[] {
  const rows = tableHtml.match(ROW_REGEX) ?? []
  const records: GdpCountryRecord[] = []

  for (const rowHtml of rows) {
    const cells = Array.from(rowHtml.matchAll(CELL_REGEX)).map((match) => normalizeText(match[1] ?? ''))

    if (cells.length < 6) {
      continue
    }

    const rank = parseInteger(cells[0])
    if (rank === null) {
      continue
    }

    records.push({
      rank,
      country: cells[1],
      gdpDisplay: cells[2],
      gdpFullValueUsd: parseNumber(cells[3]),
      gdpGrowthPercent: parseNumber(cells[4]),
      gdpPerCapitaUsd: parseNumber(cells[5]),
    })
  }

  return records
}

async function readCacheFile(): Promise<GdpSnapshot | null> {
  try {
    const raw = await fs.readFile(GDP_CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as GdpSnapshot

    if (
      !parsed ||
      typeof parsed.fetchedAt !== 'string' ||
      typeof parsed.sourceUrl !== 'string' ||
      !Array.isArray(parsed.records)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

async function writeCacheFile(snapshot: GdpSnapshot): Promise<void> {
  const cacheDirectory = path.dirname(GDP_CACHE_FILE)
  await fs.mkdir(cacheDirectory, { recursive: true })
  await fs.writeFile(GDP_CACHE_FILE, JSON.stringify(snapshot, null, 2), 'utf8')
}

function isFreshSnapshot(snapshot: GdpSnapshot): boolean {
  const fetchedAtMs = Date.parse(snapshot.fetchedAt)
  if (!Number.isFinite(fetchedAtMs)) {
    return false
  }

  return Date.now() - fetchedAtMs < GDP_CACHE_TTL_MS
}

export async function scrapeGdpByCountry(): Promise<GdpSnapshot> {
  const response = await fetch(WORLDOMETERS_GDP_BY_COUNTRY_URL, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; abolish-us/1.0; +https://www.worldometers.info)',
    },
  })

  if (!response.ok) {
    throw new Error(`Worldometer GDP request failed: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const gdpTable = pickGdpTable(html)
  if (!gdpTable) {
    throw new Error('Unable to locate GDP by country table on Worldometer page')
  }

  const records = parseGdpTable(gdpTable)
  if (!records.length) {
    throw new Error('GDP table parsed successfully but no records were extracted')
  }

  return {
    sourceUrl: WORLDOMETERS_GDP_BY_COUNTRY_URL,
    fetchedAt: new Date().toISOString(),
    records,
  }
}

export const getGdpByCountry = createServerFn({
  method: 'GET',
}).handler(async (): Promise<GdpByCountryResponse> => {
  const cachedSnapshot = await readCacheFile()
  if (cachedSnapshot && isFreshSnapshot(cachedSnapshot)) {
    return { ...cachedSnapshot, cacheStatus: 'hit' }
  }

  try {
    const snapshot = await scrapeGdpByCountry()
    await writeCacheFile(snapshot)
    return {
      ...snapshot,
      cacheStatus: cachedSnapshot ? 'refreshed' : 'miss',
    }
  } catch (error) {
    if (cachedSnapshot) {
      return { ...cachedSnapshot, cacheStatus: 'stale-fallback' }
    }

    throw error
  }
})

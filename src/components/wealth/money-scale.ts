import { formatDollars, type ComparisonPreset } from '@/data/billionaires'

export interface MoneyDomain {
  min: number
  max: number
}

export interface PositionedLabel {
  id: string
  x: number
  priority: number
}

export interface SpreadRange {
  id: string
  label: string
  amount: number
  amountLabel: string
  kind: NonNullable<ComparisonPreset['kind']>
  domainStart: number
  domainEnd: number
}

const MIN_DOMAIN_SPAN_FRACTION = 1e-9
const MIN_DOMAIN_SPAN_ABSOLUTE = 10

export function getMoneyScaleBounds(
  spreadRanges: SpreadRange[],
  maxAnchor: number,
): MoneyDomain {
  const stackedMax =
    spreadRanges.length > 0
      ? Math.max(...spreadRanges.map((r) => r.domainEnd))
      : 0
  const rawMax = Math.max(stackedMax * 1.02, maxAnchor, 1)
  return {
    min: 0,
    max: rawMax,
  }
}

export function clampDomain(domain: MoneyDomain, bounds: MoneyDomain): MoneyDomain {
  let min = Math.max(domain.min, bounds.min)
  let max = Math.min(domain.max, bounds.max)

  if (!Number.isFinite(min) || min <= 0) {
    min = bounds.min
  }

  if (!Number.isFinite(max) || max <= 0) {
    max = bounds.max
  }

  if (min >= max) {
    min = bounds.min
    max = bounds.max
  }

  const boundsSpan = Math.max(1, bounds.max - bounds.min)
  const minSpan = Math.max(
    MIN_DOMAIN_SPAN_ABSOLUTE,
    boundsSpan * MIN_DOMAIN_SPAN_FRACTION,
  )
  const span = max - min

  if (span < minSpan) {
    const center = (min + max) / 2
    min = Math.max(bounds.min, center - minSpan / 2)
    max = Math.min(bounds.max, center + minSpan / 2)

    if (max - min < minSpan) {
      if (min <= bounds.min) {
        max = Math.min(bounds.max, min + minSpan)
      } else {
        min = Math.max(bounds.min, max - minSpan)
      }
    }
  }

  return { min, max }
}

export function getLinearTicks(domain: MoneyDomain): number[] {
  const span = Math.max(1, domain.max - domain.min)
  const roughStep = span / 6
  const power = 10 ** Math.floor(Math.log10(Math.max(1, roughStep)))
  const normalized = roughStep / power

  let multiplier = 1
  if (normalized > 5) multiplier = 10
  else if (normalized > 2) multiplier = 5
  else if (normalized > 1) multiplier = 2

  const step = power * multiplier
  const start = Math.ceil(domain.min / step) * step
  const ticks: number[] = []

  for (let value = start; value <= domain.max; value += step) {
    ticks.push(value)
  }

  if (ticks.length === 0) {
    ticks.push(domain.min, domain.max)
  }

  return ticks
}

export function formatRangeLabel(domain: MoneyDomain): string {
  return formatDollars(Math.round(Math.max(0, domain.max - domain.min)))
}

/**
 * Slide the visible window left/right while **strictly preserving** the
 * current span.  Useful for continuous pan (arrow hold) and brush drag.
 */
export function slideDomain(
  domain: MoneyDomain,
  bounds: MoneyDomain,
  direction: -1 | 1,
  stepFraction = 0.03,
): MoneyDomain {
  const span = domain.max - domain.min
  const shift = span * stepFraction * direction
  let min = domain.min + shift
  let max = domain.max + shift

  if (min < bounds.min) {
    min = bounds.min
    max = bounds.min + span
  }
  if (max > bounds.max) {
    max = bounds.max
    min = bounds.max - span
  }

  return { min, max }
}

export function zoomDomainToRange(
  rangeStart: number,
  rangeEnd: number,
  bounds: MoneyDomain,
): MoneyDomain {
  const normalizedStart = Math.min(rangeStart, rangeEnd)
  const normalizedEnd = Math.max(rangeStart, rangeEnd)
  const rangeSpan = Math.max(1, normalizedEnd - normalizedStart)
  const center = (normalizedStart + normalizedEnd) / 2
  /* clicked range should occupy ~34 % of the visible chart width */
  const targetSpan = Math.max(10_000, rangeSpan / 0.34)

  return clampDomain(
    {
      min: center - targetSpan / 2,
      max: center + targetSpan / 2,
    },
    bounds,
  )
}

export function compactDollarLabel(value: number): string {
  return formatDollars(Math.round(value))
}

export function filterCollidingLabels(
  labels: PositionedLabel[],
  minimumGapPx: number,
): Set<string> {
  const sorted = [...labels].sort((a, b) => b.priority - a.priority || a.x - b.x)
  const accepted: PositionedLabel[] = []
  const acceptedIds = new Set<string>()

  for (const label of sorted) {
    const collides = accepted.some((existing) => Math.abs(existing.x - label.x) < minimumGapPx)
    if (!collides) {
      accepted.push(label)
      acceptedIds.add(label.id)
    }
  }

  return acceptedIds
}

/** Fraction of each bar's width used as the gap after it. */
const SEQUENTIAL_GAP_FRACTION = 0.04

/**
 * Lay out presets sequentially: each bar is as wide as its dollar amount,
 * placed end-to-end with a small proportional gap in between.
 */
export function getSpreadRanges(
  presets: ComparisonPreset[],
): SpreadRange[] {
  let cursor = 0

  return presets.map((preset) => {
    const kind = preset.kind ?? 'income'
    const amount = Math.max(1, preset.amount)
    const domainStart = cursor
    const domainEnd = cursor + amount

    cursor = domainEnd + amount * SEQUENTIAL_GAP_FRACTION

    return {
      id: preset.key,
      label: preset.label,
      amount,
      amountLabel: formatDollars(amount),
      kind,
      domainStart,
      domainEnd,
    }
  })
}

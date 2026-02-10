import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSize } from 'ahooks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { comparisonPresets, type ComparisonPreset } from '@/data/billionaires'
import MoneyScaleBrush from './MoneyScaleBrush'
import MoneyScaleChart from './MoneyScaleChart'
import {
  clampDomain,
  formatRangeLabel,
  getMoneyScaleBounds,
  slideDomain,
  getSpreadRanges,
  type MoneyDomain,
  zoomDomainToRange,
} from './money-scale'

/* ── animation / pan constants ── */
const ANIMATION_DURATION_MS = 550
const PAN_INITIAL_DELAY_MS = 350
const PAN_INITIAL_STEP = 0.025
/** Per-frame step at ~60 fps → ≈24 % of visible range per second */
const RAF_PAN_STEP = 0.004

/** easeOutCubic: fast start, gentle deceleration */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

interface MoneyScaleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPreset: ComparisonPreset | null
  targetWealthBillions: number
  targetLabel: string
}

export default function MoneyScaleDrawer({
  open,
  onOpenChange,
  selectedPreset,
  targetWealthBillions,
  targetLabel,
}: MoneyScaleDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const size = useSize(containerRef)
  const selectedTargetAmount = targetWealthBillions * 1_000_000_000
  const spreadRanges = useMemo(() => getSpreadRanges(comparisonPresets), [])
  const bounds = useMemo(
    () => getMoneyScaleBounds(spreadRanges, selectedTargetAmount),
    [spreadRanges, selectedTargetAmount],
  )

  const [visibleDomain, setVisibleDomain] = useState<MoneyDomain>(() => bounds)

  /* ── animated domain transitions ── */
  const rafRef = useRef<number | null>(null)
  const domainRef = useRef<MoneyDomain>(bounds)
  domainRef.current = visibleDomain

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const animateToDomain = useCallback(
    (target: MoneyDomain, duration = ANIMATION_DURATION_MS) => {
      cancelAnimation()
      const from = { ...domainRef.current }
      const startTime = performance.now()

      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        const eased = easeOutCubic(t)
        const current: MoneyDomain = {
          min: from.min + (target.min - from.min) * eased,
          max: from.max + (target.max - from.max) * eased,
        }
        setVisibleDomain(current)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    },
    [cancelAnimation],
  )

  /* ── continuous pan (arrow hold → rAF loop) ── */
  const panDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panRafRef = useRef<number | null>(null)

  const stopContinuousPan = useCallback(() => {
    if (panDelayRef.current) {
      clearTimeout(panDelayRef.current)
      panDelayRef.current = null
    }
    if (panRafRef.current) {
      cancelAnimationFrame(panRafRef.current)
      panRafRef.current = null
    }
  }, [])

  const startContinuousPan = useCallback(
    (direction: -1 | 1) => {
      cancelAnimation()
      stopContinuousPan()

      // immediate first step
      setVisibleDomain((prev) => slideDomain(prev, bounds, direction, PAN_INITIAL_STEP))

      // after debounce delay, start smooth rAF loop
      panDelayRef.current = setTimeout(() => {
        const tick = () => {
          setVisibleDomain((prev) => slideDomain(prev, bounds, direction, RAF_PAN_STEP))
          panRafRef.current = requestAnimationFrame(tick)
        }
        panRafRef.current = requestAnimationFrame(tick)
      }, PAN_INITIAL_DELAY_MS)
    },
    [bounds, cancelAnimation, stopContinuousPan],
  )

  /* ── brush drag / resize handler (direct, no animation) ── */
  const handleBrushChange = useCallback(
    (domain: MoneyDomain) => {
      cancelAnimation()
      stopContinuousPan()
      setVisibleDomain(clampDomain(domain, bounds))
    },
    [cancelAnimation, stopContinuousPan, bounds],
  )

  /* ── lifecycle ── */
  useEffect(() => {
    return () => {
      cancelAnimation()
      stopContinuousPan()
    }
  }, [cancelAnimation, stopContinuousPan])

  useEffect(() => {
    if (!open) return
    setVisibleDomain(bounds)
  }, [open, bounds])

  /* Use a viewport-based fallback so the chart renders at a reasonable
     size on the very first frame before useSize measures the container. */
  const fallbackWidth =
    typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.92, 1056) : 1056
  const chartWidth = Math.max(280, Math.floor((size?.width ?? fallbackWidth) - 64))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1120px)] max-w-[min(96vw,1120px)] p-0 sm:max-w-[min(96vw,1120px)]">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="font-serif text-4xl leading-tight">
            Zoomable Money Scale: {targetLabel}
          </DialogTitle>
          <DialogDescription className="max-w-3xl text-pretty text-xl">
            Start at the full wealth range, then click any benchmark line to zoom and center on it.
            Use the side controls below to pan the visible window left or right at the current
            scale.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="flex max-h-[75vh] min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-sans text-xs">
              Visible range: {formatRangeLabel(visibleDomain)}
            </Badge>
            {selectedPreset && (
              <Badge variant="outline" className="font-sans text-xs">
                Benchmark: {selectedPreset.label}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto font-sans text-xs"
              onClick={() => animateToDomain(bounds)}
            >
              Reset zoom
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card px-2 pt-2 pb-4">
            <MoneyScaleChart
              width={chartWidth}
              visibleDomain={visibleDomain}
              spreadRanges={spreadRanges}
              selectedPreset={selectedPreset}
              onRangeClick={(range) => {
                animateToDomain(
                  zoomDomainToRange(range.domainStart, range.domainEnd, bounds),
                )
              }}
            />
            <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Each vertical mark starts as a thin line and widens into the true value range as you
              zoom. All markers remain linear to the selected billionaire&apos;s full wealth scale.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Pan visible range left"
                onPointerDown={() => startContinuousPan(-1)}
                onPointerUp={stopContinuousPan}
                onPointerLeave={stopContinuousPan}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <MoneyScaleBrush
                width={Math.max(180, chartWidth - 96)}
                bounds={bounds}
                visibleDomain={visibleDomain}
                spreadRanges={spreadRanges}
                onDomainChange={handleBrushChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Pan visible range right"
                onPointerDown={() => startContinuousPan(1)}
                onPointerUp={stopContinuousPan}
                onPointerLeave={stopContinuousPan}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useCallback, useId, useRef } from 'react'
import { Group } from '@visx/group'
import { PatternLines } from '@visx/pattern'
import { scaleLinear } from '@visx/scale'
import type { MoneyDomain, SpreadRange } from './money-scale'

interface MoneyScaleBrushProps {
  width: number
  height?: number
  bounds: MoneyDomain
  visibleDomain: MoneyDomain
  spreadRanges: SpreadRange[]
  onDomainChange?: (domain: MoneyDomain) => void
}

type DragMode = 'pan' | 'resize-left' | 'resize-right'

interface DragState {
  mode: DragMode
  startX: number
  startDomain: MoneyDomain
}

const margin = { top: 12, right: 20, bottom: 16, left: 20 }
const grayscalePalette = ['#171717', '#404040', '#525252', '#737373', '#8a8a8a', '#a3a3a3']
const MIN_VISIBLE_WIDTH = 6
const HANDLE_HIT_ZONE = 14

/** visx-style brush handle path (8×15 with two grip lines) */
const BRUSH_HANDLE_PATH =
  'M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12'
const BRUSH_HANDLE_HEIGHT = 15

export default function MoneyScaleBrush({
  width,
  height = 88,
  bounds,
  visibleDomain,
  spreadRanges,
  onDomainChange,
}: MoneyScaleBrushProps) {
  const patternId = `brush-pat-${useId().replace(/:/g, '-')}`
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const pxToDomainDelta = useCallback(
    (deltaPx: number) => {
      if (innerWidth <= 0) return 0
      return (deltaPx / innerWidth) * (bounds.max - bounds.min)
    },
    [bounds, innerWidth],
  )

  /* ── pointer handlers ── */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!onDomainChange) return
      const svg = svgRef.current
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const localX = e.clientX - rect.left - margin.left

      // compute brush rect for hit testing
      const xScale = scaleLinear<number>({
        domain: [bounds.min, bounds.max],
        range: [0, innerWidth],
        clamp: true,
      })
      const rawStart = xScale(visibleDomain.min)
      const rawEnd = xScale(visibleDomain.max)
      const vLeft = Math.min(rawStart, rawEnd)
      const vWidth = Math.max(MIN_VISIBLE_WIDTH, Math.abs(rawEnd - rawStart))
      const vX = Math.max(0, Math.min(innerWidth - vWidth, vLeft))
      const vRight = vX + vWidth

      // handles have priority over body
      let mode: DragMode | null = null
      if (Math.abs(localX - vX) <= HANDLE_HIT_ZONE) {
        mode = 'resize-left'
      } else if (Math.abs(localX - vRight) <= HANDLE_HIT_ZONE) {
        mode = 'resize-right'
      } else if (localX >= vX && localX <= vRight) {
        mode = 'pan'
      }

      if (mode) {
        dragRef.current = { mode, startX: e.clientX, startDomain: { ...visibleDomain } }
        svg.setPointerCapture(e.pointerId)
        e.preventDefault()
      }
    },
    [onDomainChange, visibleDomain, bounds, innerWidth],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current
      if (!drag || !onDomainChange) return

      const deltaPx = e.clientX - drag.startX
      const deltaDomain = pxToDomainDelta(deltaPx)

      if (drag.mode === 'pan') {
        const span = drag.startDomain.max - drag.startDomain.min
        let newMin = drag.startDomain.min + deltaDomain
        let newMax = drag.startDomain.max + deltaDomain
        if (newMin < bounds.min) {
          newMin = bounds.min
          newMax = bounds.min + span
        }
        if (newMax > bounds.max) {
          newMax = bounds.max
          newMin = bounds.max - span
        }
        onDomainChange({ min: newMin, max: newMax })
      } else if (drag.mode === 'resize-left') {
        const newMin = Math.max(
          bounds.min,
          Math.min(drag.startDomain.max - 1, drag.startDomain.min + deltaDomain),
        )
        onDomainChange({ min: newMin, max: drag.startDomain.max })
      } else if (drag.mode === 'resize-right') {
        const newMax = Math.min(
          bounds.max,
          Math.max(drag.startDomain.min + 1, drag.startDomain.max + deltaDomain),
        )
        onDomainChange({ min: drag.startDomain.min, max: newMax })
      }
    },
    [onDomainChange, bounds, pxToDomainDelta],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragRef.current) {
        svgRef.current?.releasePointerCapture(e.pointerId)
        dragRef.current = null
      }
    },
    [],
  )

  /* ── render ── */

  if (innerWidth <= 0) return null

  const xScale = scaleLinear<number>({
    domain: [bounds.min, bounds.max],
    range: [0, innerWidth],
    clamp: true,
  })

  const rawVisibleStart = xScale(visibleDomain.min)
  const rawVisibleEnd = xScale(visibleDomain.max)
  const visibleLeft = Math.min(rawVisibleStart, rawVisibleEnd)
  const visibleWidth = Math.max(MIN_VISIBLE_WIDTH, Math.abs(rawVisibleEnd - rawVisibleStart))
  const visibleX = Math.max(0, Math.min(innerWidth - visibleWidth, visibleLeft))

  const handleTopOffset = (innerHeight - BRUSH_HANDLE_HEIGHT) / 2

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Money scale overview — drag to pan, handles to resize"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={onDomainChange ? 'cursor-grab active:cursor-grabbing' : undefined}
    >
      <PatternLines
        id={patternId}
        width={8}
        height={8}
        stroke="var(--foreground)"
        strokeWidth={1}
        orientation={['diagonal']}
      />

      <Group left={margin.left} top={margin.top}>
        {/* background track */}
        <rect
          x={0}
          y={0}
          width={innerWidth}
          height={innerHeight}
          rx={8}
          fill="var(--muted)"
          opacity={0.45}
        />

        {/* spread range bars */}
        {spreadRanges.map((spreadRange, index) => {
          if (spreadRange.domainEnd < bounds.min || spreadRange.domainStart > bounds.max) {
            return null
          }
          const x1 = xScale(Math.max(bounds.min, spreadRange.domainStart))
          const x2 = xScale(Math.min(bounds.max, spreadRange.domainEnd))
          const barHeight = 22
          const y = (innerHeight - barHeight) / 2
          return (
            <rect
              key={`overview-range-${spreadRange.id}`}
              x={Math.min(x1, x2)}
              y={y}
              width={Math.max(2, Math.abs(x2 - x1))}
              height={barHeight}
              rx={4}
              fill={grayscalePalette[index % grayscalePalette.length] ?? 'var(--foreground)'}
              opacity={0.42}
            />
          )
        })}

        {/* brush selection — pattern fill, tight radius */}
        <rect
          x={visibleX}
          y={0}
          width={visibleWidth}
          height={innerHeight}
          fill={`url(#${patternId})`}
          fillOpacity={0.3}
          stroke="var(--foreground)"
          strokeOpacity={0.7}
          strokeWidth={1.5}
          rx={2}
        />

        {/* left handle — positioned outside the brush box */}
        <Group left={visibleX - 3.5} top={handleTopOffset}>
          <path
            fill="#f2f2f2"
            d={BRUSH_HANDLE_PATH}
            stroke="#999999"
            strokeWidth="1"
            style={{ cursor: 'ew-resize' }}
          />
        </Group>

        {/* right handle — positioned outside the brush box */}
        <Group left={visibleX + visibleWidth + 4.5} top={handleTopOffset}>
          <path
            fill="#f2f2f2"
            d={BRUSH_HANDLE_PATH}
            stroke="#999999"
            strokeWidth="1"
            style={{ cursor: 'ew-resize' }}
          />
        </Group>
      </Group>
    </svg>
  )
}

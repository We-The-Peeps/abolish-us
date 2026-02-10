import { AxisBottom } from '@visx/axis'
import { Group } from '@visx/group'
import { PatternLines } from '@visx/pattern'
import { scaleLinear } from '@visx/scale'
import { useId } from 'react'
import type { ComparisonPreset } from '@/data/billionaires'
import {
  compactDollarLabel,
  filterCollidingLabels,
  getLinearTicks,
  type MoneyDomain,
  type SpreadRange,
} from './money-scale'

interface MoneyScaleChartProps {
  width: number
  height?: number
  visibleDomain: MoneyDomain
  spreadRanges: SpreadRange[]
  selectedPreset: ComparisonPreset | null
  onRangeClick?: (range: SpreadRange) => void
}

const margin = { top: 22, right: 24, bottom: 54, left: 24 }
const grayscalePalette = ['#171717', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8']

export default function MoneyScaleChart({
  width,
  height = 320,
  visibleDomain,
  spreadRanges,
  selectedPreset,
  onRangeClick,
}: MoneyScaleChartProps) {
  const hatchPatternId = useId().replace(/:/g, '-')

  if (width <= margin.left + margin.right) {
    return null
  }

  const innerWidth = width - margin.left - margin.right
  const plotTop = 50
  const plotBottom = 230
  const plotHeight = plotBottom - plotTop
  const xScale = scaleLinear<number>({
    domain: [visibleDomain.min, visibleDomain.max],
    range: [0, innerWidth],
    clamp: true,
  })
  const tickValues = getLinearTicks(visibleDomain)
  const visibleSpreadRanges = spreadRanges
    .map((spreadRange) => ({
      ...spreadRange,
      rangeStart: Math.max(spreadRange.domainStart, visibleDomain.min),
      rangeEnd: Math.min(spreadRange.domainEnd, visibleDomain.max),
    }))
    .filter((spreadRange) => spreadRange.rangeStart <= spreadRange.rangeEnd)
    .map((spreadRange) => ({
      ...spreadRange,
      x1: xScale(Math.min(spreadRange.rangeStart, spreadRange.rangeEnd)),
      x2: xScale(Math.max(spreadRange.rangeStart, spreadRange.rangeEnd)),
      centerX:
        (xScale(Math.min(spreadRange.rangeStart, spreadRange.rangeEnd)) +
          xScale(Math.max(spreadRange.rangeStart, spreadRange.rangeEnd))) /
        2,
      widthPx: Math.max(
        1,
        xScale(Math.max(spreadRange.rangeStart, spreadRange.rangeEnd)) -
          xScale(Math.min(spreadRange.rangeStart, spreadRange.rangeEnd)),
      ),
      isSelected: selectedPreset?.key === spreadRange.id,
    }))

  const visibleLabelIds = filterCollidingLabels(
    visibleSpreadRanges.map((spreadRange) => ({
      id: spreadRange.id,
      x: spreadRange.centerX,
      priority: spreadRange.isSelected ? 100 : 50,
    })),
    110,
  )

  return (
    <div className="relative w-full overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="Zoomed money scale chart">
        <Group left={margin.left} top={margin.top}>
          <PatternLines
            id={hatchPatternId}
            width={10}
            height={10}
            stroke="#8a8a8a"
            strokeWidth={1}
            orientation={['diagonal']}
          />
          <rect
            x={0}
            y={plotTop}
            width={innerWidth}
            height={plotHeight}
            rx={12}
            fill="var(--muted)"
            opacity={0.3}
          />

        {tickValues.map((tick) => (
          <line
            key={`grid-${tick}`}
            x1={xScale(tick)}
            y1={plotTop}
            x2={xScale(tick)}
            y2={plotBottom}
            stroke="var(--color-border)"
            strokeWidth={1}
            strokeDasharray="3 5"
            opacity={0.45}
          />
        ))}

          {visibleSpreadRanges.map((spreadRange, index) => {
            const baseColor =
              grayscalePalette[index % grayscalePalette.length] ?? 'var(--foreground)'
            const markX = spreadRange.x1
            const markWidth = Math.max(1, spreadRange.widthPx)
            const isLineLike = markWidth < 3
            const markY = plotTop + 8
            const markHeight = plotHeight - 10
            const hatchOpacity = spreadRange.isSelected ? 0.8 : 0.55
            const baseOpacity = spreadRange.isSelected ? 0.26 : 0.16

            return (
              <g key={`spread-range-${spreadRange.id}`}>
              <line
                x1={markX}
                y1={markY}
                x2={markX}
                y2={markY + markHeight}
                stroke={baseColor}
                strokeWidth={2}
                opacity={spreadRange.isSelected ? 0.8 : 0.65}
              />
              <rect
                x={markX}
                y={markY}
                width={markWidth}
                height={markHeight}
                fill={baseColor}
                opacity={isLineLike ? 0.95 : baseOpacity}
              />
              {!isLineLike && (
                <rect
                  x={markX}
                  y={markY}
                  width={markWidth}
                  height={markHeight}
                  fill={`url(#${hatchPatternId})`}
                  opacity={hatchOpacity}
                />
              )}
              {!isLineLike && (
                <rect
                  x={markX}
                  y={markY}
                  width={markWidth}
                  height={markHeight}
                  fill="transparent"
                  stroke={baseColor}
                  strokeWidth={2}
                  strokeOpacity={0.8}
                />
              )}
              <line
                x1={markX + markWidth}
                y1={markY}
                x2={markX + markWidth}
                y2={markY + markHeight}
                stroke={baseColor}
                strokeWidth={2}
                opacity={isLineLike ? 0 : 0.75}
              />
              {visibleLabelIds.has(spreadRange.id) && (
                <>
                  <text
                    x={spreadRange.centerX}
                    y={plotTop - 18}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-sans"
                  >
                    {spreadRange.label}
                  </text>
                  <text
                    x={spreadRange.centerX}
                    y={plotTop - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-sans"
                  >
                    {spreadRange.amountLabel}
                  </text>
                </>
              )}
            </g>
            )
          })}

          <AxisBottom
            top={plotBottom + 4}
            scale={xScale}
            tickValues={tickValues}
            stroke="var(--border)"
            tickStroke="var(--border)"
            tickLabelProps={() => ({
              fill: 'var(--muted-foreground)',
              fontSize: 10,
              textAnchor: 'middle',
              dy: 8,
              fontFamily: 'var(--font-sans)',
            })}
            tickFormat={(value) => compactDollarLabel(Number(value))}
          />
        </Group>
      </svg>
      {onRangeClick &&
        visibleSpreadRanges.map((spreadRange) => {
          const rawWidth = Math.max(24, spreadRange.widthPx)
          const rawLeft = margin.left + spreadRange.centerX - rawWidth / 2
          const clampedLeft = Math.max(0, Math.min(width - rawWidth, rawLeft))

          return (
            <button
              key={`hit-area-${spreadRange.id}`}
              type="button"
              aria-label={`Zoom to ${spreadRange.label}`}
              className="absolute cursor-pointer bg-transparent p-0"
              style={{
                left: clampedLeft,
                top: margin.top + plotTop,
                width: rawWidth,
                height: plotHeight,
              }}
              onClick={() => onRangeClick(spreadRange)}
            />
          )
        })}
    </div>
  )
}

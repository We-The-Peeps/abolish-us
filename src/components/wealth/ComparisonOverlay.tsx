import { motion } from 'motion/react'
import { formatDollars } from '@/data/billionaires'
import type { ComparisonPreset } from '@/data/billionaires'

interface ComparisonOverlayProps {
  preset: ComparisonPreset
  containerWidthPx: number
  containerHeightPx: number
  totalWealth: number
}

export default function ComparisonOverlay({
  preset,
  containerWidthPx,
  containerHeightPx,
  totalWealth,
}: ComparisonOverlayProps) {
  const totalDollars = totalWealth * 1_000_000_000
  const ratio = preset.amount / totalDollars
  const totalArea = containerWidthPx * containerHeightPx
  const comparisonArea = totalArea * ratio
  const side = Math.max(Math.sqrt(comparisonArea), 1)

  const percentage = (ratio * 100).toFixed(8)

  return (
    <motion.div
      className="absolute bottom-1 left-1 z-20"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div
        className="bg-destructive/80 border border-destructive rounded-[1px]"
        style={{
          width: Math.max(side, 2),
          height: Math.max(side, 2),
        }}
      />
      <motion.div
        className="absolute left-0 top-full mt-1 whitespace-nowrap bg-card/95 border border-border rounded-md px-2 py-1 shadow-lg"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-[10px] md:text-xs font-bold font-sans">
          {preset.label}: {formatDollars(preset.amount)}
        </div>
        <div className="text-[9px] md:text-[10px] text-muted-foreground font-sans">
          {percentage}% of combined top-10 wealth
        </div>
      </motion.div>
    </motion.div>
  )
}

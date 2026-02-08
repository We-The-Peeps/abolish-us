import { motion } from 'motion/react'
import { formatDollars } from '@/data/billionaires'
import type { ComparisonPreset } from '@/data/billionaires'

interface TimeComparisonProps {
  preset: ComparisonPreset
  targetWealth: number
  targetLabel: string
}

export default function TimeComparison({
  preset,
  targetWealth,
  targetLabel,
}: TimeComparisonProps) {
  const targetDollars = targetWealth * 1_000_000_000
  const years = Math.round(targetDollars / preset.amount)
  const lifetimes = Math.round(years / 79)

  return (
    <motion.div
      className="mt-10 text-center space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
    >
      <motion.p
        className="text-lg md:text-xl leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        At{' '}
        <span className="font-bold">
          {preset.label} ({formatDollars(preset.amount)})
        </span>
        , it would take
      </motion.p>

      <motion.p
        className="text-5xl md:text-7xl font-black tracking-tight"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        {years.toLocaleString()} years
      </motion.p>

      <motion.p
        className="text-lg md:text-xl leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        to reach the wealth of{' '}
        <span className="font-bold">{targetLabel}</span> (
        {formatDollars(targetDollars)}).
      </motion.p>

      <motion.p
        className="text-sm text-muted-foreground mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        That&apos;s roughly{' '}
        <span className="font-bold text-foreground">
          {lifetimes.toLocaleString()} human lifetimes
        </span>
        .
      </motion.p>
    </motion.div>
  )
}

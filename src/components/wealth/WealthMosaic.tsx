import { AnimatePresence } from 'motion/react'
import { useCallback, useState } from 'react'
import {
  billionaires,
  type ComparisonPreset,
  totalTopTenWealth,
} from '@/data/billionaires'
import { env } from '@/env'
import BillionaireBlock from './BillionaireBlock'
import ComparisonChips from './ComparisonChips'
import MoneyScaleDrawer from './MoneyScaleDrawer'
import TimeComparison from './TimeComparison'

export default function WealthMosaic() {
  const isWealthChartsModalEnabled = env.VITE_FEATURE_WEALTH_CHARTS_MODAL
  const [selectedPreset, setSelectedPreset] =
    useState<ComparisonPreset | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [isScaleOpen, setIsScaleOpen] = useState(false)

  const handleSelectPreset = useCallback((preset: ComparisonPreset | null) => {
    setSelectedPreset(preset)
  }, [])

  const handleSelectPerson = useCallback((name: string) => {
    setSelectedPerson(name)
    if (isWealthChartsModalEnabled) {
      setIsScaleOpen(true)
    }
  }, [isWealthChartsModalEnabled])

  const targetWealth = selectedPerson
    ? billionaires.find((b) => b.name === selectedPerson)?.netWorthBillions ??
      totalTopTenWealth
    : totalTopTenWealth

  const targetLabel = selectedPerson ?? 'the top 10 combined'

  const row1 = billionaires.slice(0, 5)
  const row2 = billionaires.slice(5)
  const row1Total = row1.reduce((s, b) => s + b.netWorthBillions, 0)
  const row2Total = row2.reduce((s, b) => s + b.netWorthBillions, 0)

  return (
    <div className="w-full max-w-[960px] px-4">
      <ComparisonChips selected={selectedPreset} onSelect={handleSelectPreset} />

      {/* Mosaic */}
      <div className="relative rounded-xl border border-border overflow-hidden bg-card">
        <div style={{ minHeight: 280 }}>
          <div className="flex w-full" style={{ height: 160 }}>
            {row1.map((b, i) => (
              <BillionaireBlock
                key={b.name}
                name={b.name}
                netWorthBillions={b.netWorthBillions}
                widthPercent={(b.netWorthBillions / row1Total) * 100}
                isTopRow
                isBottomRow={false}
                isFirstInRow={i === 0}
                isLastInRow={i === row1.length - 1}
                isSelected={selectedPerson === b.name}
                onClick={() => handleSelectPerson(b.name)}
              />
            ))}
          </div>
          <div className="flex w-full" style={{ height: 120 }}>
            {row2.map((b, i) => (
              <BillionaireBlock
                key={b.name}
                name={b.name}
                netWorthBillions={b.netWorthBillions}
                widthPercent={(b.netWorthBillions / row2Total) * 100}
                isTopRow={false}
                isBottomRow
                isFirstInRow={i === 0}
                isLastInRow={i === row2.length - 1}
                isSelected={selectedPerson === b.name}
                onClick={() => handleSelectPerson(b.name)}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-1 text-[8px] text-center text-muted-foreground font-sans uppercase tracking-widest">
        Source: Forbes Real-Time Billionaires List, Feb 2026
      </p>

      {/* Time comparison */}
      <AnimatePresence>
        {selectedPreset && (
          <TimeComparison
            preset={selectedPreset}
            targetWealth={targetWealth}
            targetLabel={targetLabel}
          />
        )}
      </AnimatePresence>

      <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
        This is not neutral wealth. Across this class, support for ICE shows up through political
        funding, lobbying, elite philanthropy, and platform amplification on social media networks 
        owned by those same billionaires. The same circles repeatedly intersect with Epstein-linked power networks.
      </p>

      {isWealthChartsModalEnabled && (
        <MoneyScaleDrawer
          open={isScaleOpen}
          onOpenChange={setIsScaleOpen}
          selectedPreset={selectedPreset}
          targetWealthBillions={targetWealth}
          targetLabel={targetLabel}
        />
      )}
    </div>
  )
}

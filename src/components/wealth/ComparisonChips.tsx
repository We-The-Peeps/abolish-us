import { Button } from '@/components/ui/button'
import {
  comparisonPresets,
  formatDollars,
  type ComparisonPreset,
} from '@/data/billionaires'

interface ComparisonChipsProps {
  selected: ComparisonPreset | null
  onSelect: (preset: ComparisonPreset | null) => void
}

export default function ComparisonChips({
  selected,
  onSelect,
}: ComparisonChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {comparisonPresets.map((preset) => {
        const isActive = selected?.key === preset.key
        return (
          <Button
            key={preset.key}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="font-sans text-xs"
            onClick={() => onSelect(isActive ? null : preset)}
          >
            {preset.label} ({formatDollars(preset.amount)})
          </Button>
        )
      })}
    </div>
  )
}

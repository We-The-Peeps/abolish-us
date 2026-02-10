import { formatDollars } from '@/data/billionaires'

interface BillionaireBlockProps {
  name: string
  netWorthBillions: number
  widthPercent: number
  isTopRow: boolean
  isBottomRow: boolean
  isFirstInRow: boolean
  isLastInRow: boolean
  isSelected: boolean
  onClick: () => void
}

export default function BillionaireBlock({
  name,
  netWorthBillions,
  widthPercent,
  isTopRow,
  isBottomRow,
  isFirstInRow,
  isLastInRow,
  isSelected,
  onClick,
}: BillionaireBlockProps) {
  const dollars = netWorthBillions * 1_000_000_000
  const radiusClasses = [
    isTopRow && isFirstInRow ? 'rounded-tl-xl' : '',
    isTopRow && isLastInRow ? 'rounded-tr-xl' : '',
    isBottomRow && isFirstInRow ? 'rounded-bl-xl' : '',
    isBottomRow && isLastInRow ? 'rounded-br-xl' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type="button"
      className={`relative border border-border/60 flex items-end p-2 overflow-hidden transition-colors text-left cursor-pointer ${radiusClasses} ${
        isSelected
          ? 'bg-primary/10 ring-2 ring-primary ring-inset'
          : 'hover:bg-secondary/50'
      }`}
      style={{ width: `${widthPercent}%`, height: '100%' }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-secondary/30" />
      <div className="relative z-10">
        <div className="text-[10px] md:text-xs font-bold font-sans leading-tight truncate">
          {name}
        </div>
        <div className="text-[9px] md:text-[10px] text-muted-foreground font-sans">
          {formatDollars(dollars)}
        </div>
      </div>
    </button>
  )
}

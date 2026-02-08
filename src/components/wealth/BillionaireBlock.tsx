import { formatDollars } from '@/data/billionaires'

interface BillionaireBlockProps {
  name: string
  netWorthBillions: number
  widthPercent: number
  isFirst: boolean
  isSelected: boolean
  onClick: () => void
}

export default function BillionaireBlock({
  name,
  netWorthBillions,
  widthPercent,
  isFirst,
  isSelected,
  onClick,
}: BillionaireBlockProps) {
  const dollars = netWorthBillions * 1_000_000_000
  return (
    <button
      type="button"
      className={`relative border border-border/60 flex items-end p-2 overflow-hidden transition-colors text-left cursor-pointer ${
        isSelected
          ? 'bg-primary/10 ring-2 ring-primary ring-inset'
          : 'hover:bg-secondary/50'
      }`}
      style={{ width: `${widthPercent}%`, minHeight: isFirst ? 180 : 120 }}
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

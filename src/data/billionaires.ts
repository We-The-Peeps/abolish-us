export interface Billionaire {
  name: string
  netWorthBillions: number
  source: string
}

export interface ComparisonPreset {
  key: string
  label: string
  amount: number
  rangeMin?: number
  rangeMax?: number
  kind?: 'income' | 'expense' | 'wealth'
}

export interface WealthMark {
  id: string
  label: string
  amount: number
  source?: string
  kind: 'billionaire' | 'combined'
}

/** Forbes Real-Time Billionaires List, Feb 2026 */
export const billionaires: Billionaire[] = [
  { name: 'Elon Musk', netWorthBillions: 775, source: 'Tesla, SpaceX, xAI' },
  { name: 'Larry Page', netWorthBillions: 277, source: 'Alphabet / Google' },
  { name: 'Sergey Brin', netWorthBillions: 255, source: 'Alphabet / Google' },
  { name: 'Larry Ellison', netWorthBillions: 245, source: 'Oracle' },
  {
    name: 'Mark Zuckerberg',
    netWorthBillions: 223,
    source: 'Meta / Facebook',
  },
  { name: 'Jeff Bezos', netWorthBillions: 220, source: 'Amazon' },
  { name: 'Michael Dell', netWorthBillions: 155, source: 'Dell Technologies' },
  { name: 'Steve Ballmer', netWorthBillions: 147, source: 'Microsoft' },
  { name: 'Bernard Arnault', netWorthBillions: 145, source: 'LVMH' },
  { name: 'Amancio Ortega', netWorthBillions: 140, source: 'Zara / Inditex' },
]

/**
 * Bar width equals the dollar amount; bars are laid out sequentially
 * by getSpreadRanges() so rangeMin/rangeMax are not needed here.
 */
export const comparisonPresets: ComparisonPreset[] = [
  { key: 'us-minimum-wage-annual', label: 'US Minimum Wage (annual)', amount: 15_080, kind: 'income' },
  { key: 'average-new-car', label: 'Average New Car', amount: 48_000, kind: 'expense' },
  { key: 'average-us-salary', label: 'Average US Salary', amount: 60_000, kind: 'income' },
  { key: 'average-four-year-tuition', label: 'Average 4-Year Tuition', amount: 104_108, kind: 'expense' },
  { key: 'median-us-net-worth', label: 'Median US Net Worth', amount: 193_000, kind: 'wealth' },
  { key: 'median-us-home', label: 'Median US Home', amount: 420_000, kind: 'wealth' },
]

export const totalTopTenWealth = billionaires.reduce(
  (sum, b) => sum + b.netWorthBillions,
  0,
)

export function dollarsFromBillions(amountInBillions: number): number {
  return amountInBillions * 1_000_000_000
}

export function getBillionaireWealthMarks(): WealthMark[] {
  return billionaires.map((b) => ({
    id: b.name.toLowerCase().replace(/\s+/g, '-'),
    label: b.name,
    amount: dollarsFromBillions(b.netWorthBillions),
    source: b.source,
    kind: 'billionaire',
  }))
}

export function getTopTenCombinedMark(): WealthMark {
  return {
    id: 'top-10-combined',
    label: 'Top 10 Combined',
    amount: dollarsFromBillions(totalTopTenWealth),
    kind: 'combined',
  }
}

export const formatDollars = (amount: number): string => {
  if (amount >= 1_000_000_000_000)
    return `$${(amount / 1_000_000_000_000).toFixed(1)}T`
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(0)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

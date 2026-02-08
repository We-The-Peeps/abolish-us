export interface Billionaire {
  name: string
  netWorthBillions: number
  source: string
}

export interface ComparisonPreset {
  label: string
  amount: number
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

export const comparisonPresets: ComparisonPreset[] = [
  { label: 'US Minimum Wage (annual)', amount: 15_080 },
  { label: 'Average US Salary', amount: 60_000 },
  { label: 'Average New Car', amount: 48_000 },
  { label: 'Average 4-Year Tuition', amount: 104_108 },
  { label: 'Median US Net Worth', amount: 193_000 },
  { label: 'Median US Home', amount: 420_000 },
]

export const totalTopTenWealth = billionaires.reduce(
  (sum, b) => sum + b.netWorthBillions,
  0,
)

export const formatDollars = (amount: number): string => {
  if (amount >= 1_000_000_000_000)
    return `$${(amount / 1_000_000_000_000).toFixed(1)}T`
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(0)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

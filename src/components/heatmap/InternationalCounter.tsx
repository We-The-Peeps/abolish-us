import { Globe } from 'lucide-react'

interface InternationalCounterProps {
  count: number
}

export default function InternationalCounter({
  count,
}: InternationalCounterProps) {
  return (
    <span className="flex items-center gap-1.5">
      <Globe className="size-3" />
      {count} international
    </span>
  )
}

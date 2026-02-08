import PresenceMap from '@/components/heatmap/PresenceMap'
import InternationalCounter from '@/components/heatmap/InternationalCounter'

interface HeatmapSectionProps {
  domesticPresence: Array<{ lat: number; lng: number }>
  internationalCount: number
  totalCount: number
}

export default function HeatmapSection({
  domesticPresence,
  internationalCount,
  totalCount,
}: HeatmapSectionProps) {
  return (
    <div className="my-16 w-full max-w-[800px] relative">
      <div className="aspect-video w-full rounded-3xl shadow-2xl overflow-hidden relative">
        <PresenceMap points={domesticPresence} />
        <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10" />
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
      </div>
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {'Live Institutional Failure Intensity Map // REF: US-G-2024'}
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {totalCount} watching now
            </span>
            {internationalCount > 0 && (
              <InternationalCounter count={internationalCount} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

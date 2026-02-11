interface CaseFileCardProps {
  src: string
  name: string
  caseId: string
  position: string
}

export default function CaseFileCard({
  src,
  name,
  caseId,
  position,
}: CaseFileCardProps) {
  return (
    <div className="group border border-foreground/15 bg-card overflow-hidden text-left transition-colors hover:border-foreground/30">
      {/* Case ID header bar */}
      <div className="border-b border-foreground/10 px-3 py-1.5 bg-foreground/2">
        <span
          title={caseId}
          className="block w-full truncate font-mono text-[10px] tracking-[0.15em] text-muted-foreground/70 uppercase select-none"
        >
          {caseId}
        </span>
      </div>

      {/* Subject photo */}
      <div className="relative aspect-square overflow-hidden bg-foreground/3">
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover object-center grayscale contrast-[1.15] brightness-[0.9]"
          loading="lazy"
          draggable={false}
        />
      </div>

      {/* Subject identification */}
      <div className="border-t border-foreground/10 px-3 py-2">
        <div
          title={name}
          className="font-mono text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground leading-tight truncate"
        >
          {name}
        </div>
        <div
          title={position}
          className="font-mono text-[8px] md:text-[9px] text-muted-foreground/50 uppercase tracking-[0.12em] mt-0.5 truncate"
        >
          {position}
        </div>
      </div>
    </div>
  )
}

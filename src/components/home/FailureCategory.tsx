import CitationLink from './CitationLink'
import type { FailureRecord } from '@/data/failure-records'

interface FailureCategoryProps {
  record: FailureRecord
}

export default function FailureCategory({ record }: FailureCategoryProps) {
  return (
    <div className="flex flex-col border-b border-border py-12 lg:flex-row lg:items-start lg:gap-12">
      <div className="w-full lg:w-1/3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          REF: {record.ref}
        </h3>
        <h2 className="mt-2 text-2xl font-bold">{record.title}</h2>
        {record.description && (
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-[200px]">
            {record.description}
          </p>
        )}
        {record.hasAgencyChart && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-end gap-1">
              <div className="w-1 bg-muted-foreground/30 h-2" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase">
                1789: 3 Agencies
              </span>
            </div>
            <div className="flex items-end gap-1">
              <div className="w-1 bg-foreground h-12" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase">
                2024: 430+ Agencies
              </span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground italic">
              Source: United States Government Manual / NARA
            </p>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-4 text-sm lg:mt-0">
        {record.citations.map((citation) => (
          <CitationLink
            key={citation.text}
            icon={citation.icon}
            text={citation.text}
            href={citation.href}
          />
        ))}
      </div>
    </div>
  )
}

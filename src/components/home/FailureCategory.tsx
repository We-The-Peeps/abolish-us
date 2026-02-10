import type { FailureRecord } from '@/data/failure-records'
import CitationLink from './CitationLink'

interface FailureCategoryProps {
  record: FailureRecord
}

export default function FailureCategory({ record }: FailureCategoryProps) {
  return (
    <div className="flex flex-col border-b border-border py-12 lg:flex-row lg:items-start lg:gap-12">
      <div className="w-full lg:w-2/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {record.ref}
        </h3>
        <h2 className="mt-2 text-2xl font-bold">{record.title}</h2>
        {record.description && (
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-2/3 lg:max-w-96">
            {record.description}
          </p>
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

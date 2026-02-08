import { useId } from 'react'
import { ExternalLink } from 'lucide-react'
import FailureCategory from './FailureCategory'
import { failureRecords } from '@/data/failure-records'

export default function FailureIndex() {
  const sectionId = useId()
  return (
    <section id={sectionId} className="w-full max-w-[960px] px-4 pb-32">
      <div className="mb-16 flex flex-col items-start px-4">
        <h2 className="text-3xl font-black tracking-tight uppercase">
          The Record
        </h2>
        <div className="h-1 w-16 bg-foreground mt-4" />
      </div>

      {/* Congressional Oversight */}
      <div className="border-b border-border py-12 lg:flex lg:items-start lg:gap-12">
        <div className="w-full lg:w-1/3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Who Watches the Watchers?
          </h3>
          <h2 className="mt-2 text-2xl font-bold">Congressional Oversight</h2>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-[240px]">
            Congress has created, renamed, merged, and dissolved hundreds of
            oversight committees throughout its history. The full record of
            every committee name change is maintained by the Library of
            Congress.
          </p>
        </div>
        <div className="mt-6 flex flex-1 flex-col gap-4 text-sm lg:mt-0">
          <a
            className="flex items-center gap-3 font-medium transition-colors hover:underline hover:text-primary"
            href="https://www.congress.gov/help/committee-name-history"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4 shrink-0" />
            Congress.gov: Complete Committee Name History (House, Senate, and
            Joint)
          </a>
        </div>
      </div>

      {/* US Law */}
      <div className="flex flex-col gap-0">
        {failureRecords.map((record) => (
          <FailureCategory key={record.ref} record={record} />
        ))}
      </div>
    </section>
  )
}

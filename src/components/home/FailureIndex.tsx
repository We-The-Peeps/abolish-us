import { ExternalLink } from 'lucide-react'
import { useId } from 'react'
import { failureRecords } from '@/data/failure-records'
import FailureCategory from './FailureCategory'

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

      {/* US Law */}
      <div className="flex flex-col gap-0">
        {failureRecords.map((record) => (
          <FailureCategory key={record.ref} record={record} />
        ))}
      </div>
    </section>
  )
}

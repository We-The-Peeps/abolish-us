import FailureCategory from './FailureCategory'
import { failureRecords } from '@/data/failure-records'

export default function FailureIndex() {
  return (
    <section id="failure-index" className="w-full max-w-[960px] px-4 pb-32">
      <div className="mb-16 flex flex-col items-start px-4">
        <h2 className="text-3xl font-black tracking-tight uppercase">
          Index of Systemic Failure
        </h2>
        <div className="h-1 w-16 bg-foreground mt-4" />
      </div>
      <div className="flex flex-col gap-0">
        {failureRecords.map((record) => (
          <FailureCategory key={record.ref} record={record} />
        ))}
      </div>
    </section>
  )
}

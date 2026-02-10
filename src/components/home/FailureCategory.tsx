import { motion } from 'motion/react'
import type { FailureRecord } from '@/data/failure-records'
import { fadeUp, slideInLeft, staggerContainer } from '@/lib/motion'
import CitationLink from './CitationLink'

interface FailureCategoryProps {
  record: FailureRecord
}

export default function FailureCategory({ record }: FailureCategoryProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col border-b border-border py-12 lg:flex-row lg:items-start lg:gap-12"
    >
      <div className="w-full lg:w-2/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {record.ref}
        </h3>
        <h2 className="mt-2 text-2xl font-bold">{record.title}</h2>
        {record.description && (
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-prose lg:max-w-96">
            {record.description}
          </p>
        )}
      </div>

      {/* Citations stagger in individually */}
      <motion.div
        variants={staggerContainer(0.07, 0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-6 flex flex-1 flex-col gap-4 text-sm lg:mt-0"
      >
        {record.citations.map((citation) => (
          <motion.div key={citation.text} variants={slideInLeft}>
            <CitationLink
              icon={citation.icon}
              text={citation.text}
              href={citation.href}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

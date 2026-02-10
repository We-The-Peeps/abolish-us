import { motion } from 'motion/react'
import { useId } from 'react'
import { failureRecords } from '@/data/failure-records'
import {
  defaultViewport,
  fadeUp,
  lineReveal,
  staggerContainer,
} from '@/lib/motion'
import FailureCategory from './FailureCategory'

export default function FailureIndex() {
  const sectionId = useId()
  return (
    <section id={sectionId} className="w-full max-w-[960px] px-4 pb-32">
      

      {/* Failure categories — staggered on scroll */}
      <motion.div
        variants={staggerContainer(0.15, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        className="flex flex-col gap-0"
      >
        {failureRecords.map((record) => (
          <FailureCategory key={record.ref} record={record} />
        ))}
      </motion.div>
    </section>
  )
}

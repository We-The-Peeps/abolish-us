import { motion } from 'motion/react'
import { useId } from 'react'
import { failureRecords } from '@/data/failure-records'
import {
  staggerContainer,
  fadeUp,
  lineReveal,
  defaultViewport,
} from '@/lib/motion'
import FailureCategory from './FailureCategory'

export default function FailureIndex() {
  const sectionId = useId()
  return (
    <section id={sectionId} className="w-full max-w-[960px] px-4 pb-32">
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="mb-16 flex flex-col items-start px-4"
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl font-black tracking-tight uppercase"
        >
          The Record
        </motion.h2>
        <motion.div
          variants={lineReveal}
          className="h-1 w-16 bg-foreground mt-4 origin-left"
        />
      </motion.div>

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

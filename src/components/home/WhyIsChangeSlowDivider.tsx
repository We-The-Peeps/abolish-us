import { motion } from 'motion/react'
import { defaultViewport, fadeIn, lineReveal, staggerContainer } from '@/lib/motion'

export default function WhyIsChangeSlowDivider() {
  return (
    <motion.section
      variants={staggerContainer(0.15, 0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="w-full max-w-[760px] px-4 pt-2 pb-8"
    >
      <div className="flex items-center gap-4">
        <motion.div variants={lineReveal} className="h-px flex-1 bg-foreground/10 origin-right" />
        <motion.span variants={fadeIn} className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/60 select-none uppercase">
          why is change slow
        </motion.span>
        <motion.div variants={lineReveal} className="h-px flex-1 bg-foreground/10 origin-left" />
      </div>
    </motion.section>
  )
}

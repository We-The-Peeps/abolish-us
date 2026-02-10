import { motion } from 'motion/react'
import { fadeUp, defaultViewport } from '@/lib/motion'

export default function IntroSection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="flex w-full max-w-[720px] flex-col items-center border-y border-border px-4 pt-10 pb-10 text-center"
    >
      <p className="text-xl leading-relaxed text-muted-foreground">
        This wasn&apos;t a scandal. It was a system. Power didn&apos;t fail
        &mdash; it worked exactly as designed.
      </p>
    </motion.section>
  )
}

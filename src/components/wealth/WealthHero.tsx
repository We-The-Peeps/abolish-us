import { motion } from 'motion/react'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'

export default function WealthHero() {
  return (
    <motion.div
      variants={staggerContainer(0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="w-full max-w-[720px] text-center mb-12"
    >
      <motion.h2
        variants={fadeUp}
        className="text-3xl font-black leading-snug tracking-[-0.02em] md:text-5xl"
      >
        The richest ten people own more than the bottom half of America
        combined.
      </motion.h2>
      <motion.p
        variants={fadeUp}
        className="mt-6 text-base text-muted-foreground md:text-lg"
      >
        Click a salary. Click a billionaire. See for yourself.
      </motion.p>
    </motion.div>
  )
}

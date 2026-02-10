import { motion } from 'motion/react'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'

export default function IceHero() {
  return (
    <motion.div
      variants={staggerContainer(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="w-full max-w-[760px] text-center"
    >
      <motion.h2
        variants={fadeUp}
        className="mt-3 text-3xl font-black leading-tight tracking-[-0.02em] md:text-5xl"
      >
        While the <span className="text-destructive">guilty</span> stay<br />rich and free,<br />
        <span className="font-black uppercase tracking-[-0.04em] text-destructive text-5xl md:text-7xl">ICE</span><br />
        hunts the innocent.
      </motion.h2>
      <motion.p
        variants={fadeUp}
        className="mt-6 text-base text-muted-foreground md:text-lg"
      >
        Families are terrorized, communities are shattered, and the same power structure that
        shields predators bankrolls the violence.
      </motion.p>
    </motion.div>
  )
}

import { motion } from 'motion/react'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'

export default function TraditionalChangeSection() {
  return (
    <motion.section
      variants={staggerContainer(0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="flex w-full max-w-[760px] flex-col items-center px-4 pt-12 pb-10 text-center"
    >
      <motion.h2
        variants={fadeUp}
        className="text-3xl font-black leading-tight tracking-[-0.02em] md:text-5xl"
      >
        Traditional change is wildly unlikely.
      </motion.h2>
      <motion.p variants={fadeUp} className="mt-6 text-base text-muted-foreground md:text-lg">
        Ultra-elite money bankrolls lobbyists, steers policy, and pressures social platforms to
        censor dissent while amplifying criminalization narratives. Some of the same power circles
        also intersect with Epstein-linked networks. We do not need slow reform theater - we need
        immediate, rapid system change.
      </motion.p>
    </motion.section>
  )
}

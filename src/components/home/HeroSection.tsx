import { motion } from 'motion/react'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'
import Redacted from './Redacted'

export default function HeroSection() {
  return (
    <motion.div
      variants={staggerContainer(0.12, 0.1)}
      initial="hidden"
      animate="visible"
      viewport={defaultViewport}
    >
      <motion.h1
        variants={fadeUp}
        className="text-5xl font-black leading-tight tracking-[-0.02em] md:text-7xl mx-auto"
      >
        The rich <Redacted>protected</Redacted> predators
        <motion.span variants={fadeUp} className="block mt-3">
          <Redacted>These monsters</Redacted> are still in power
        </motion.span>
      </motion.h1>
      <motion.p
        variants={fadeUp}
        className="mt-10 max-w-xl text-lg font-medium tracking-tight text-muted-foreground md:text-xl mx-auto"
      >
        The files are <Redacted>public</Redacted>. The names are <Redacted>known</Redacted>.<br />
        They <Redacted>don&apos;t</Redacted> care about accountability.
      </motion.p>
    </motion.div>
  )
}

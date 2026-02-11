import { motion } from 'motion/react'
import { defaultViewport, fadeUp } from '@/lib/motion'

export default function RebuildShipSection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="flex w-full max-w-[760px] flex-col items-center px-4 pt-6 pb-8 text-center"
    >
      <p className="text-xl leading-relaxed text-muted-foreground">
        When the ship is held together by lies, contempt, and shadowy cabals, it&apos;s time to start
        building a new ship.
      </p>
      <img src="/og-card.svg" alt="Abolish Us logo" className="mt-8 h-auto w-full max-w-[320px]" />
    </motion.section>
  )
}

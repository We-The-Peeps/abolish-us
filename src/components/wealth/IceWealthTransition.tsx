import { motion } from 'motion/react'
import { defaultViewport, fadeUp } from '@/lib/motion'

export default function IceWealthTransition() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="flex w-full max-w-[720px] flex-col items-center border-y border-border px-4 pt-10 pb-10 text-center"
    >
      <p className="text-xl leading-relaxed text-muted-foreground">
        ICE is the weapon. Extreme wealth is the shield.
        <br />
        Nearly every one of the world&apos;s richest people props this up in some form: political
        money, elite networks, and social platform power that amplifies criminalization.
      </p>
    </motion.section>
  )
}

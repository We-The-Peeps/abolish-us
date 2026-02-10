import { motion } from 'motion/react'
import { fadeIn, defaultViewport } from '@/lib/motion'

export default function Copyright() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="w-full py-12 text-center"
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
        &copy; {new Date().getFullYear()} ABOLISH US {'// '}PUBLIC DOMAIN
      </div>
    </motion.div>
  )
}

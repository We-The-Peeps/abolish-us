import { motion } from 'motion/react'
import { useRedactedGroup } from './RedactedGroup'

interface RedactedProps {
  children: React.ReactNode
  order?: number
}

export default function Redacted({ children, order = 0 }: RedactedProps) {
  const { baseDelay, stagger } = useRedactedGroup()

  const delay = baseDelay + order * stagger

  return (
    <motion.span
      className="redacted-motion"
      initial={{ backgroundSize: '0% 100%' }}
      animate={{ backgroundSize: '100% 100%' }}
      transition={{
        delay,
        duration: 0.45,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      {children}
    </motion.span>
  )
}

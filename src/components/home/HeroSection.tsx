import { motion } from 'motion/react'
import { easeOutQuart } from '@/lib/motion'
import Redacted from './Redacted'
import RedactedGroup from './RedactedGroup'

export default function HeroSection() {
  const heroChunkTransition = (order: number) => ({
    delay: 0.1 + order * 0.14,
    duration: 0.56,
    ease: easeOutQuart,
  })

  return (
    <RedactedGroup baseDelay={0.82} stagger={0.28}>
      <div>
        <h1 className="text-5xl font-black leading-tight tracking-[-0.02em] md:text-7xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroChunkTransition(0)}
            className="inline-block"
          >
            Rich
          </motion.span>
          {' '}
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroChunkTransition(1)}
            className="inline-block"
          >
            <Redacted order={0}>elites ran with</Redacted>
          </motion.span>
          {' '}
          <motion.span
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroChunkTransition(2)}
            className="inline-block text-destructive"
          >
            predators
          </motion.span>

          <span className="block mt-3">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={heroChunkTransition(3)}
              className="inline-block"
            >
              <Redacted order={1}>These vile humans</Redacted>
            </motion.span>
            {' '}
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={heroChunkTransition(4)}
              className="inline-block"
            >
              walk
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={heroChunkTransition(5)}
              className="block"
            >
              free
            </motion.span>
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={heroChunkTransition(6)}
          className="mt-10 max-w-xl text-lg font-medium tracking-tight text-muted-foreground md:text-xl mx-auto"
        >
          The files are <Redacted order={2}>public</Redacted>. The names are <Redacted order={3}>known</Redacted>.<br />
          They <Redacted order={4}>don&apos;t</Redacted> care about accountability.
        </motion.p>
      </div>
    </RedactedGroup>
  )
}

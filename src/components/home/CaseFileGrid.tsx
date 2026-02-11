import { useInterval } from 'ahooks'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT, useIsMobile } from '@/hooks/use-mobile'
import { fadeIn, lineReveal, staggerContainer } from '@/lib/motion'
import CaseFileCard from './CaseFileCard'

interface SubjectMeta {
  name: string
  position: string
  caseId: string
}

interface CaseSubject extends SubjectMeta {
  src: string
}

/** Metadata keyed by filename prefix (the part before `-N`) */
const subjectMeta: Record<string, SubjectMeta> = {
  clinton: {
    name: 'Clinton, William J.',
    position: 'Former U.S. President',
    caseId: 'DOJ-EF-0012',
  },
  trump: {
    name: 'Trump, Donald J.',
    position: 'U.S. President',
    caseId: 'DOJ-EF-0027',
  },
  andrew: {
    name: 'Windsor, Andrew A.',
    position: 'Duke of York',
    caseId: 'DOJ-EF-0031',
  },
  branson: {
    name: 'Branson, Richard C.',
    position: 'Chairman, Virgin Group',
    caseId: 'DOJ-EF-0044',
  },
  woody: {
    name: 'Allen, Heywood A.',
    position: 'Film Director',
    caseId: 'DOJ-EF-0058',
  },
  bannon: {
    name: 'Bannon, Stephen K.',
    position: 'Fmr. White House Strategist',
    caseId: 'DOJ-EF-0063',
  },
  michael: {
    name: 'Jackson, Michael J.',
    position: 'Entertainer',
    caseId: 'DOJ-EF-0071',
  },
  redacted: {
    name: '[REDACTED]',
    position: '[REDACTED]',
    caseId: 'DOJ-EF-0089',
  },
  chomsky: {
    name: 'Chomsky, Noam A.',
    position: 'Public Intellectual',
    caseId: 'DOJ-EF-0090',
  },
  cronkite: {
    name: 'Cronkite, Walter L.',
    position: 'Broadcast Journalist',
    caseId: 'DOJ-EF-0091',
  },
  dershowitz: {
    name: 'Dershowitz, Alan M.',
    position: 'Attorney',
    caseId: 'DOJ-EF-0092',
  },
  maxwell: {
    name: 'Maxwell, Ghislaine C.',
    position: 'Socialite',
    caseId: 'DOJ-EF-0093',
  },
  gates: {
    name: 'Gates, Bill H.',
    position: 'Chair, Gates Foundation',
    caseId: 'DOJ-EF-0094',
  },
  jagger: {
    name: 'Jagger, Mick',
    position: 'Musician',
    caseId: 'DOJ-EF-0095',
  },
  brunel: {
    name: 'Brunel, Jean-Luc',
    position: 'Modeling Agent',
    caseId: 'DOJ-EF-0096',
  },
  brin: {
    name: 'Brin, Sergey M.',
    position: 'Google Co-Founder',
    caseId: 'DOJ-EF-0097',
  },
  tucker: {
    name: 'Carlson, Tucker S.',
    position: 'Media Personality',
    caseId: 'DOJ-EF-0098',
  },
}

/**
 * Discover all POI images at build time.
 * eager + ?url tells Vite to resolve each file to its served URL.
 * Keys are on-disk paths; values are the public URLs.
 */
const poiGlob = import.meta.glob<string>('/public/poi/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** Build subjects from discovered files + metadata lookup */
const allSubjects: CaseSubject[] = Object.entries(poiGlob).map(
  ([path, url]) => {
    const filename = path.split('/').pop()?.replace(/\.\w+$/, '') ?? ''
    const key = filename.replace(/-\d+$/, '')
    const meta = subjectMeta[key]
    return {
      src: url,
      name: meta?.name ?? '[UNKNOWN]',
      position: meta?.position ?? '[UNKNOWN]',
      caseId: `${meta?.caseId ?? 'DOJ-EF-UNKN'}-${filename}`,
    }
  },
)

const pickRandom = (count: number): number[] => {
  const indices = allSubjects.map((_, i) => i)
  const result: number[] = []
  while (result.length < count && indices.length > 0) {
    const pick = Math.floor(Math.random() * indices.length)
    result.push(indices[pick])
    indices.splice(pick, 1)
  }
  return result
}

export default function CaseFileGrid() {
  const isMobile = useIsMobile()
  const isMobileOnMount =
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  const useMobileLayout = isMobile || isMobileOnMount
  const slotCount = useMobileLayout ? 4 : 8
  const intervalMs = useMobileLayout ? 3000 : 5000

  const [selection, setSelection] = useState<number[]>(() =>
    pickRandom(slotCount),
  )

  useEffect(() => {
    setSelection((currentSelection) =>
      currentSelection.length === slotCount
        ? currentSelection
        : pickRandom(slotCount),
    )
  }, [slotCount])

  const cycle = useCallback(() => {
    setSelection(pickRandom(slotCount))
  }, [slotCount])

  useInterval(cycle, intervalMs)

  return (
    <div className="mt-16 mb-8 w-full">
      {/* Section header */}
      <motion.div
        variants={staggerContainer(0.15, 0.3)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.div variants={lineReveal} className="h-px flex-1 bg-foreground/10 origin-right" />
        <motion.span
          variants={fadeIn}
          className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/60 uppercase select-none"
        >
          Persons of Interest
        </motion.span>
        <motion.div variants={lineReveal} className="h-px flex-1 bg-foreground/10 origin-left" />
      </motion.div>

      {/* Case file grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {selection.map((imgIdx, slotIdx) => {
            const subject = allSubjects[imgIdx]
            return (
              <motion.div
                key={`${slotIdx}-${subject.src}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.4,
                  delay: slotIdx * 0.06,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <CaseFileCard {...subject} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

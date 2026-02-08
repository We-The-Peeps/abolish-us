import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useInterval } from 'ahooks'
import { useIsMobile } from '@/hooks/use-mobile'

interface CloudSlot {
  rotate: number
  x: number
  y: number
  scale: number
  delay: number
  desktopOnly?: boolean
}

const allImages = [
  { src: '/img/clinton-1.webp', alt: 'Bill Clinton' },
  { src: '/img/trump-1.webp', alt: 'Donald Trump' },
  { src: '/img/andrew-1.webp', alt: 'Prince Andrew' },
  { src: '/img/branson-1.webp', alt: 'Richard Branson' },
  { src: '/img/branson-2.png', alt: 'Richard Branson at event' },
  { src: '/img/woody-1.webp', alt: 'Woody Allen' },
  { src: '/img/bannon-1.webp', alt: 'Steve Bannon' },
  { src: '/img/michael-1.png', alt: 'Michael Jackson' },
  { src: '/img/clinton-2.png', alt: 'Bill Clinton at gathering' },
  { src: '/img/clinton-3.png', alt: 'Bill Clinton portrait' },
  { src: '/img/random-1.jpg', alt: 'Associated figure' },
]

const slots: CloudSlot[] = [
  { rotate: -1.5, x: 0, y: 0, scale: 1.05, delay: 0 },
  { rotate: -6, x: -55, y: -42, scale: 0.82, delay: 0.12 },
  { rotate: 4.5, x: 52, y: -38, scale: 0.78, delay: 0.08 },
  { rotate: -3.5, x: 50, y: 44, scale: 0.8, delay: 0.15 },
  { rotate: 5, x: -48, y: 40, scale: 0.75, delay: 0.18, desktopOnly: true },
  { rotate: -8, x: -72, y: 5, scale: 0.7, delay: 0.22, desktopOnly: true },
  { rotate: 7, x: 70, y: 2, scale: 0.72, delay: 0.25, desktopOnly: true },
]

const pickRandom = (count: number): number[] => {
  const indices = allImages.map((_, i) => i)
  const result: number[] = []
  while (result.length < count && indices.length > 0) {
    const pick = Math.floor(Math.random() * indices.length)
    result.push(indices[pick])
    indices.splice(pick, 1)
  }
  return result
}

export default function ImageCloud() {
  const isMobile = useIsMobile()
  const slotCount = isMobile ? 4 : 7
  const [selection, setSelection] = useState<number[]>(() =>
    pickRandom(slotCount),
  )

  const cycle = useCallback(() => {
    setSelection(pickRandom(slotCount))
  }, [slotCount])

  useInterval(cycle, 6000)

  const activeSlots = useMemo(
    () =>
      slots.filter((s) => {
        if (isMobile && s.desktopOnly) return false
        return true
      }),
    [isMobile],
  )

  const cloudScale = isMobile ? 0.65 : 1

  return (
    <div className="relative mt-16 mb-8 w-full max-w-[700px] aspect-4/3 md:aspect-16/10">
      <AnimatePresence mode="popLayout">
        {activeSlots.map((slot, slotIdx) => {
          const imgIdx = selection[slotIdx] ?? 0
          const img = allImages[imgIdx]
          return (
            <motion.div
              key={`${slotIdx}-${img.src}`}
              className="absolute left-1/2 top-1/2 w-[48%] md:w-[40%]"
              initial={{
                opacity: 0,
                scale: 0.8 * slot.scale * cloudScale,
                rotate: slot.rotate * 0.5,
                x: `calc(-50% + ${slot.x * cloudScale * 2.5}px)`,
                y: `calc(-50% + ${slot.y * cloudScale * 2.5}px)`,
              }}
              animate={{
                opacity: 1,
                scale: slot.scale * cloudScale,
                rotate: slot.rotate,
                x: `calc(-50% + ${slot.x * cloudScale * 2.5}px)`,
                y: `calc(-50% + ${slot.y * cloudScale * 2.5}px)`,
              }}
              exit={{
                opacity: 0,
                scale: 0.85 * slot.scale * cloudScale,
              }}
              transition={{
                duration: 1.2,
                delay: slot.delay * 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{ zIndex: Math.round(slot.scale * 10) }}
            >
              <FloatingImage
                src={img.src}
                alt={img.alt}
                delay={slot.delay}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function FloatingImage({
  src,
  alt,
  delay,
}: {
  src: string
  alt: string
  delay: number
}) {
  return (
    <motion.div
      animate={{
        y: [0, -6, 0, 4, 0],
        rotate: [0, 0.5, 0, -0.4, 0],
      }}
      transition={{
        duration: 8 + delay * 10,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut',
      }}
      className="rounded-lg overflow-hidden shadow-xl ring-1 ring-black/10"
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto grayscale opacity-90 block"
        loading="lazy"
        draggable={false}
      />
    </motion.div>
  )
}

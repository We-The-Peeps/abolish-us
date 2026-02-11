import { motion } from 'motion/react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { defaultViewport, fadeUp, staggerContainer } from '@/lib/motion'

interface IceDetail {
  title: string
  copy: string
}

const iceDetails: IceDetail[] = [
  {
    title: 'Family separation is enforcement by trauma',
    copy: 'Raids rip people from homes, schools, and workplaces while loved ones are left searching for basic information.',
  },
  {
    title: 'Detention is a business model',
    copy: 'Public dollars are routed into contracts, cages, and transport pipelines that expand only when more people are captured.',
  },
  {
    title: 'Fear is the point',
    copy: 'Sweeps and checkpoints are staged to terrorize entire neighborhoods into silence, precarity, and compliance.',
  },
]

interface IceGraphic {
  src: string
  alt: string
}

const iceGraphics: IceGraphic[] = [
  {
    src: '/ice/good.jpg',
    alt: 'Renee Good shown in ICE-related context',
  },
  {
    src: '/ice/pretti.jpg',
    alt: 'Alex Pretti shown in ICE-related context',
  },
  {
    src: '/ice/ice-detention-1.avif',
    alt: 'Detainees and officers at an ICE detention facility',
  },
  {
    src: '/ice/ice-protest.webp',
    alt: 'Protesters confronting ICE enforcement actions',
  },
]

export default function IceDetailSection() {
  return (
    <motion.section
      variants={staggerContainer(0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="w-full max-w-[960px] px-4 pt-10 pb-4"
    >
      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          What ICE Enforces
        </p>
        <div className="h-px flex-1 bg-border" />
      </motion.div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        {iceGraphics.map((graphic) => (
          <motion.figure
            key={graphic.src}
            variants={fadeUp}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <AspectRatio ratio={16 / 9}>
              <img
                src={graphic.src}
                alt={graphic.alt}
                className="h-full w-full object-cover grayscale"
                loading="lazy"
              />
            </AspectRatio>
          </motion.figure>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {iceDetails.map((detail) => (
          <motion.article
            key={detail.title}
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h3 className="text-lg font-bold leading-tight">{detail.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detail.copy}</p>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

import type { Variants } from 'motion/react'

/**
 * Shared motion easing curves
 */
export const easeOutQuart = [0.25, 1, 0.5, 1] as const
export const easeOutCubic = [0.33, 1, 0.68, 1] as const

/**
 * Stagger container — orchestrates children with a configurable delay.
 * Use `whileInView="visible"` + `viewport={{ once: true }}` on the parent.
 */
export const staggerContainer = (
  staggerChildren = 0.08,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

/**
 * Fade up — standard child variant for stagger containers.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOutQuart },
  },
}

/**
 * Fade in — no vertical movement, just opacity.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.7, ease: easeOutCubic },
  },
}

/**
 * Slide in from left — for horizontal reveals.
 */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOutQuart },
  },
}

/**
 * Scale fade — subtle scale + opacity entrance.
 */
export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeOutCubic },
  },
}

/**
 * Line reveal — for decorative horizontal rules / dividers.
 */
export const lineReveal: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: easeOutQuart },
  },
}

/**
 * Default viewport settings for scroll-triggered animations.
 */
export const defaultViewport = { once: true, amount: 0.2 } as const

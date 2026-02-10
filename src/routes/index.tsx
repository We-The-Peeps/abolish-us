import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import CaseFileGrid from '@/components/home/CaseFileGrid'
import Copyright from '@/components/home/Copyright'
import FailureIndex from '@/components/home/FailureIndex'
import HeroSection from '@/components/home/HeroSection'
import IntroSection from '@/components/home/IntroSection'
import { scaleFade, defaultViewport } from '@/lib/motion'
import WealthHero from '@/components/wealth/WealthHero'
import WealthMosaic from '@/components/wealth/WealthMosaic'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex flex-1 flex-col items-center">
        {/* Hero + Case Files */}
        <section className="flex w-full max-w-[960px] flex-col items-center justify-center px-4 pt-32 pb-8 text-center lg:px-0">
          <HeroSection />
          <CaseFileGrid />
        </section>

        {/* Intro */}
        <IntroSection />

        {/* Wealth Visualization */}
        <section className="flex w-full flex-col items-center px-4 pt-10 pb-24">
          <WealthHero />
          <motion.div
            variants={scaleFade}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="w-full flex flex-col items-center"
          >
            <WealthMosaic />
          </motion.div>
        </section>

        {/* Reference Index */}
        <FailureIndex />

        <Copyright />
      </main>
    </div>
  )
}

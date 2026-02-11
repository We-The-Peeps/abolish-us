import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import CaseFileGrid from '@/components/home/CaseFileGrid'
import Copyright from '@/components/home/Copyright'
import FailureIndex from '@/components/home/FailureIndex'
import HeroSection from '@/components/home/HeroSection'
import IceToChangeTransition from '@/components/home/IceToChangeTransition'
import IntroSection from '@/components/home/IntroSection'
import RebuildShipSection from '@/components/home/RebuildShipSection'
import TraditionalChangeSection from '@/components/home/TraditionalChangeSection'
import WhyIsChangeSlowDivider from '@/components/home/WhyIsChangeSlowDivider'
import IceDetailSection from '@/components/wealth/IceDetailSection'
import IceHero from '@/components/wealth/IceHero'
import IceWealthTransition from '@/components/wealth/IceWealthTransition'
import WealthHero from '@/components/wealth/WealthHero'
import WealthMosaic from '@/components/wealth/WealthMosaic'
import { env } from '@/env'
import { defaultViewport, scaleFade } from '@/lib/motion'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const isWealthFeatureEnabled = env.VITE_FEATURE_WEALTH_CHARTS_MODAL

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

        {/* ICE Section */}
        <section className="flex w-full flex-col items-center px-4 pt-10 pb-12">
          <IceHero />
          <IceDetailSection />
        </section>

        {isWealthFeatureEnabled && (
          <>
            <IceWealthTransition />

            {/* Wealth Visualization */}
            <section className="flex w-full flex-col items-center px-4 pt-4 pb-24">
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
          </>
        )}

        <IceToChangeTransition />
        <TraditionalChangeSection />
        <WhyIsChangeSlowDivider />

        {/* Reference Index */}
        <FailureIndex />
        <RebuildShipSection />

        <Copyright />
      </main>
    </div>
  )
}

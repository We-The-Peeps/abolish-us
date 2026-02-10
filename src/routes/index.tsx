import { createFileRoute } from '@tanstack/react-router'
import HeroSection from '@/components/home/HeroSection'
import CaseFileGrid from '@/components/home/CaseFileGrid'
import IntroSection from '@/components/home/IntroSection'
import WealthHero from '@/components/wealth/WealthHero'
import WealthMosaic from '@/components/wealth/WealthMosaic'
import FailureIndex from '@/components/home/FailureIndex'
import Copyright from '@/components/home/Copyright'

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
          <WealthMosaic />
        </section>

        {/* Reference Index */}
        <FailureIndex />

        <Copyright />
      </main>
    </div>
  )
}

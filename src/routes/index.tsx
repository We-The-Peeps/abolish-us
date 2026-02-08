import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import HeroSection from '@/components/home/HeroSection'
import HeatmapSection from '@/components/home/HeatmapSection'
import IntroSection from '@/components/home/IntroSection'
import FailureIndex from '@/components/home/FailureIndex'
import Copyright from '@/components/home/Copyright'
import { usePresence } from '@/hooks/usePresence'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const { domesticPresence, internationalCount, totalCount } = usePresence()

  const scrollToRecords = () => {
    document
      .getElementById('failure-index')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <main className="flex flex-1 flex-col items-center">
        <section className="flex w-full max-w-[960px] flex-col items-center justify-center px-4 py-32 text-center lg:px-0">
          <HeroSection />
          <HeatmapSection
            domesticPresence={domesticPresence}
            internationalCount={internationalCount}
            totalCount={totalCount}
          />
          <Button
            size="lg"
            className="mt-4 h-auto min-w-[200px] rounded-full px-10 py-5 text-base font-bold shadow-lg"
            onClick={scrollToRecords}
          >
            Abolish Us
          </Button>
        </section>
        <IntroSection />
        <FailureIndex />
        <Copyright />
      </main>
    </div>
  )
}

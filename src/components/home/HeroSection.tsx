import Redacted from './Redacted'

export default function HeroSection() {
  return (
    <>
      <h1 className="text-5xl font-black leading-tight tracking-[-0.02em] md:text-7xl">
        They <Redacted>protected</Redacted> a child trafficker.
        <span className="block mt-3">
          And they&apos;re still <Redacted>in power</Redacted>.
        </span>
      </h1>
      <p className="mt-10 max-w-xl text-lg font-medium tracking-tight text-muted-foreground md:text-xl font-serif">
        The files are public. The names are{' '}
        <Redacted>known</Redacted>. Accountability isn&apos;t.
      </p>
    </>
  )
}

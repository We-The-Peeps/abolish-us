import Redacted from './Redacted'

export default function HeroSection() {
  return (
    <>
      <h1 className="text-5xl font-black leading-tight tracking-[-0.02em] md:text-7xl">
        The rich <Redacted>protected</Redacted> predators
        <span className="block mt-3">
        <Redacted>These monsters</Redacted> are still in power
        </span>
      </h1>
      <p className="mt-10 max-w-xl text-lg font-medium tracking-tight text-muted-foreground md:text-xl font-serif">
        The files are <Redacted>public</Redacted>. The names are <Redacted>known</Redacted>.<br />
        They <Redacted>don&apos;t</Redacted> care about accountability.
      </p>
    </>
  )
}

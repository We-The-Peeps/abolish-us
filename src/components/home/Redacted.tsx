interface RedactedProps {
  children: React.ReactNode
}

export default function Redacted({ children }: RedactedProps) {
  return <span className="redacted">{children}</span>
}

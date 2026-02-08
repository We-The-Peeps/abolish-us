import {
  Landmark,
  ScrollText,
  FileText,
  Gavel,
  BarChart3,
  Stethoscope,
  FlaskConical,
  Archive,
  ClipboardList,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  'scroll-text': ScrollText,
  'file-text': FileText,
  gavel: Gavel,
  'bar-chart': BarChart3,
  stethoscope: Stethoscope,
  'flask-conical': FlaskConical,
  archive: Archive,
  'clipboard-list': ClipboardList,
}

interface CitationLinkProps {
  icon: string
  text: string
  href?: string
}

export default function CitationLink({
  icon,
  text,
  href = '#',
}: CitationLinkProps) {
  const Icon = iconMap[icon] ?? FileText
  const isExternal = href !== '#'

  return (
    <a
      className="flex items-center gap-3 font-medium transition-colors hover:underline hover:text-primary"
      href={href}
      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <Icon className="size-4 shrink-0" />
      {text}
    </a>
  )
}

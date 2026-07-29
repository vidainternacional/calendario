import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type PastoralPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  icon?: LucideIcon
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export default function PastoralPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  backHref = '/pastoral',
  backLabel = 'Centro Pastoral',
  action,
}: PastoralPageHeaderProps) {
  return (
    <header className="pastoral-page-header">
      {backHref && (
        <Link href={backHref} className="pastoral-back-link">
          <ArrowLeft aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      <div className="pastoral-header-row">
        <div className="pastoral-header-copy">
          <div className="pastoral-eyebrow">
            {Icon && <Icon aria-hidden="true" />}
            <span>{eyebrow}</span>
          </div>
          <h1 className="pastoral-page-title">{title}</h1>
          {description && <p className="pastoral-page-description">{description}</p>}
        </div>
        {action && <div className="pastoral-header-action">{action}</div>}
      </div>
    </header>
  )
}

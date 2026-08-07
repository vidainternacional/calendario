import type { SVGProps } from 'react'

type ViewIconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  size?: number
}

function BaseIcon({ size = 24, children, ...props }: ViewIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function CompactViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="8.5" width="21" height="11" rx="5.5" />
      <path d="M8.8 9v10M14 9v10M19.2 9v10" />
    </BaseIcon>
  )
}

export function StackedViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="3.5" width="20" height="8" rx="3.8" />
      <rect x="4" y="16.5" width="20" height="8" rx="3.8" />
    </BaseIcon>
  )
}

export function DetailsViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="3" width="20" height="9.5" rx="2.8" />
      <path d="M8 7.75h12" />
      <rect x="4" y="15.5" width="20" height="9.5" rx="2.8" />
      <path d="M8 20.25h8.5" />
    </BaseIcon>
  )
}

export function MonthListViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="6" y="2.8" width="16" height="8.8" rx="2.4" />
      <circle cx="6.7" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="6.7" cy="21" r="1" fill="currentColor" stroke="none" />
      <circle cx="6.7" cy="26" r="1" fill="currentColor" stroke="none" />
      <path d="M10 16h12M10 21h12M10 26h12" />
    </BaseIcon>
  )
}

export function DayViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h2M4 14h2M4 21h2" />
      <rect x="8.5" y="4" width="15.5" height="20" rx="4" />
      <path d="M11.5 10h9.5M11.5 15h7M11.5 20h5" />
    </BaseIcon>
  )
}

export function TwoDayViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="9" height="18" rx="3" />
      <rect x="16" y="5" width="9" height="18" rx="3" />
      <path d="M13.5 8h1M13.5 14h1M13.5 20h1" />
    </BaseIcon>
  )
}

export function AgendaViewIcon(props: ViewIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="5" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="5" cy="14" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="5" cy="21" r="1.15" fill="currentColor" stroke="none" />
      <path d="M9 7h15M9 14h15M9 21h15" />
    </BaseIcon>
  )
}

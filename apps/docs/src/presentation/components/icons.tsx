import type React from 'react'

type IconProps = {
  className?: string
}

type StrokeIconProps = IconProps & {
  children: React.ReactNode
  strokeWidth?: number
}

/** The interface's one icon grammar: a 24-unit box, round 1.7 strokes. */
const StrokeIcon: React.FC<StrokeIconProps> = ({
  children,
  className,
  strokeWidth = 1.7
}) => (
  <svg
    aria-hidden
    className={className}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth={strokeWidth}
    viewBox='0 0 24 24'
  >
    {children}
  </svg>
)

export const BackIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M14.5 5.5 8 12l6.5 6.5' />
  </StrokeIcon>
)

export const ChevronIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props} strokeWidth={2.2}>
    <path d='m9.5 6 6 6-6 6' />
  </StrokeIcon>
)

/** Leads out of the site, to GitHub. */
export const OutboundIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M9 15 17 7M10 7h7v7' />
    <path d='M17 17.5H6.5V7' opacity='.55' />
  </StrokeIcon>
)

export const SearchIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <circle cx='10.5' cy='10.5' r='6' />
    <path d='m15 15 4.5 4.5' />
  </StrokeIcon>
)

export const CopyIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <rect height='11' rx='2.5' width='11' x='8.5' y='8.5' />
    <path d='M15.5 5.5a2 2 0 0 0-2-1.5H6.5a2 2 0 0 0-2 2v7a2 2 0 0 0 1.5 2' />
  </StrokeIcon>
)

export const CheckIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='m5.5 12.5 4 4 9-9' />
  </StrokeIcon>
)

/** Leads to a section of the same page. */
export const SectionLinkIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M10 14a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L11.5 6.8' />
    <path d='M14 10a4 4 0 0 0-5.66 0l-2.83 2.83a4 4 0 0 0 5.66 5.66l1.33-1.3' />
  </StrokeIcon>
)

/** Marks the newest release. */
export const SparkleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden
    className={className}
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path d='M12 3.5c.5 4.2 2.3 6 6.5 6.5-4.2.5-6 2.3-6.5 6.5-.5-4.2-2.3-6-6.5-6.5 4.2-.5 6-2.3 6.5-6.5Z' />
    <path
      d='M18.5 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z'
      opacity='.6'
    />
  </svg>
)

/** An empty place in a list: nothing pending, no notes. */
export const EmptySlotIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden
    className={className}
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    viewBox='0 0 28 28'
  >
    <rect
      height='24.5'
      rx='6.25'
      strokeDasharray='3.2 2.6'
      width='24.5'
      x='1.75'
      y='1.75'
    />
    <path d='M10 14h8' strokeLinecap='round' />
  </svg>
)

/** A version published by hand, before the changelog. */
export const HandIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M4.5 19.5h15' />
    <path d='m7 15.5 8.5-8.5 2.5 2.5L9.5 18H7z' />
    <path d='m13.5 9 2.5 2.5' />
  </StrokeIcon>
)

/** Every export at once. */
export const GridIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <rect height='6' rx='1.6' width='6' x='4.5' y='4.5' />
    <rect height='6' rx='1.6' width='6' x='13.5' y='4.5' />
    <rect height='6' rx='1.6' width='6' x='4.5' y='13.5' />
    <rect height='6' rx='1.6' width='6' x='13.5' y='13.5' />
  </StrokeIcon>
)

/** The site's own mark: a package. */
export const PackageIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M12 3.8 19.2 8v8L12 20.2 4.8 16V8z' />
    <path d='M4.8 8 12 12.2 19.2 8M12 12.2v8' />
  </StrokeIcon>
)

export const SystemThemeIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <circle cx='12' cy='12' r='7.5' />
    <path d='M12 4.5a7.5 7.5 0 0 1 0 15z' fill='currentColor' stroke='none' />
  </StrokeIcon>
)

export const LightThemeIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <circle cx='12' cy='12' r='3.75' />
    <path d='M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4' />
  </StrokeIcon>
)

export const DarkThemeIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z' />
  </StrokeIcon>
)

/** One in-house glyph per export kind, in the same stroke grammar. */
export const FunctionIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M15.5 4.5c-2.3 0-3.3 1.1-3.6 3.4l-1.3 8.2c-.3 2.3-1.3 3.4-3.6 3.4' />
    <path d='M8.5 10.5h7' />
  </StrokeIcon>
)

export const HookIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M9 4v10a3.5 3.5 0 0 0 7 0v-1.5' />
    <path d='m13.8 14.6 2.2-2.6 2.2 2.6' />
    <circle cx='9' cy='4' fill='currentColor' r='.6' />
  </StrokeIcon>
)

export const TypeIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='m7.5 8-4 4 4 4M16.5 8l4 4-4 4' />
    <path d='M10 9.5h4M12 9.5V15' />
  </StrokeIcon>
)

export const ConstantIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M6 9.5h12M6 14.5h12' />
  </StrokeIcon>
)

export const SassMemberIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M9 4.5c-2 0-2.5 1-2.5 3s-.5 3.5-2 4.5c1.5 1 2 2.5 2 4.5s.5 3 2.5 3M15 4.5c2 0 2.5 1 2.5 3s.5 3.5 2 4.5c-1.5 1-2 2.5-2 4.5s-.5 3-2.5 3' />
  </StrokeIcon>
)

export const FileIcon: React.FC<IconProps> = (props) => (
  <StrokeIcon {...props}>
    <path d='M13.5 3.8H7.8a2 2 0 0 0-2 2v12.4a2 2 0 0 0 2 2h8.4a2 2 0 0 0 2-2V8.5z' />
    <path d='M13.5 3.8v4.7h4.7M9 13h6M9 16.5h4' />
  </StrokeIcon>
)

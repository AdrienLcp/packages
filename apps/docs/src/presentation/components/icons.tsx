import {
  Box,
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Copy,
  Equal,
  ExternalLink,
  FileText,
  FishingHook,
  LayoutGrid,
  Link,
  type LucideIcon,
  type LucideProps,
  Moon,
  Parentheses,
  PenLine,
  Search,
  Sparkles,
  Sun,
  Type
} from 'lucide-react'
import type React from 'react'

type IconProps = {
  className?: string
}

/** The interface's one icon grammar: Lucide's 24-unit box and round joins, at a 1.7 stroke. */
const ICON_STROKE_WIDTH = 1.7

/** The stylesheet sizes every icon; Lucide's own 24px would win where it does not. */
const SIZED_BY_STYLESHEET = { height: undefined, width: undefined }

const iconOf = (
  Glyph: LucideIcon,
  glyphProps: LucideProps = {}
): React.FC<IconProps> => {
  const Icon: React.FC<IconProps> = ({ className }) => (
    <Glyph
      aria-hidden
      className={className}
      strokeWidth={ICON_STROKE_WIDTH}
      {...SIZED_BY_STYLESHEET}
      {...glyphProps}
    />
  )

  return Icon
}

export const BackIcon = iconOf(ChevronLeft)

export const ChevronIcon = iconOf(ChevronRight, { strokeWidth: 2.2 })

/** Leads out of the site, to GitHub. */
export const OutboundIcon = iconOf(ExternalLink)

export const SearchIcon = iconOf(Search)

export const CopyIcon = iconOf(Copy)

export const CheckIcon = iconOf(Check)

/** Leads to a section of the same page. */
export const SectionLinkIcon = iconOf(Link)

/** Marks the newest release. */
export const SparkleIcon = iconOf(Sparkles)

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
export const HandIcon = iconOf(PenLine)

/** Every export at once. */
export const GridIcon = iconOf(LayoutGrid)

/** The site's own mark: a package. */
export const PackageIcon = iconOf(Box)

export const SystemThemeIcon = iconOf(Contrast)

export const LightThemeIcon = iconOf(Sun)

export const DarkThemeIcon = iconOf(Moon)

/** One glyph per export kind, in the same stroke grammar. */
export const FunctionIcon = iconOf(Parentheses)

export const HookIcon = iconOf(FishingHook)

export const TypeIcon = iconOf(Type)

export const ConstantIcon = iconOf(Equal)

export const SassMemberIcon = iconOf(Braces)

export const FileIcon = iconOf(FileText)

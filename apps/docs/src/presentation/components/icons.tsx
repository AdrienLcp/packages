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
  PenLine,
  Search,
  Sparkles,
  Sun
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

type CodeGlyph = {
  fontSize: number
  fontStyle?: 'italic'
  fontWeight: number
  letterSpacing?: string
  text: string
}

/** A kind written as code writes it, set in the code face and centred in the icons' 24-unit box. */
const codeGlyphIconOf = ({
  fontSize,
  fontStyle,
  fontWeight,
  letterSpacing,
  text
}: CodeGlyph): React.FC<IconProps> => {
  const Icon: React.FC<IconProps> = ({ className }) => (
    <svg aria-hidden className={className} viewBox='0 0 24 24'>
      <text
        dominantBaseline='central'
        fill='currentColor'
        fontSize={fontSize}
        style={{
          fontFamily: 'var(--font-code)',
          fontStyle,
          fontWeight,
          letterSpacing
        }}
        textAnchor='middle'
        x='12'
        y='12'
      >
        {text}
      </text>
    </svg>
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
export const FunctionIcon = codeGlyphIconOf({
  fontSize: 18,
  fontStyle: 'italic',
  fontWeight: 400,
  text: 'ƒ'
})

export const HookIcon = iconOf(FishingHook)

export const TypeIcon = codeGlyphIconOf({
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '-0.12em',
  text: '<T>'
})

export const ConstantIcon = iconOf(Equal)

export const SassMemberIcon = iconOf(Braces)

export const FileIcon = iconOf(FileText)

import type React from 'react'
import {
  siBiome,
  siCss,
  siNpm,
  siReact,
  siReactrouter,
  siSass,
  siTypescript,
  siVite
} from 'simple-icons'

import type { EcosystemTool } from './ecosystem.ts'

/**
 * React Aria is Adobe's, and Simple Icons no longer carries Adobe's mark: its
 * path is kept here, from the last release that had it (CC0).
 */
const ADOBE_LOGO_PATH =
  'M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624Z'

const LOGO_PATHS = {
  biome: siBiome.path,
  css: siCss.path,
  react: siReact.path,
  'react-aria': ADOBE_LOGO_PATH,
  'react-router': siReactrouter.path,
  sass: siSass.path,
  typescript: siTypescript.path,
  vite: siVite.path
} as const satisfies Record<EcosystemTool, string>

/** Each tool by its own name, which no locale translates. */
export const ECOSYSTEM_TOOL_NAMES = {
  biome: 'Biome',
  css: 'CSS',
  react: 'React',
  'react-aria': 'React Aria',
  'react-router': 'React Router',
  sass: 'Sass',
  typescript: 'TypeScript',
  vite: 'Vite'
} as const satisfies Record<EcosystemTool, string>

type LogoProps = {
  className?: string
}

const Logo: React.FC<LogoProps & { path: string }> = ({ className, path }) => (
  <svg
    aria-hidden
    className={className}
    fill='currentColor'
    viewBox='0 0 24 24'
  >
    <path d={path} />
  </svg>
)

/** A tool's logo, drawn in the current colour. */
export const EcosystemLogo: React.FC<LogoProps & { tool: EcosystemTool }> = ({
  tool,
  ...props
}) => <Logo {...props} path={LOGO_PATHS[tool]} />

/** npm's logo, beside an install command. */
export const NpmLogo: React.FC<LogoProps> = (props) => (
  <Logo {...props} path={siNpm.path} />
)

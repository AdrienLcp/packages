import type { EntryPoint } from './entry-points.ts'

export const ECOSYSTEM_TOOLS = [
  'react-router',
  'react-aria',
  'react',
  'biome',
  'sass',
  'vite',
  'typescript',
  'css'
] as const

/** A tool a package is written for, shown by its logo. */
export type EcosystemTool = (typeof ECOSYSTEM_TOOLS)[number]

/** A tool the package works with, and whether a consumer may go without it. */
export type EcosystemTie = {
  isOptional: boolean
  tool: EcosystemTool
}

const PEER_TOOLS = {
  '@biomejs/biome': 'biome',
  react: 'react',
  'react-aria-components': 'react-aria',
  'react-router': 'react-router',
  sass: 'sass',
  vite: 'vite'
} as const satisfies Record<string, EcosystemTool>

const isPeerWithTool = (name: string): name is keyof typeof PEER_TOOLS =>
  Object.hasOwn(PEER_TOOLS, name)

const TYPESCRIPT_KEYWORD = 'typescript'

/**
 * What a package works with, read from its peers and its entry points: a peer
 * names a tool, a TypeScript entry point or the `typescript` keyword names
 * TypeScript, a `.css` entry point names CSS. Required tools first, each group
 * in `ECOSYSTEM_TOOLS` order; the first is the package's mark.
 */
export const ecosystemOf = ({
  entryPoints,
  keywords,
  optionalPeers,
  peers
}: {
  entryPoints: readonly EntryPoint[]
  keywords: readonly string[]
  optionalPeers: readonly string[]
  peers: readonly string[]
}): readonly EcosystemTie[] => {
  const ties = new Map<EcosystemTool, boolean>()

  for (const peer of peers) {
    if (isPeerWithTool(peer)) {
      ties.set(PEER_TOOLS[peer], optionalPeers.includes(peer))
    }
  }

  if (
    keywords.includes(TYPESCRIPT_KEYWORD) ||
    entryPoints.some((entryPoint) => entryPoint.format === 'module')
  ) {
    ties.set('typescript', false)
  }

  if (entryPoints.some((entryPoint) => entryPoint.path.endsWith('.css'))) {
    ties.set('css', false)
  }

  return [...ties]
    .map(([tool, isOptional]) => ({ isOptional, tool }))
    .toSorted(
      (first, second) =>
        Number(first.isOptional) - Number(second.isOptional) ||
        ECOSYSTEM_TOOLS.indexOf(first.tool) -
          ECOSYSTEM_TOOLS.indexOf(second.tool)
    )
}

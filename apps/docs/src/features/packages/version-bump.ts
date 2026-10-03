export const VERSION_BUMPS = ['major', 'minor', 'patch'] as const

/** How far a change moves a package's version, as changesets names it. */
export type VersionBump = (typeof VERSION_BUMPS)[number]

export const isVersionBump = (value: string): value is VersionBump =>
  VERSION_BUMPS.some((bump) => bump === value)

/** The bump a release takes from its notes: the largest of theirs. */
export const largestBumpOf = (bumps: readonly VersionBump[]): VersionBump =>
  VERSION_BUMPS.find((bump) => bumps.includes(bump)) ?? 'patch'

const directoryOf = (path: string): string =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

/**
 * `specifier` resolved against the file that imports it, as a path inside the
 * package: `resolveSourcePath('src/index.ts', './react.ts')` is `src/react.ts`.
 */
export const resolveSourcePath = ({
  from,
  specifier
}: {
  from: string
  specifier: string
}): string => {
  const segments = directoryOf(from).split('/').filter(Boolean)

  for (const segment of specifier.split('/')) {
    if (segment === '..') {
      segments.pop()
    } else if (segment !== '.' && segment !== '') {
      segments.push(segment)
    }
  }

  return segments.join('/')
}

/**
 * The files a specifier may name once compiled away: `./a.js` was written
 * `./a.ts`, and `./a` may be either.
 */
export const sourceCandidatesFor = (path: string): readonly string[] => {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    return [path]
  }

  if (path.endsWith('.js')) {
    const stem = path.slice(0, -'.js'.length)
    return [`${stem}.ts`, `${stem}.tsx`]
  }

  return [`${path}.ts`, `${path}.tsx`]
}

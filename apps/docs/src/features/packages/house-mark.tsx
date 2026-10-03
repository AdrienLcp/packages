import type React from 'react'

/**
 * The marks drawn for the packages no tool's logo describes: a 24-unit box,
 * round 2.4 strokes, one filled part each.
 */
const HOUSE_MARKS: Partial<Record<string, React.ReactNode>> = {
  browser: (
    <>
      <rect height='16' rx='2.5' width='19' x='2.5' y='4' />
      <path d='M2.5 9.5h19' />
      <circle cx='6' cy='6.75' fill='currentColor' r='0.6' />
      <circle cx='9' cy='6.75' fill='currentColor' r='0.6' />
    </>
  ),
  i18n: (
    <>
      <path d='M4.5 2.5h8a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H8l-3.5 3v-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z' />
      <path
        d='M11.5 13h8a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2v3l-3.5-3h-4.5a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2z'
        fill='currentColor'
      />
    </>
  ),
  result: (
    <>
      <path d='M12 21.5V16c0-3.5-5-4-5-8.25M12 16c0-3.5 5-4 5-8.25' />
      <circle cx='7' cy='5' fill='currentColor' r='2.25' />
      <circle cx='17' cy='5' r='2.25' />
    </>
  ),
  'safe-storage': (
    <>
      <rect height='18' rx='2.5' width='16' x='4' y='3' />
      <path d='M4 12h16M10 7.5h4M10 16.5h4' />
    </>
  ),
  'theme-preference': (
    <>
      <circle cx='12' cy='12' r='8.75' />
      <path d='M12 3.25a8.75 8.75 0 0 1 0 17.5z' fill='currentColor' />
    </>
  ),
  tsconfig: (
    <>
      <path d='M9 3.5H8A2.5 2.5 0 0 0 5.5 6v3.25A2.75 2.75 0 0 1 2.75 12 2.75 2.75 0 0 1 5.5 14.75V18A2.5 2.5 0 0 0 8 20.5h1M15 3.5h1A2.5 2.5 0 0 1 18.5 6v3.25A2.75 2.75 0 0 0 21.25 12a2.75 2.75 0 0 0-2.75 2.75V18a2.5 2.5 0 0 1-2.5 2.5h-1' />
      <circle cx='12' cy='12' fill='currentColor' r='1.5' />
    </>
  )
}

/** Whether a package has a mark of its own rather than a tool's logo. */
export const hasHouseMark = (name: string): boolean =>
  HOUSE_MARKS[name] !== undefined

/** A package's own mark, drawn in the current colour; nothing when it has none. */
export const HouseMark: React.FC<{ name: string }> = ({ name }) => {
  const mark = HOUSE_MARKS[name]

  if (mark === undefined) {
    return null
  }

  return (
    <svg
      aria-hidden
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2.4}
      viewBox='0 0 24 24'
    >
      {mark}
    </svg>
  )
}

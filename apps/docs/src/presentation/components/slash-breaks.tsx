import type React from 'react'
import { Fragment } from 'react'

type SlashBreaksProps = {
  text: string
}

/** A path that may wrap after each `/`, so a narrow row breaks it between segments rather than inside one. */
export const SlashBreaks: React.FC<SlashBreaksProps> = ({ text }) => {
  const segments = text.split('/')

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    const pathUpToSegment = segments.slice(0, index + 1).join('/')

    return (
      <Fragment key={pathUpToSegment}>
        {segment}
        {!isLast && (
          <>
            /<wbr />
          </>
        )}
      </Fragment>
    )
  })
}

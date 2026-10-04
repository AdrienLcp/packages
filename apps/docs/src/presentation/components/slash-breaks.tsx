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

    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments repeat and never reorder
      <Fragment key={index}>
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

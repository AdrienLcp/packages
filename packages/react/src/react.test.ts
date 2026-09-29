import { createElement, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createSafeContext } from './create-safe-context.ts'

const [NameContext, useName, useOptionalName] =
  createSafeContext<string>('NameContext')

const ReadName = (): ReactNode => useName()

const ReadOptionalName = (): ReactNode => useOptionalName() ?? 'nobody'

describe('createSafeContext', () => {
  it('[context] reads the value its provider holds', () => {
    const html = renderToString(
      createElement(NameContext, { value: 'Ada' }, createElement(ReadName))
    )

    expect(html).toBe('Ada')
  })

  it('[context] throws an error naming the context when the provider is missing', () => {
    expect(() => renderToString(createElement(ReadName))).toThrow(
      'NameContext was read outside of its provider'
    )
  })

  it('[context] the optional reader answers undefined without a provider', () => {
    expect(renderToString(createElement(ReadOptionalName))).toBe('nobody')
  })
})

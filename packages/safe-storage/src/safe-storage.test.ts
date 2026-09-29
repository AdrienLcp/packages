import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readRecognizedText } from './read-recognized-text.ts'
import { readStoredJson } from './read-stored-json.ts'
import { readStoredText } from './read-stored-text.ts'
import { removeStored } from './remove-stored.ts'
import { writeStoredJson } from './write-stored-json.ts'
import { writeStoredText } from './write-stored-text.ts'

const KEY = 'test:key'

type Log = { entries: string[]; version: 1 }

const isLog = (value: unknown): value is Log =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  value.version === 1 &&
  'entries' in value &&
  Array.isArray(value.entries)

const isScheme = (stored: string): stored is 'dark' | 'light' =>
  stored === 'light' || stored === 'dark'

const stubStorageThrowingOn = (
  method: 'getItem' | 'removeItem' | 'setItem',
  error: Error
): void => {
  const throwing = () => {
    throw error
  }

  vi.stubGlobal('localStorage', {
    getItem: () => null,
    removeItem: () => {},
    setItem: () => {},
    [method]: throwing
  })
}

const SECURITY_ERROR = new DOMException('denied', 'SecurityError')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readStoredText', () => {
  it('[read] nothing stored is a success holding null', () => {
    expect(readStoredText(KEY)).toEqual({ data: null, status: 'success' })
  })

  it('[read] a storage that throws is unavailable', () => {
    stubStorageThrowingOn('getItem', SECURITY_ERROR)

    expect(readStoredText(KEY)).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})

describe('readRecognizedText', () => {
  it('[recognized] narrows a recognized value', () => {
    localStorage.setItem(KEY, 'dark')

    expect(readRecognizedText({ isRecognized: isScheme, key: KEY })).toEqual({
      data: 'dark',
      status: 'success'
    })
  })

  it('[recognized] a value the guard refuses is unrecognized', () => {
    localStorage.setItem(KEY, 'sepia')

    expect(readRecognizedText({ isRecognized: isScheme, key: KEY })).toEqual({
      error: 'unrecognized',
      status: 'failure'
    })
  })

  it('[recognized] nothing stored is null, not unrecognized', () => {
    expect(readRecognizedText({ isRecognized: isScheme, key: KEY })).toEqual({
      data: null,
      status: 'success'
    })
  })

  it('[recognized] a storage that throws is unavailable', () => {
    stubStorageThrowingOn('getItem', SECURITY_ERROR)

    expect(readRecognizedText({ isRecognized: isScheme, key: KEY })).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})

describe('readStoredJson', () => {
  it('[json] reads back what writeStoredJson wrote', () => {
    const log: Log = { entries: ['squats'], version: 1 }

    writeStoredJson({ key: KEY, value: log })

    expect(readStoredJson({ isValue: isLog, key: KEY })).toEqual({
      data: log,
      status: 'success'
    })
  })

  it('[json] text that is not JSON is unrecognized', () => {
    localStorage.setItem(KEY, '{"version":')

    expect(readStoredJson({ isValue: isLog, key: KEY })).toEqual({
      error: 'unrecognized',
      status: 'failure'
    })
  })

  it('[json] JSON of another shape is unrecognized', () => {
    localStorage.setItem(KEY, '{"version":2,"entries":[]}')

    expect(readStoredJson({ isValue: isLog, key: KEY })).toEqual({
      error: 'unrecognized',
      status: 'failure'
    })
  })

  it('[json] a storage that throws is unavailable', () => {
    stubStorageThrowingOn('getItem', SECURITY_ERROR)

    expect(readStoredJson({ isValue: isLog, key: KEY })).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})

describe('writeStoredText', () => {
  it('[write] stores the text', () => {
    expect(writeStoredText({ key: KEY, text: 'dark' })).toEqual({
      status: 'success'
    })
    expect(localStorage.getItem(KEY)).toBe('dark')
  })

  it('[write] a full storage is quota', () => {
    stubStorageThrowingOn(
      'setItem',
      new DOMException('full', 'QuotaExceededError')
    )

    expect(writeStoredText({ key: KEY, text: 'dark' })).toEqual({
      error: 'quota',
      status: 'failure'
    })
  })

  it('[write] a full storage in an older Firefox is quota', () => {
    stubStorageThrowingOn(
      'setItem',
      new DOMException('full', 'NS_ERROR_DOM_QUOTA_REACHED')
    )

    expect(writeStoredText({ key: KEY, text: 'dark' })).toEqual({
      error: 'quota',
      status: 'failure'
    })
  })

  it('[write] any other throw is unavailable', () => {
    stubStorageThrowingOn('setItem', SECURITY_ERROR)

    expect(writeStoredText({ key: KEY, text: 'dark' })).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })

  it('[write] a JSON write is refused the same way', () => {
    stubStorageThrowingOn(
      'setItem',
      new DOMException('full', 'QuotaExceededError')
    )

    expect(writeStoredJson({ key: KEY, value: { version: 1 } })).toEqual({
      error: 'quota',
      status: 'failure'
    })
  })
})

describe('removeStored', () => {
  it('[remove] removes the entry, and a missing one is no failure', () => {
    localStorage.setItem(KEY, 'dark')

    expect(removeStored(KEY)).toEqual({ status: 'success' })
    expect(removeStored(KEY)).toEqual({ status: 'success' })
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('[remove] a storage that throws is unavailable', () => {
    stubStorageThrowingOn('removeItem', SECURITY_ERROR)

    expect(removeStored(KEY)).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})

describe('without any localStorage', () => {
  it('[server] every call is unavailable rather than a ReferenceError', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readStoredText(KEY).status).toBe('failure')
    expect(writeStoredText({ key: KEY, text: 'x' })).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
    expect(removeStored(KEY).status).toBe('failure')
  })
})

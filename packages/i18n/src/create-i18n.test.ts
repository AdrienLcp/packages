import { describe, expect, it, vi } from 'vitest'

import {
  createI18n,
  type DictionaryLoaderContext,
  isAbortError
} from './create-i18n.ts'
import { defineTranslation } from './define-translation.ts'
import { defineDictionary } from './dictionary.ts'

const EN = defineDictionary({
  greeting: 'Hello {name}',
  round: { none: 'Nobody got it' },
  score: defineTranslation('{count:plural}', {
    plural: { count: { one: '{?} point', other: '{?} points' } }
  })
})

const FR = defineDictionary({
  greeting: 'Bonjour {name}',
  round: { none: 'Personne n’a trouvé' },
  score: defineTranslation('{count:plural}', {
    plural: { count: { one: '{?} point', other: '{?} points' } }
  })
})

const i18n = createI18n({
  defaultLocale: 'en',
  dictionaries: { en: EN, fr: FR }
})

describe('translator', () => {
  it('[i18n] reads the dictionary the locale is registered with', () => {
    expect(i18n.translator('fr')('round.none')).toBe('Personne n’a trouvé')
    expect(i18n.translator('en')('round.none')).toBe('Nobody got it')
  })

  it('[i18n] formats for the same locale it translates in', () => {
    expect(i18n.translator('fr')('score', { count: 0 })).toBe('0 point')
    expect(i18n.translator('en')('score', { count: 0 })).toBe('0 points')
  })

  it('[i18n] hands out one translator per locale, not one per call', () => {
    expect(i18n.translator('fr')).toBe(i18n.translator('fr'))
    expect(i18n.translator('fr')).not.toBe(i18n.translator('en'))
  })
})

describe('a format locale', () => {
  it('[i18n] formats numbers in it and keeps the sentence in the language', () => {
    const translate = i18n.translator('fr', 'en')

    expect(translate('score', { count: 1500 })).toBe('1,500 points')
    expect(translate('round.none')).toBe('Personne n’a trouvé')
  })

  it('[i18n] hands out one translator per locale and preference list', () => {
    expect(i18n.translator('fr', ['en-GB', 'en'])).toBe(
      i18n.translator('fr', ['en-GB', 'en'])
    )
    expect(i18n.translator('fr', 'en')).not.toBe(i18n.translator('fr'))
    expect(i18n.translator('fr', 'en')).not.toBe(i18n.translator('fr', 'de'))
  })
})

describe('negotiate', () => {
  it('[i18n] answers with a registered locale, region dropped', () => {
    expect(i18n.negotiate(['fr-CA'])).toBe('fr')
    expect(i18n.negotiate(['de-DE', 'fr-FR', 'en'])).toBe('fr')
  })

  it('[i18n] falls back to the default locale, which needs no repeating', () => {
    expect(i18n.negotiate(['de', 'it'])).toBe('en')
    expect(i18n.negotiate([])).toBe('en')
  })
})

describe('compare', () => {
  it('[i18n] orders names the way the locale does, not the way code points do', () => {
    const names = ['Zoé', 'Émile', 'Adrien']

    expect([...names].sort(i18n.compare('fr'))).toStrictEqual([
      'Adrien',
      'Émile',
      'Zoé'
    ])
    expect([...names].sort()).toStrictEqual(['Adrien', 'Zoé', 'Émile'])
  })

  it('[i18n] takes collator options, so a numbered list can sort as numbers', () => {
    const rounds = ['Round 10', 'Round 2']

    expect(
      [...rounds].sort(i18n.compare('en', { numeric: true }))
    ).toStrictEqual(['Round 2', 'Round 10'])
    expect([...rounds].sort(i18n.compare('en'))).toStrictEqual([
      'Round 10',
      'Round 2'
    ])
  })
})

describe('the registry', () => {
  it('[i18n] names its locales and its default', () => {
    expect(i18n.locales).toStrictEqual(['en', 'fr'])
    expect(i18n.defaultLocale).toBe('en')
  })
})

describe('a dictionary that is not in the bundle yet', () => {
  const buildRegistry = () => {
    let fetches = 0

    const registry = createI18n({
      defaultLocale: 'en',
      dictionaries: {
        de: () => {
          fetches += 1

          return import('./dictionary-de.fixture')
        },
        en: EN,
        fr: FR
      }
    })

    return { fetched: () => fetches, registry }
  }

  it('[i18n] reads the default locale until the dictionary lands', () => {
    const { registry } = buildRegistry()

    expect(registry.translator('de')('round.none')).toBe('Nobody got it')
    expect(registry.translator('de')).toBe(registry.translator('en'))
  })

  it('[i18n] swaps to the locale’s own once it has been loaded', async () => {
    const { registry } = buildRegistry()

    await registry.load('de')

    expect(registry.translator('de')('round.none')).toBe(
      'Niemand hat es gefunden'
    )
    expect(registry.translator('de')).not.toBe(registry.translator('en'))
  })

  it('[i18n] hands out a new translator on the far side of a load', async () => {
    const { registry } = buildRegistry()
    const before = registry.translator('de')

    await registry.load('de')

    expect(registry.translator('de')).not.toBe(before)
    expect(registry.translator('de')).toBe(registry.translator('de'))
  })

  it('[i18n] formats a lazily loaded locale in its own language', async () => {
    const { registry } = buildRegistry()

    await registry.load('de')

    expect(registry.translator('de')('score', { count: 1 })).toBe('1 Punkt')
    expect(registry.translator('de')('score', { count: 2 })).toBe('2 Punkte')
  })

  it('[i18n] fetches once however many callers ask at the same time', async () => {
    const { fetched, registry } = buildRegistry()

    await Promise.all([
      registry.load('de'),
      registry.load('de'),
      registry.load('de')
    ])

    expect(fetched()).toBe(1)

    await registry.load('de')

    expect(fetched()).toBe(1)
  })

  it('[i18n] fetches once for every format locale, and resolves with each one’s translator', async () => {
    const { fetched, registry } = buildRegistry()

    const [inGerman, inEnglish] = await Promise.all([
      registry.load('de'),
      registry.load('de', { formatLocale: 'en' })
    ])

    expect(fetched()).toBe(1)
    expect(inGerman).toBe(registry.translator('de'))
    expect(inEnglish).toBe(registry.translator('de', 'en'))
    expect(inEnglish('score', { count: 1500 })).toBe('1,500 Punkte')
  })

  it('[i18n] resolves at once for a locale it already holds', async () => {
    const { fetched, registry } = buildRegistry()

    expect(await registry.load('fr')).toBe(registry.translator('fr'))
    expect(await registry.load('en')).toBe(registry.translator('en'))
    expect(fetched()).toBe(0)
  })

  it('[i18n] negotiates a locale whose dictionary has not arrived', () => {
    const { registry } = buildRegistry()

    expect(registry.locales).toStrictEqual(['de', 'en', 'fr'])
    expect(registry.negotiate(['de-AT'])).toBe('de')
  })
})

describe('a dictionary that fails to load', () => {
  const buildRegistry = () => {
    let attempts = 0

    const registry = createI18n({
      defaultLocale: 'en',
      dictionaries: {
        en: EN,
        it: async () => {
          attempts += 1

          if (attempts === 1) {
            throw new Error('offline')
          }

          return {
            default: defineDictionary({
              greeting: 'Ciao {name}',
              round: { none: 'Nessuno ha indovinato' },
              score: defineTranslation('{count:plural}', {
                plural: { count: { one: '{?} punto', other: '{?} punti' } }
              })
            })
          }
        }
      }
    })

    return { attempted: () => attempts, registry }
  }

  it('[i18n] leaves the reader on the default locale', async () => {
    const { registry } = buildRegistry()

    await expect(registry.load('it')).rejects.toThrow('offline')
    expect(registry.translator('it')('round.none')).toBe('Nobody got it')
  })

  it('[i18n] forgets the attempt, so that asking again retries', async () => {
    const { attempted, registry } = buildRegistry()

    await expect(registry.load('it')).rejects.toThrow('offline')
    await registry.load('it')

    expect(attempted()).toBe(2)
    expect(registry.translator('it')('round.none')).toBe(
      'Nessuno ha indovinato'
    )
  })
})

describe('a load its caller no longer wants', () => {
  const ES = defineDictionary({
    greeting: 'Hola {name}',
    round: { none: 'Nadie lo encontró' },
    score: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} punto', other: '{?} puntos' } }
    })
  })

  const buildRegistry = () => {
    const pending = {
      de: Promise.withResolvers<void>(),
      es: Promise.withResolvers<void>()
    }
    const signals: DictionaryLoaderContext['signal'][] = []
    let fetches = 0

    const registry = createI18n({
      defaultLocale: 'en',
      dictionaries: {
        de: async ({ signal }: DictionaryLoaderContext) => {
          fetches += 1
          signals.push(signal)
          await pending.de.promise

          return import('./dictionary-de.fixture')
        },
        en: EN,
        es: async () => {
          await pending.es.promise

          return { default: ES }
        }
      }
    })

    return { fetched: () => fetches, pending, registry, signals }
  }

  it('[i18n] rejects the superseded caller with an AbortError and lets the newer one through', async () => {
    const { pending, registry } = buildRegistry()
    const toGerman = new AbortController()

    const inGermanAborted = registry.load('de', { signal: toGerman.signal })
    toGerman.abort()
    const inSpanish = registry.load('es')

    pending.es.resolve()
    expect((await inSpanish)('round.none')).toBe('Nadie lo encontró')

    pending.de.resolve()
    await expect(inGermanAborted).rejects.toSatisfy(isAbortError)
    await vi.waitFor(() => {
      expect(registry.translator('de')('round.none')).toBe(
        'Niemand hat es gefunden'
      )
    })
  })

  it('[i18n] rejects at once a caller whose signal is already aborted, without fetching', async () => {
    const { fetched, registry } = buildRegistry()

    await expect(
      registry.load('de', { signal: AbortSignal.abort() })
    ).rejects.toSatisfy(isAbortError)
    expect(fetched()).toBe(0)
  })

  it('[i18n] detaches one caller without cancelling the fetch the others wait on', async () => {
    const { fetched, pending, registry, signals } = buildRegistry()
    const leaving = new AbortController()

    const left = registry.load('de', { signal: leaving.signal })
    const staying = registry.load('de', {
      signal: new AbortController().signal
    })
    leaving.abort()
    pending.de.resolve()

    await expect(left).rejects.toSatisfy(isAbortError)
    expect((await staying)('round.none')).toBe('Niemand hat es gefunden')
    expect(fetched()).toBe(1)
    expect(signals[0]?.aborted).toBe(false)
  })

  it('[i18n] aborts the loader once every caller has aborted', async () => {
    const { registry, signals } = buildRegistry()
    const first = new AbortController()
    const second = new AbortController()

    const loads = [
      registry.load('de', { signal: first.signal }),
      registry.load('de', { signal: second.signal })
    ]
    first.abort()

    expect(signals[0]?.aborted).toBe(false)

    second.abort()

    expect(signals[0]?.aborted).toBe(true)
    await Promise.allSettled(loads)
  })

  it('[i18n] keeps the loader running for a caller that passed no signal', async () => {
    const { pending, registry, signals } = buildRegistry()
    const leaving = new AbortController()

    const left = registry.load('de', { signal: leaving.signal })
    const staying = registry.load('de')
    leaving.abort()
    pending.de.resolve()

    expect(signals[0]?.aborted).toBe(false)
    await expect(left).rejects.toSatisfy(isAbortError)
    expect((await staying)('round.none')).toBe('Niemand hat es gefunden')
  })

  it('[i18n] fetches anew for a caller arriving after every other has left', async () => {
    const { fetched, pending, registry, signals } = buildRegistry()
    const leaving = new AbortController()

    const left = registry.load('de', { signal: leaving.signal })
    leaving.abort()
    const arriving = registry.load('de')
    pending.de.resolve()

    await expect(left).rejects.toSatisfy(isAbortError)
    expect((await arriving)('round.none')).toBe('Niemand hat es gefunden')
    expect(fetched()).toBe(2)
    expect(signals[1]?.aborted).toBe(false)
  })

  it('[i18n] tells an abort from a failure', () => {
    expect(isAbortError(new DOMException('gone', 'AbortError'))).toBe(true)
    expect(isAbortError(new Error('offline'))).toBe(false)
    expect(isAbortError('AbortError')).toBe(false)
  })
})

describe('five languages', () => {
  const laterOn = () => import('./dictionary-de.fixture')

  const registry = createI18n({
    defaultLocale: 'en',
    dictionaries: {
      de: laterOn,
      en: EN,
      es: laterOn,
      'fr-CA': laterOn,
      it: laterOn
    }
  })

  it('[i18n] ships one dictionary and negotiates all five', () => {
    expect(registry.locales).toStrictEqual(['de', 'en', 'es', 'fr-CA', 'it'])
    expect(registry.negotiate(['it-IT'])).toBe('it')
    expect(registry.negotiate(['fr'])).toBe('fr-CA')
    expect(registry.negotiate(['fr-CA'])).toBe('fr-CA')
    expect(registry.negotiate(['pt'])).toBe('en')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineTranslation } from './define-translation.ts'
import { type DictionaryFor, defineDictionary } from './dictionary.ts'
import { createTranslator } from './translator.ts'

const REFERENCE = defineDictionary({
  echo: '{name}, hello {name}',
  inbox: defineTranslation('{count:plural}', {
    plural: {
      count: {
        one: '{?} message from {sender}',
        other: '{?} messages from {sender}'
      }
    }
  }),
  menu: { built: 'Build {build}' },
  posted: defineTranslation('Posted {when:relative}', {
    relative: { when: { numeric: 'auto', unit: 'day' } }
  }),
  round: {
    clip: '{seconds:number}s',
    genres: 'Playing {genres:list}',
    none: 'Nobody got it'
  },
  score: defineTranslation('{count:plural}', {
    plural: { count: { one: '{?} point', other: '{?} points' } }
  }),
  spokenIn: defineTranslation('Spoken in {language:displayname}', {
    displayname: { language: { type: 'language' } }
  }),
  standing: defineTranslation('{place:enum}', {
    enum: { place: { first: '{name} wins', second: '{name} came close' } }
  }),
  terms: 'Read the <link>terms</link> before playing',
  waiting: defineTranslation('{count:plural}', {
    plural: {
      count: {
        one: '{?} has answered',
        other: '{?} have answered',
        zero: 'Nobody yet'
      }
    }
  }),
  welcome: 'Welcome <strong>{name}</strong>, you have {count:number} points',
  winner: defineTranslation('The {place:enum} takes it', {
    enum: { place: { first: 'winner', second: 'runner-up' } }
  })
})

const FRENCH: DictionaryFor<typeof REFERENCE> = {
  echo: '{name}, bonjour {name}',
  inbox: defineTranslation('{count:plural}', {
    plural: {
      count: {
        one: '{?} message de {sender}',
        other: '{?} messages de {sender}'
      }
    }
  }),
  menu: { built: 'Version {build}' },
  posted: defineTranslation('Publié {when:relative}', {
    relative: { when: { numeric: 'auto', unit: 'day' } }
  }),
  round: {
    clip: '{seconds:number} s',
    genres: 'On joue {genres:list}',
    none: 'Personne n’a trouvé'
  },
  score: defineTranslation('{count:plural}', {
    plural: { count: { one: '{?} point', other: '{?} points' } }
  }),
  spokenIn: defineTranslation('Parlé en {language:displayname}', {
    displayname: { language: { type: 'language' } }
  }),
  standing: defineTranslation('{place:enum}', {
    enum: {
      place: { first: '{name} gagne', second: '{name} a frôlé la victoire' }
    }
  }),
  terms: 'Lis les <link>conditions</link> avant de jouer',
  waiting: defineTranslation('{count:plural}', {
    plural: {
      count: {
        one: '{?} a répondu',
        other: '{?} ont répondu',
        zero: 'Personne pour l’instant'
      }
    }
  }),
  welcome: 'Bienvenue <strong>{name}</strong>, tu as {count:number} points',
  winner: defineTranslation('C’est le {place:enum}', {
    enum: { place: { first: 'vainqueur', second: 'deuxième' } }
  })
}

const inEnglish = createTranslator<typeof REFERENCE>({
  dictionary: REFERENCE,
  locale: 'en'
})

const inFrench = createTranslator<typeof REFERENCE>({
  dictionary: FRENCH,
  locale: 'fr'
})

describe('plural', () => {
  it('[plural] pays French its singular at zero, where English is already plural', () => {
    expect(inEnglish('score', { count: 0 })).toBe('0 points')
    expect(inFrench('score', { count: 0 })).toBe('0 point')
  })

  it('[plural] agrees with both locales at one and at two', () => {
    expect(inEnglish('score', { count: 1 })).toBe('1 point')
    expect(inEnglish('score', { count: 2 })).toBe('2 points')
    expect(inFrench('score', { count: 1 })).toBe('1 point')
    expect(inFrench('score', { count: 2 })).toBe('2 points')
  })

  it('[plural] takes a declared zero form over the category the locale would pick', () => {
    expect(inEnglish('waiting', { count: 0 })).toBe('Nobody yet')
    expect(inFrench('waiting', { count: 0 })).toBe('Personne pour l’instant')
  })

  it('[plural] drops the count where the form asks for it, and nowhere else', () => {
    expect(inEnglish('waiting', { count: 3 })).toBe('3 have answered')
  })

  it('[plural] substitutes a placeholder the selected form carries', () => {
    expect(inEnglish('inbox', { count: 1, sender: 'Ada' })).toBe(
      '1 message from Ada'
    )
    expect(inFrench('inbox', { count: 4, sender: 'Ada' })).toBe(
      '4 messages de Ada'
    )
  })
})

describe('formatting', () => {
  it('[number] prints a decimal the way the locale writes one', () => {
    expect(inEnglish('round.clip', { seconds: 1.5 })).toBe('1.5s')
    expect(inFrench('round.clip', { seconds: 1.5 })).toBe('1,5 s')
  })

  it('[list] joins with the locale’s own conjunction', () => {
    expect(inEnglish('round.genres', { genres: ['rock', 'jazz', 'pop'] })).toBe(
      'Playing rock, jazz, and pop'
    )
    expect(inFrench('round.genres', { genres: ['rock', 'jazz', 'pop'] })).toBe(
      'On joue rock, jazz et pop'
    )
  })

  it('[relative] names a day the way the locale names it', () => {
    expect(inEnglish('posted', { when: -1 })).toBe('Posted yesterday')
    expect(inFrench('posted', { when: -1 })).toBe('Publié hier')
    expect(inEnglish('posted', { when: -3 })).toBe('Posted 3 days ago')
    expect(inFrench('posted', { when: 2 })).toBe('Publié après-demain')
  })

  it('[displayname] writes a language code as a word, in the reading locale', () => {
    expect(inEnglish('spokenIn', { language: 'fr' })).toBe('Spoken in French')
    expect(inFrench('spokenIn', { language: 'en' })).toBe('Parlé en anglais')
  })

  it('[enum] reads the member out of the locale’s own map', () => {
    expect(inEnglish('winner', { place: 'first' })).toBe('The winner takes it')
    expect(inFrench('winner', { place: 'second' })).toBe('C’est le deuxième')
  })

  it('[enum] substitutes a placeholder the selected member carries', () => {
    expect(inEnglish('standing', { name: 'Ada', place: 'first' })).toBe(
      'Ada wins'
    )
    expect(inFrench('standing', { name: 'Ada', place: 'second' })).toBe(
      'Ada a frôlé la victoire'
    )
  })
})

describe('substitution', () => {
  it('[translate] interpolates an untyped placeholder as text', () => {
    expect(inEnglish('menu.built', { build: 'b0c4dfb' })).toBe('Build b0c4dfb')
  })

  it('[translate] returns a message with no placeholders untouched', () => {
    expect(inFrench('round.none')).toBe('Personne n’a trouvé')
  })

  it('[translate] substitutes every occurrence, not only the first', () => {
    expect(inEnglish('echo', { name: 'Ada' })).toBe('Ada, hello Ada')
  })

  it('[translate] writes a value out rather than reading it back as a placeholder', () => {
    expect(inEnglish('menu.built', { build: '{seconds:number}' })).toBe(
      'Build {seconds:number}'
    )
  })

  it('[translate] holds that rule inside a form it expanded', () => {
    expect(inEnglish('inbox', { count: 2, sender: '{count:plural}' })).toBe(
      '2 messages from {count:plural}'
    )
  })
})

describe('rich', () => {
  it('[rich] cuts the sentence at its spans and hands each one to its function', () => {
    expect(
      inEnglish.rich('terms', { link: (text) => `[${text}]` })
    ).toStrictEqual(['Read the ', '[terms]', ' before playing'])
  })

  it('[rich] lets a span become something that is not text', () => {
    expect(
      inFrench.rich('welcome', {
        count: 3,
        name: 'Ada',
        strong: (text) => ({ bold: text })
      })
    ).toStrictEqual(['Bienvenue ', { bold: 'Ada' }, ', tu as 3 points'])
  })

  it('[rich] substitutes inside a span as well as around it', () => {
    expect(
      inEnglish.rich('welcome', {
        count: 1,
        name: 'Ada',
        strong: (text) => text.toUpperCase()
      })
    ).toStrictEqual(['Welcome ', 'ADA', ', you have 1 points'])
  })

  it('[rich] writes a value out rather than reading it back as a span', () => {
    expect(
      inEnglish.rich('welcome', {
        count: 1,
        name: '<strong>Ada</strong>',
        strong: (text) => `[${text}]`
      })
    ).toStrictEqual([
      'Welcome ',
      '[<strong>Ada</strong>]',
      ', you have 1 points'
    ])
  })

  it('[rich] returns a message with no span as a single piece', () => {
    expect(inEnglish.rich('round.none', {})).toStrictEqual(['Nobody got it'])
  })
})

describe('a message missing the forms its placeholder needs', () => {
  const LOOSE = { impact: 'This impacts {count:plural}' as const }

  const translate = createTranslator<typeof LOOSE>({
    dictionary: LOOSE,
    locale: 'en'
  })

  it('[translate] falls back to the count, formatted by nobody', () => {
    expect(translate('impact', { count: 3 })).toBe('This impacts 3')
  })
})

describe('a plural form that names its own placeholder', () => {
  const LOOPING = defineDictionary({
    left: defineTranslation('{count:plural}', {
      plural: { count: { other: '{count:plural} left' } }
    })
  })

  const translate = createTranslator<typeof LOOPING>({
    dictionary: LOOPING,
    locale: 'en'
  })

  it('[plural] stops rather than expanding the same form forever', () => {
    expect(translate('left', { count: 2 })).toBe('{count:plural} left')
  })
})

/**
 * A dictionary fetched at runtime is only as faithful to the reference as the
 * file that was deployed: these read the reference's keys out of one that
 * drifted from it.
 */
const drifted = (json: string) =>
  createTranslator<typeof REFERENCE>({
    dictionary: JSON.parse(json),
    locale: 'en'
  })

describe('a key the dictionary does not hold', () => {
  it('[missing-key] prints the key where the dictionary has nothing', () => {
    expect(drifted('{}')('round.none')).toBe('round.none')
  })

  it('[missing-key] prints the key where a message stands in place of a branch', () => {
    expect(drifted('{"round": "Round"}')('round.none')).toBe('round.none')
  })

  it('[missing-key] prints the key where a branch stands in place of a message', () => {
    expect(drifted('{"round": {"none": {}}}')('round.none')).toBe('round.none')
  })

  it('[missing-key] hands rich the key as its only piece', () => {
    expect(drifted('{}').rich('terms', { link: () => 'link' })).toEqual([
      'terms'
    ])
  })
})

describe('a placeholder given no value', () => {
  it('[missing-placeholder] leaves the placeholder standing and fills the rest', () => {
    const translate = drifted('{"echo": "{name} meets {friend}"}')

    expect(translate('echo', { name: 'Ada' })).toBe('Ada meets {friend}')
  })

  it('[missing-placeholder] reads a defined translation called with no values', () => {
    const translate = drifted('{"round": {"none": ["Nobody got it", {}]}}')

    expect(translate('round.none')).toBe('Nobody got it')
  })
})

describe('a value of the wrong type', () => {
  it.each(['date', 'list', 'number', 'plural', 'relative'])(
    '[wrong-type] leaves {name:%s} standing for a string',
    (type) => {
      const translate = drifted(`{"echo": "Hi {name:${type}}"}`)

      expect(translate('echo', { name: 'Ada' })).toBe(`Hi {name:${type}}`)
    }
  )

  it.each(['displayname', 'enum'])(
    '[wrong-type] leaves {seconds:%s} standing for a number',
    (type) => {
      const translate = drifted(`{"round": {"clip": "{seconds:${type}}"}}`)

      expect(translate('round.clip', { seconds: 3 })).toBe(`{seconds:${type}}`)
    }
  )

  it('[wrong-type] leaves an enum standing when the value names no member', () => {
    const translate = drifted('{"echo": "{name:enum}"}')

    expect(translate('echo', { name: 'third' })).toBe('{name:enum}')
  })

  it('[wrong-type] leaves a relative time standing when it declares no unit', () => {
    const translate = drifted('{"round": {"clip": "{seconds:relative}"}}')

    expect(translate('round.clip', { seconds: 3 })).toBe('{seconds:relative}')
  })

  it('[wrong-type] leaves a display name standing when it declares no kind', () => {
    const translate = drifted('{"echo": "{name:displayname}"}')

    expect(translate('echo', { name: 'fr' })).toBe('{name:displayname}')
  })
})

const AT = { seen: 'Seen {at:date}' as const }

describe('a value of the right type that the locale cannot print', () => {
  it('[unprintable] leaves an invalid date standing rather than throwing', () => {
    const translate = createTranslator<typeof AT>({
      dictionary: AT,
      locale: 'en'
    })

    expect(translate('seen', { at: new Date(Number.NaN) })).toBe(
      'Seen {at:date}'
    )
  })

  it('[unprintable] leaves a relative time standing for a count that is not finite', () => {
    expect(inEnglish('posted', { when: Number.POSITIVE_INFINITY })).toBe(
      'Posted {when:relative}'
    )
  })

  it('[unprintable] leaves a display name standing for a code that is no language', () => {
    expect(inEnglish('spokenIn', { language: 'not a language' })).toBe(
      'Spoken in {language:displayname}'
    )
  })
})

describe('rich text with malformed spans', () => {
  const link = (children: string) => ({ link: children })

  it('[rich-malformed] prints an unclosed tag as text', () => {
    const translate = drifted(
      '{"terms": "Read the <link>terms before playing"}'
    )

    expect(translate.rich('terms', { link })).toEqual([
      'Read the <link>terms before playing'
    ])
  })

  it('[rich-malformed] prints tags that do not pair as text', () => {
    const translate = drifted('{"terms": "Read the <link>terms</strong>"}')

    expect(translate.rich('terms', { link })).toEqual([
      'Read the <link>terms</strong>'
    ])
  })

  it('[rich-malformed] hands a span no function was given for back as its text', () => {
    const translate = drifted('{"terms": "Read the <strong>terms</strong>"}')

    expect(translate.rich('terms', { link })).toEqual(['Read the ', 'terms'])
  })

  it('[rich-malformed] hands an outer span the inner one as text, never nested', () => {
    const translate = drifted('{"terms": "<link><link>terms</link></link>"}')

    expect(translate.rich('terms', { link })).toEqual([
      { link: '<link>terms' },
      '</link>'
    ])
  })

  it('[rich] adds no empty piece around a span that is the whole message', () => {
    const translate = drifted('{"terms": "<link>terms</link>"}')

    expect(translate.rich('terms', { link })).toEqual([{ link: 'terms' }])
  })

  it('[rich] reads a defined translation', () => {
    const translate = drifted(
      '{"terms": ["<link>{count:number}</link> terms", {}]}'
    )

    expect(translate.rich('terms', { link })).toEqual([
      { link: '{count:number}' },
      ' terms'
    ])
  })
})

const MOMENTS = defineDictionary({
  clock: defineTranslation('Opens at {at:date}', {
    date: { at: { timeStyle: 'short' } }
  }),
  day: defineTranslation('Played on {at:date}', {
    date: { at: { dateStyle: 'long', timeZone: 'Asia/Tokyo' } }
  }),
  seen: 'Seen {at:date}',
  stamped: defineTranslation('Stamped {at:date}', {
    date: { at: { dateStyle: 'long', hour: 'numeric' } }
  })
})

const moments = createTranslator<typeof MOMENTS>({
  dictionary: MOMENTS,
  locale: 'en'
})

const translateUnchecked = (key: string, values: Record<string, unknown>) =>
  Reflect.apply(moments, undefined, [key, values])

describe('a Temporal value', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('[date] shows an instant in the time zone the dictionary names', () => {
    expect(
      moments('day', { at: Temporal.Instant.from('2026-03-01T23:30:00Z') })
    ).toBe('Played on March 2, 2026')
  })

  it('[date] keeps a plain date on its own day whatever the time zone', () => {
    expect(moments('day', { at: Temporal.PlainDate.from('2026-03-01') })).toBe(
      'Played on March 1, 2026'
    )
  })

  it('[date] keeps a plain date-time on its wall clock whatever the time zone', () => {
    expect(
      moments('day', { at: Temporal.PlainDateTime.from('2026-03-01T23:30') })
    ).toBe('Played on March 1, 2026')
  })

  it('[date] formats a plain time under a time style', () => {
    expect(moments('clock', { at: Temporal.PlainTime.from('09:05') })).toBe(
      'Opens at 9:05 AM'
    )
  })

  it('[date] leaves a plain date standing under a time style rather than throwing', () => {
    expect(
      moments('clock', { at: Temporal.PlainDate.from('2026-03-01') })
    ).toBe('Opens at {at:date}')
  })

  it.each([
    ['zoned date-time', Temporal.ZonedDateTime.from('2026-03-01T23:30[UTC]')],
    ['year and month', Temporal.PlainYearMonth.from('2026-03')],
    ['month and day', Temporal.PlainMonthDay.from('03-01')],
    ['duration', Temporal.Duration.from({ hours: 1 })]
  ])(
    '[date] leaves a %s standing, which the formatter cannot print',
    (_, at) => {
      expect(translateUnchecked('seen', { at })).toBe('Seen {at:date}')
    }
  )

  it('[date] leaves options the formatter cannot combine standing rather than throwing', () => {
    expect(moments('stamped', { at: new Date(0) })).toBe('Stamped {at:date}')
  })

  it('[date] still formats a Date on a runtime without Temporal', () => {
    const at = Temporal.Instant.from('2026-03-01T12:00:00Z')
    vi.stubGlobal('Temporal', undefined)

    expect(moments('day', { at: new Date('2026-03-01T12:00:00Z') })).toBe(
      'Played on March 1, 2026'
    )
    expect(moments('day', { at })).toBe('Played on {at:date}')
  })
})

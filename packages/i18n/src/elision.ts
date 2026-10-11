/**
 * Rewrites the words of a message that a value would make elide, before the
 * value goes in: French writes "la fiche d’Emma", not "de Emma", and the
 * dictionary cannot know which names a sentence will receive.
 */
export type Elision = (
  message: string,
  values: Readonly<Record<string, unknown>>
) => string

const APOSTROPHE = '’'

const FRENCH_ELIDING_WORDS = [
  'de',
  'jusque',
  'la',
  'le',
  'lorsque',
  'puisque',
  'que'
] as const

const WORD_BEFORE_PLAIN_PLACEHOLDER = new RegExp(
  `(?<!\\p{L})(${FRENCH_ELIDING_WORDS.join('|')}) \\{(\\w+)\\}`,
  'giu'
)

const VOWEL = /^[aeiouàâäéèêëîïôöùûüœæ]/iu

const MUTE_H_THEN_VOWEL = /^h[aeiouyàâäéèêëîïôöùûüœæ]/iu

const Y_THEN_CONSONANT = /^y[^aeiouyàâäéèêëîïôöùûüœæ]/iu

/**
 * Whether a French word elides the word before it. An initial "h" counts as
 * mute — "d’Henri", "d’Hélène" — since nothing in a name says when it is
 * aspirated. "Y" elides before a consonant ("d’Yves", "d’Yvonne") and not before
 * a vowel ("de Yann"), where it is heard as a consonant.
 */
const startsWithElidingSound = (word: string): boolean =>
  VOWEL.test(word) ||
  MUTE_H_THEN_VOWEL.test(word) ||
  Y_THEN_CONSONANT.test(word)

/** "de" → "d", "que" → "qu", "La" → "L": every eliding word drops its final "e" or "a". */
const elidedForm = (word: string): string => word.slice(0, -1)

const frenchElision: Elision = (message, values) =>
  message.replace(
    WORD_BEFORE_PLAIN_PLACEHOLDER,
    (written, word: string, name: string) => {
      const value = values[name]

      return typeof value === 'string' && startsWithElidingSound(value)
        ? `${elidedForm(word)}${APOSTROPHE}{${name}}`
        : written
    }
  )

const noElision: Elision = (message) => message

/**
 * Only a plain `{name}` placeholder elides: a typed one is a number, a date or
 * a list, written by `Intl` rather than read as a word.
 */
export const elisionFor = (locale: string): Elision =>
  new Intl.Locale(locale).language === 'fr' ? frenchElision : noElision

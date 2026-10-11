import { describe, expect, it } from 'vitest'

import { defineDictionary } from './dictionary.ts'
import { createTranslator } from './translator.ts'

const FRENCH = defineDictionary({
  count: '{count:number} enfants de {name}',
  path: 'Le chemin de {from} à {to}',
  sheet: 'Fiche de {name}',
  since: 'Depuis que {name} est là',
  until: 'jusque {name}',
  whose: 'C’est le portrait de {name}, sur sa vignette.'
})

const ENGLISH = defineDictionary({ odd: 'de {name}' })

const translateFrench = createTranslator<typeof FRENCH>({
  dictionary: FRENCH,
  locale: 'fr'
})

describe('French elision before a value', () => {
  it.each([
    ['Emma', 'Fiche d’Emma'],
    ['Anne', 'Fiche d’Anne'],
    ['Inès', 'Fiche d’Inès'],
    ['Émile', 'Fiche d’Émile'],
    ['Odile', 'Fiche d’Odile'],
    ['Ulysse', 'Fiche d’Ulysse'],
    ['Hélène', 'Fiche d’Hélène'],
    ['Henri', 'Fiche d’Henri'],
    ['Yves', 'Fiche d’Yves'],
    ['Yvonne', 'Fiche d’Yvonne']
  ])('elides "de" before %s', (name, sentence) => {
    expect(translateFrench('sheet', { name })).toBe(sentence)
  })

  it.each([
    ['Yann', 'Fiche de Yann'],
    ['Louis', 'Fiche de Louis'],
    ['René', 'Fiche de René']
  ])('keeps "de" before %s', (name, sentence) => {
    expect(translateFrench('sheet', { name })).toBe(sentence)
  })

  it('elides each placeholder of a sentence on its own', () => {
    expect(translateFrench('path', { from: 'Anne', to: 'Louis' })).toBe(
      'Le chemin d’Anne à Louis'
    )
  })

  it('elides "que" and "jusque"', () => {
    expect(translateFrench('since', { name: 'Inès' })).toBe(
      'Depuis qu’Inès est là'
    )
    expect(translateFrench('until', { name: 'Aix' })).toBe('jusqu’Aix')
  })

  it('leaves the dictionary’s own words alone', () => {
    expect(translateFrench('whose', { name: 'Auguste' })).toBe(
      'C’est le portrait d’Auguste, sur sa vignette.'
    )
  })

  it('leaves a typed placeholder alone', () => {
    expect(translateFrench('count', { count: 8, name: 'Anne' })).toBe(
      '8 enfants d’Anne'
    )
  })

  it('elides inside a rich message', () => {
    expect(translateFrench.rich('sheet', { name: 'Emma' }).join('')).toBe(
      'Fiche d’Emma'
    )
  })

  it('touches no other language', () => {
    const translateEnglish = createTranslator<typeof ENGLISH>({
      dictionary: ENGLISH,
      locale: 'en'
    })

    expect(translateEnglish('odd', { name: 'Emma' })).toBe('de Emma')
  })
})

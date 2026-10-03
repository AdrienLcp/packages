import { describe, expect, it } from 'vitest'

import { moduleExportsOf } from './module-exports.ts'

const exportsOfEntry = (files: Map<string, string>) =>
  moduleExportsOf({
    entryPath: 'src/index.js',
    readSource: (path) => files.get(path) ?? null
  })

const singleFile = (source: string) =>
  exportsOfEntry(new Map([['src/index.ts', source]]))

describe('moduleExportsOf', () => {
  it('[module-exports] tells functions, hooks, components, types and constants apart', () => {
    const source = [
      'export const parse = (text: string) => text',
      'export function format() {}',
      'export const useThing = () => 1',
      'export function useOther() {}',
      'export const Button: FC<Props> = () => null',
      'export function Panel() {}',
      'export type Options = { a: 1 }',
      'export interface Shape {}',
      'export const MAX_SIZE = 3',
      'export enum Level {}'
    ].join('\n')

    expect(singleFile(source).map(({ kind, name }) => [name, kind])).toEqual([
      ['parse', 'function'],
      ['format', 'function'],
      ['useThing', 'hook'],
      ['useOther', 'hook'],
      ['Button', 'component'],
      ['Panel', 'component'],
      ['Options', 'type'],
      ['Shape', 'type'],
      ['MAX_SIZE', 'constant'],
      ['Level', 'constant']
    ])
  })

  it('[module-exports] reads async, generic and function-expression values as functions', () => {
    const source = [
      'export const load = async () => 1',
      'export const identity = <T,>(value: T) => value',
      'export const create = function () {}'
    ].join('\n')

    expect(singleFile(source).map(({ kind }) => kind)).toEqual([
      'function',
      'function',
      'function'
    ])
  })

  it('[module-exports] reads a PascalCase object as a constant, not a component', () => {
    expect(singleFile('export const Result = { ok: 1 }')).toEqual([
      { kind: 'constant', name: 'Result', summary: null }
    ])
  })

  it('[module-exports] takes the first sentence of the doc comment as the summary', () => {
    const source = [
      '/**',
      ' * Parses the text. It never throws.',
      ' */',
      'export const parse = (text: string) => text'
    ].join('\n')

    expect(singleFile(source)).toEqual([
      { kind: 'function', name: 'parse', summary: 'Parses the text.' }
    ])
  })

  it('[module-exports] leaves the summary empty when nothing documents the export', () => {
    expect(singleFile('export const parse = () => 1')).toEqual([
      { kind: 'function', name: 'parse', summary: null }
    ])
  })

  it('[module-exports] ignores what is not exported', () => {
    expect(singleFile('const hidden = () => 1\nfunction other() {}')).toEqual(
      []
    )
  })

  it('[module-exports] follows export * into the files it names', () => {
    const files = new Map([
      [
        'src/index.ts',
        "export const first = () => 1\nexport * from './more.js'"
      ],
      ['src/more.ts', 'export const second = () => 2']
    ])

    expect(exportsOfEntry(files).map(({ name }) => name)).toEqual([
      'first',
      'second'
    ])
  })

  it('[module-exports] resolves an export * against the file that holds it', () => {
    const files = new Map([
      ['src/index.ts', "export * from './nested/index.js'"],
      ['src/nested/index.ts', "export * from '../shared.js'"],
      ['src/shared.tsx', 'export const Deep = () => null']
    ])

    expect(exportsOfEntry(files)).toEqual([
      { kind: 'component', name: 'Deep', summary: null }
    ])
  })

  it('[module-exports] survives files that re-export each other', () => {
    const files = new Map([
      ['src/index.ts', "export * from './a.js'\nexport const root = () => 1"],
      ['src/a.ts', "export * from './index.js'\nexport const leaf = () => 1"]
    ])

    expect(exportsOfEntry(files).map(({ name }) => name)).toEqual([
      'root',
      'leaf'
    ])
  })

  it('[module-exports] skips an export * whose file is not there', () => {
    const files = new Map([
      ['src/index.ts', "export * from './gone.js'\nexport const kept = () => 1"]
    ])

    expect(exportsOfEntry(files).map(({ name }) => name)).toEqual(['kept'])
  })

  it('[module-exports] finds nothing when the entry point is not there', () => {
    expect(exportsOfEntry(new Map())).toEqual([])
  })

  it('[module-exports] lets a value outrank a type of the same name, whichever comes first', () => {
    const typeFirst = singleFile(
      'export type Result = { a: 1 }\nexport const Result = { ok: 1 }'
    )
    const valueFirst = singleFile(
      'export const Result = { ok: 1 }\nexport type Result = { a: 1 }'
    )

    expect([typeFirst, valueFirst]).toEqual([
      [{ kind: 'constant', name: 'Result', summary: null }],
      [{ kind: 'constant', name: 'Result', summary: null }]
    ])
  })

  it('[module-exports] keeps the summary of whichever same-name declaration has one', () => {
    const source = [
      'export type Result = { a: 1 }',
      '/** The value. */',
      'export const Result = { ok: 1 }'
    ].join('\n')

    expect(singleFile(source)).toEqual([
      { kind: 'constant', name: 'Result', summary: 'The value.' }
    ])
  })
})

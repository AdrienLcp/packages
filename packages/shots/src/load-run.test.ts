import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadRun } from './load-run.ts'
import {
  makeScratchFolder,
  removeScratchFolder
} from './scratch-folder.fixture.ts'

let folder = ''

beforeEach(async () => {
  folder = await makeScratchFolder()
})

afterEach(async () => {
  await removeScratchFolder(folder)
})

const write = (name: string, content: unknown) =>
  writeFile(
    join(folder, name),
    typeof content === 'string' ? content : JSON.stringify(content)
  )

const run = (argv: readonly string[]) =>
  loadRun({ argv, workingFolder: folder })

describe('loadRun', () => {
  it('[load-run] reads shots.config.json from the working folder, flags over it', async () => {
    await write('shots.config.json', {
      mocks: 'mocks.json',
      origin: 'http://localhost:5186',
      widths: [360, 1440]
    })
    await write('mocks.json', [{ json: { ok: true }, url: '**/api/**' }])

    const loaded = await run(['/settings', '--widths', '320'])

    expect(loaded.status === 'success' && loaded.data).toMatchObject({
      kind: 'shoot',
      mocks: [{ url: '**/api/**' }],
      settings: {
        mocks: join(folder, 'mocks.json'),
        origin: 'http://localhost:5186',
        paths: ['/settings'],
        widths: [320]
      }
    })
  })

  it('[load-run] reads mocks from a module default export', async () => {
    await write('mocks.mjs', 'export default [{ url: "**/x", hang: true }]')

    const loaded = await run([
      '--origin',
      'http://a.test',
      '--mocks',
      'mocks.mjs'
    ])

    expect(loaded.status === 'success' && loaded.data).toMatchObject({
      mocks: [{ response: { kind: 'hang' }, url: '**/x' }]
    })
  })

  it('[load-run] runs from flags alone when there is no config file', async () => {
    const loaded = await run(['--origin', 'http://a.test'])

    expect(loaded.status === 'success' && loaded.data).toMatchObject({
      kind: 'shoot',
      mocks: [],
      settings: { origin: 'http://a.test', out: join(folder, 'shots') }
    })
  })

  it('[load-run] answers help before reading any file', async () => {
    expect(await run(['--help', '--config', 'missing.json'])).toEqual({
      data: { kind: 'help' },
      status: 'success'
    })
  })

  it('[load-run] fails on a config file that is named but missing', async () => {
    expect(await run(['--config', 'missing.json'])).toEqual({
      error: { code: 'unreadable_file', path: join(folder, 'missing.json') },
      status: 'failure'
    })
  })

  it.each([
    ['not json', '{ origin: '],
    ['not an object', '["http://a.test"]']
  ])(
    '[load-run] fails on a config file that is %s',
    async (_reason, content) => {
      await write('shots.config.json', content)

      expect(await run([])).toEqual({
        error: {
          code: 'malformed_file',
          path: join(folder, 'shots.config.json')
        },
        status: 'failure'
      })
    }
  )

  it('[load-run] fails on a flag the settings refuse', async () => {
    expect(
      await run(['--origin', 'http://a.test', '--themes', 'sepia'])
    ).toEqual({
      error: {
        code: 'invalid_setting',
        setting: 'themes',
        source: 'arguments'
      },
      status: 'failure'
    })
  })

  it('[load-run] fails on an unknown flag', async () => {
    expect(await run(['--nope'])).toMatchObject({
      error: { code: 'unknown_option' }
    })
  })

  it('[load-run] fails without an origin', async () => {
    expect(await run([])).toEqual({
      error: { code: 'missing_origin' },
      status: 'failure'
    })
  })

  it('[load-run] names the mock a mocks file gets wrong', async () => {
    await write('mocks.json', [{ abort: true, url: '**/a' }, { url: '**/b' }])

    expect(
      await run(['--origin', 'http://a.test', '--mocks', 'mocks.json'])
    ).toEqual({
      error: {
        code: 'invalid_mock',
        index: 1,
        path: join(folder, 'mocks.json')
      },
      status: 'failure'
    })
  })

  it.each([
    ['mocks.json', '{"url": "**/a"}'],
    ['mocks.mjs', 'export const mocks = []']
  ])(
    '[load-run] fails on a mocks file %s that holds no list',
    async (name, content) => {
      await write(name, content)

      expect(await run(['--origin', 'http://a.test', '--mocks', name])).toEqual(
        {
          error: { code: 'malformed_file', path: join(folder, name) },
          status: 'failure'
        }
      )
    }
  )

  it('[load-run] fails on a mocks module that cannot load', async () => {
    expect(
      await run(['--origin', 'http://a.test', '--mocks', 'missing.mjs'])
    ).toEqual({
      error: { code: 'unreadable_file', path: join(folder, 'missing.mjs') },
      status: 'failure'
    })
  })
})

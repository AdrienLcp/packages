import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { runCli } from './run-cli.ts'
import {
  makeScratchFolder,
  removeScratchFolder
} from './scratch-folder.fixture.ts'
import { SETTINGS_DEFAULTS, type ShotsSettings } from './shots-settings.ts'
import { takeShots } from './take-shots.ts'

const PINNED_MS = Temporal.Instant.from(
  '2026-10-03T12:00:00Z'
).epochMilliseconds
const BROWSER_TIMEOUT_MS = 60_000
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]

const FACT_PAGE = `<!doctype html>
<meta name="viewport" content="width=device-width">
<body style="margin: 0">
<script>
  const facts = {
    aborted: () => fetch('/api/gone').then(() => false, () => true),
    answered: () => fetch('/api/word').then((response) => response.text()).then((text) => text === 'yes'),
    dark: () => matchMedia('(prefers-color-scheme: dark)').matches,
    french: () => navigator.language === 'fr',
    hung: () => Promise.race([
      fetch('/api/never').then(() => false),
      new Promise((resolve) => setTimeout(() => resolve(true), 300))
    ]),
    mocked: () => fetch('/api/fact').then((response) => response.json()).then((body) => body.mocked),
    pinned: () => Date.now() === ${PINNED_MS},
    seeded: () => localStorage.getItem('app.log') === '[]' && localStorage.getItem('app.locale') === 'fr',
    silent: () => localStorage.getItem('app.volume') === '0'
  }
  const fact = new URLSearchParams(location.search).get('fact')
  Promise.resolve(facts[fact]?.()).then((holds) => {
    if (!holds) return
    const witness = document.createElement('div')
    witness.className = fact
    witness.style.cssText = 'width: 1000px; height: 10px'
    document.body.append(witness)
  })
</script>`

const FACTS = [
  'aborted',
  'answered',
  'dark',
  'french',
  'hung',
  'mocked',
  'pinned',
  'seeded',
  'silent'
]

const startServer = (): Promise<Server> =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      if (request.url === '/api/fact') {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end('{"mocked":false}')
        return
      }
      response.writeHead(200, { 'content-type': 'text/html' })
      response.end(FACT_PAGE)
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
  })

const originOf = (server: Server): string => {
  const address = server.address()
  return typeof address === 'object' && address !== null
    ? `http://127.0.0.1:${address.port}`
    : ''
}

let server: Server
let origin = ''
let out = ''

beforeAll(async () => {
  server = await startServer()
  origin = originOf(server)
})

afterAll(() => {
  server.close()
})

beforeEach(async (context) => {
  out = await makeScratchFolder()
  context.onTestFinished(() => removeScratchFolder(out))
})

const settingsWith = (overrides: Partial<ShotsSettings>): ShotsSettings => ({
  ...SETTINGS_DEFAULTS,
  origin,
  out,
  settleMs: 0,
  widths: [320],
  ...overrides
})

describe('takeShots', () => {
  it(
    '[take-shots] opens each page on its locale, theme, fixtures, first matching mock of each kind, silent volume and pinned clock',
    async () => {
      const shots = await takeShots({
        mocks: [
          {
            response: { json: { mocked: true }, kind: 'json', status: 200 },
            url: '**/api/fact'
          },
          {
            response: { json: { mocked: false }, kind: 'json', status: 200 },
            url: '**/api/fact'
          },
          {
            response: {
              body: 'yes',
              contentType: 'text/plain',
              kind: 'body',
              status: 200
            },
            url: '**/api/word'
          },
          { response: { kind: 'abort' }, url: '**/api/gone' },
          { response: { kind: 'hang' }, url: '**/api/never' }
        ],
        settings: settingsWith({
          localeStorageKey: 'app.locale',
          locales: ['fr'],
          paths: [...FACTS, 'none'].map((fact) => `/?fact=${fact}`),
          storage: { 'app.log': '[]' },
          themes: ['dark'],
          time: PINNED_MS,
          volumeKeys: ['app.volume']
        })
      })

      expect(shots.status).toBe('success')
      const reports = shots.status === 'success' ? shots.data : []
      const witnesses = reports.map(({ fileName, outcome }) => [
        fileName,
        outcome.status === 'taken' && outcome.overflow.status === 'overflows'
          ? outcome.overflow.culprits.map(({ label }) => label)
          : outcome
      ])

      expect(witnesses).toEqual([
        ...FACTS.map((fact) => [
          `home_fact_${fact}.fr.dark.320.png`,
          [`div.${fact}`]
        ]),
        [
          'home_fact_none.fr.dark.320.png',
          { overflow: { status: 'fits' }, status: 'taken' }
        ]
      ])

      const png = await readFile(join(out, 'home_fact_none.fr.dark.320.png'))
      expect([...png.subarray(0, 4)]).toEqual(PNG_SIGNATURE)
    },
    BROWSER_TIMEOUT_MS
  )

  it(
    '[take-shots] reports a page that never loads and goes on',
    async () => {
      const closed = await startServer()
      const closedOrigin = originOf(closed)
      closed.close()

      const shots = await takeShots({
        mocks: [],
        settings: settingsWith({
          origin: closedOrigin,
          paths: ['/', '/settings']
        })
      })

      expect(shots).toMatchObject({
        data: [
          { fileName: 'home.320.png', outcome: { reason: 'unreachable' } },
          { fileName: 'settings.320.png', outcome: { reason: 'unreachable' } }
        ],
        status: 'success'
      })
    },
    BROWSER_TIMEOUT_MS
  )

  it(
    '[take-shots] reports a PNG it cannot write and goes on',
    async () => {
      await mkdir(join(out, 'home.320.png'))

      const shots = await takeShots({
        mocks: [],
        settings: settingsWith({ paths: ['/', '/settings'] })
      })

      expect(shots).toMatchObject({
        data: [
          { fileName: 'home.320.png', outcome: { reason: 'unwritable' } },
          { fileName: 'settings.320.png', outcome: { status: 'taken' } }
        ],
        status: 'success'
      })
    },
    BROWSER_TIMEOUT_MS
  )

  it('[take-shots] stops before launching when the output folder cannot be made', async () => {
    const file = join(out, 'a-file')
    await writeFile(file, '')

    expect(
      await takeShots({
        mocks: [],
        settings: settingsWith({ out: join(file, 'shots') })
      })
    ).toEqual({ error: 'out_unwritable', status: 'failure' })
  })
})

describe('runCli', () => {
  const runWith = async (argv: readonly string[]) => {
    const lines: { stream: 'error' | 'info'; text: string }[] = []
    const exitCode = await runCli({
      argv,
      output: {
        error: (text) => lines.push({ stream: 'error', text }),
        info: (text) => lines.push({ stream: 'info', text })
      },
      workingFolder: out
    })
    return { exitCode, lines }
  }

  it(
    '[run-cli] shoots from the command line and flags the overflowing page',
    async () => {
      const { exitCode, lines } = await runWith([
        '/?fact=dark',
        '--origin',
        origin,
        '--widths',
        '320',
        '--themes',
        'dark',
        '--settle',
        '0'
      ])

      expect(exitCode).toBe(0)
      expect(lines).toEqual([
        {
          stream: 'info',
          text: [
            `1 shot in ${join(out, 'shots')} — 1 overflowing, 0 failed`,
            '  overflow  home_fact_dark.dark.320.png  680px wider than the viewport: div.dark (+680px)'
          ].join('\n')
        }
      ])
    },
    BROWSER_TIMEOUT_MS
  )

  it('[run-cli] prints the usage on --help', async () => {
    const { exitCode, lines } = await runWith(['--help'])

    expect(exitCode).toBe(0)
    expect(lines[0]?.text).toMatch(/^Usage: shots/)
  })

  it('[run-cli] words a settings failure and exits 2', async () => {
    expect(await runWith(['--widths', '320'])).toEqual({
      exitCode: 2,
      lines: [
        {
          stream: 'error',
          text: 'No origin: pass --origin http://localhost:5173 or set "origin" in shots.config.json.'
        }
      ]
    })
  })

  it('[run-cli] words a run that cannot start and exits 1', async () => {
    const file = join(out, 'a-file')
    await writeFile(file, '')

    expect(
      await runWith(['--origin', origin, '--out', join(file, 'shots')])
    ).toEqual({
      exitCode: 1,
      lines: [
        { stream: 'error', text: 'The output folder could not be created.' }
      ]
    })
  })
})

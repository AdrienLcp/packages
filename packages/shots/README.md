# @adrienlcp/shots

Screenshots of a running app: every path, at every width, in every locale and
theme you name, in a Chromium that cannot make a sound. Each page wider than
its viewport is flagged in the summary, with the elements that stick out.

```bash
pnpm add -D @adrienlcp/shots playwright
pnpm exec playwright install chromium
```

`playwright` is a peer dependency: the project picks its version, and the
Chromium that goes with it.

## Running it

With the dev server up:

```bash
pnpm exec shots / /settings --origin http://localhost:5173 --widths 320,360
```

```text
4 shots in C:\git\app\shots — 1 overflowing, 0 failed
  overflow  settings.320.png  24px wider than the viewport: table.log (+24px)
```

The PNGs are named path, locale, theme, width — `settings.fr.dark.360.png`,
`home.320.png` for `/` — so a folder listing keeps a page's shots together. A
locale or theme the run does not vary stays out of the name.

The exit code is `1` when a shot is missing (a page that did not load), `2` when
the settings are wrong, and `0` otherwise: an overflow is reported, not fatal.

`shots --help` lists every flag.

## A config file

`shots.config.json` in the working folder is read when present, or any file
through `--config`. Flags override it; paths in it are relative to it.

```json
{
  "origin": "http://localhost:5186",
  "paths": ["/", "/settings", "/journal?week=40"],
  "widths": [320, 360, 1440],
  "locales": ["en", "fr"],
  "localeStorageKey": "app.locale",
  "themes": ["light", "dark"],
  "themeStorageKey": "app.theme",
  "volumeKeys": ["app.volume"],
  "storage": { "app.log.v1": { "entries": [] } },
  "mocks": "shots.mocks.json",
  "time": "2026-10-03T12:00:00Z",
  "timezone": "Europe/Paris",
  "out": "shots"
}
```

| Setting | Default | What it does |
| --- | --- | --- |
| `origin` | — | The running app. Required. |
| `paths` | `["/"]` | Paths under the origin. |
| `widths` | `[360, 1440]` | Viewport widths. |
| `height` | `800` | Viewport height. |
| `locales` | none | Browser locales (`navigator.language`, `Accept-Language`), one set of shots each. |
| `localeStorageKey` | none | Where the app keeps its chosen locale: each locale is written there before load. |
| `themes` | none | `light` / `dark`, emulated through `prefers-color-scheme`, one set of shots each. |
| `themeStorageKey` | none | Where the app keeps its chosen theme: each theme is written there before load. |
| `volumeKeys` | none | Where the app keeps a volume: each key is written `0` before load. |
| `storage` | none | `localStorage` fixtures written before any page script; a value that is not text is written as JSON. |
| `mocks` | none | Route mocks, below. |
| `time` | the real clock | `Date.now()` pinned to this instant through `page.clock`. Timers keep running. |
| `timezone` | `UTC` | The browser's time zone. |
| `settleMs` | `400` | The wait after load, network idle and fonts. |
| `fullPage` | `true` | `false` shoots the first screen only (`--viewport-only`). |
| `out` | `shots` | Where the PNGs go. |

A setting the tool does not know, or a value it refuses, stops the run with a
message naming it: a typo never passes silently.

Every page runs with reduced motion, animations disabled, and service workers
blocked, so a PWA's cache never answers in place of a mock.

## Mocks

A JSON list, or a `.js` / `.mjs` module whose default export is one — for data
worth computing, like thirty days of a series. The first mock that matches a
request answers it.

```json
[
  { "url": "**/api/stats?period=7d", "json": { "visits": 120 } },
  { "url": "**/api/health", "body": "down", "status": 503 },
  { "url": "**/api/slow", "hang": true },
  { "url": "**/analytics/**", "abort": true }
]
```

`url` is a glob or URL as `page.route` reads it. `hang` never answers, for a
loading state; `abort` fails like a dropped network. `status` defaults to 200.

## Sound

Never optional, never configurable. Chromium starts with `--mute-audio`, and a
script that runs before any of the page's own:

- writes `0` under each `volumeKeys` entry, so the app reads a silent volume
  from the start rather than being turned down after the first note;
- holds every `<audio>` and `<video>` muted at volume 0, whatever the app sets
  and from the moment one loads or plays;
- keeps every `AudioContext` suspended, `resume()` included;
- speaks `speechSynthesis` at volume 0.

`Notification` is left as it is: an app that checks for it would take another
path than the one a user sees.

## From code

```ts
import { loadRun, takeShots } from '@adrienlcp/shots'

const run = await loadRun({ argv: ['--origin', 'http://localhost:5173'], workingFolder: process.cwd() })
if (run.status === 'success' && run.data.kind === 'shoot') {
  const reports = await takeShots(run.data)
}
```

`takeShots` returns a
[`Result`](https://github.com/AdrienLcp/packages/tree/main/packages/result):
one report per shot — its file name and whether it fits — or why the run could
not start (`'browser_unavailable'`, `'out_unwritable'`).

/** What `shots --help` prints. */
export const USAGE = `Usage: shots [paths…] [options]

Screenshots a running app, muted, and flags every page wider than its viewport.
Options override shots.config.json, read from the working folder when present.

  --config <file>             Settings file (JSON)
  --origin <url>              The running app, like http://localhost:5173
  --paths </a,/b>             Paths to shoot (bare words are paths too)  [/]
  --widths <320,360>          Viewport widths                            [360,1440]
  --height <px>               Viewport height                            [800]
  --locales <en,fr>           Browser locales, one set of shots each
  --locale-storage-key <key>  localStorage key the app reads its locale from
  --themes <light,dark>       Colour schemes, one set of shots each
  --theme-storage-key <key>   localStorage key the app reads its theme from
  --volume-key <key>          localStorage key of a persisted volume, set to 0
  --storage <key=value>       localStorage entry written before load
  --mocks <file>              Route mocks (.json, .js or .mjs)
  --time <instant>            Pin the clock, like 2026-10-03T12:00:00Z
  --timezone <zone>           IANA time zone                             [UTC]
  --settle <ms>               Wait after load                            [400]
  --out <folder>              Where the PNGs go                          [shots]
  --viewport-only             Shoot the first screen, not the whole page
  -h, --help                  This text

Sound never plays: Chromium runs with --mute-audio, and every page starts
with its media muted, its AudioContext suspended and its volume keys at 0.
`

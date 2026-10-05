/** The colour scheme a page is shot in, emulated through `prefers-color-scheme`. */
export type Theme = 'dark' | 'light'

/** Everything one run needs, every default filled in. */
export type ShotsSettings = {
  /** Shoot the whole scrollable page rather than the first screen. */
  fullPage: boolean
  /** The viewport height, in CSS pixels. */
  height: number
  /** BCP 47 tags; each one is a browser locale, and a file name segment. */
  locales: readonly string[]
  /** Where the app keeps its chosen locale; each locale is written there before load. */
  localeStorageKey: string | null
  /** A `.json`, `.js` or `.mjs` file of route mocks, as an absolute path. */
  mocks: string | null
  /** The running app, `http://localhost:5173`. */
  origin: string
  /** The folder the PNGs are written to, as an absolute path. */
  out: string
  /** Paths under the origin, each starting with `/`. */
  paths: readonly string[]
  /** How long a page is left to settle after it loaded, in milliseconds. */
  settleMs: number
  /** `localStorage` entries written before any page script runs. */
  storage: Readonly<Record<string, string>>
  themes: readonly Theme[]
  /** Where the app keeps its chosen theme; each theme is written there before load. */
  themeStorageKey: string | null
  /** The instant `Date.now()` is pinned to, in epoch milliseconds; `null` leaves the clock alone. */
  time: number | null
  /** The IANA zone the browser runs in. */
  timezone: string
  /** `localStorage` keys holding a persisted volume: each is written `0` before load. */
  volumeKeys: readonly string[]
  /** Viewport widths, in CSS pixels. */
  widths: readonly number[]
}

/** A setting a config file or a flag can give. */
export type SettingName = keyof ShotsSettings

/** Every setting but `origin`, which has no sensible default. */
export const SETTINGS_DEFAULTS: Omit<ShotsSettings, 'origin' | 'out'> = {
  fullPage: true,
  height: 800,
  localeStorageKey: null,
  locales: [],
  mocks: null,
  paths: ['/'],
  settleMs: 400,
  storage: {},
  themeStorageKey: null,
  themes: [],
  time: null,
  timezone: 'UTC',
  volumeKeys: [],
  widths: [360, 1440]
}

/** The folder the PNGs land in when nothing says otherwise, under the working directory. */
export const DEFAULT_OUT_FOLDER = 'shots'

/** The config file read from the working directory when no `--config` is given. */
export const DEFAULT_CONFIG_FILE = 'shots.config.json'

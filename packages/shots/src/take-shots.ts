import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { Result } from '@adrienlcp/result'
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  type Route
} from 'playwright'

import { measureOverflow } from './measure-overflow.ts'
import { type OverflowVerdict, overflowVerdictOf } from './overflow-verdict.ts'
import type { MockResponse, RouteMock } from './route-mocks.ts'
import { seedStorage } from './seed-storage.ts'
import { shotFileNameOf } from './shot-file-name.ts'
import { type ShotVariant, shotVariantsOf } from './shot-variant.ts'
import type { ShotsSettings } from './shots-settings.ts'
import { silencePage } from './silence-page.ts'
import { storageEntriesOf } from './storage-entries.ts'

/** Why one shot is missing: the page never loaded, or the PNG could not be written. */
export type ShotFailure = 'unreachable' | 'unwritable'

/** What became of one path in one variant. */
export type ShotOutcome =
  | { overflow: OverflowVerdict; status: 'taken' }
  | { reason: ShotFailure; status: 'failed' }

export type ShotReport = {
  fileName: string
  outcome: ShotOutcome
  path: string
  variant: ShotVariant
}

/**
 * Why a run stopped before its first shot: Chromium could not start — most
 * often, its binary was never downloaded — or the output folder could not be made.
 */
export type ShotsRunFailure = 'browser_unavailable' | 'out_unwritable'

const MUTED_LAUNCH_ARGUMENTS = [
  '--mute-audio',
  '--autoplay-policy=user-gesture-required'
]
const NETWORK_IDLE_TIMEOUT_MS = 5000
const DEVICE_SCALE_FACTOR = 1

const launchMutedChromium = (): Promise<Result<Browser, ShotsRunFailure>> =>
  chromium.launch({ args: MUTED_LAUNCH_ARGUMENTS }).then(
    (browser) => Result.success(browser),
    () => Result.failure('browser_unavailable' as const)
  )

const answer = (route: Route, response: MockResponse): Promise<void> => {
  switch (response.kind) {
    case 'abort':
      return route.abort()
    case 'body':
      return route.fulfill({
        body: response.body,
        contentType: response.contentType,
        status: response.status
      })
    case 'hang':
      return Promise.resolve()
    case 'json':
      return route.fulfill({ json: response.json, status: response.status })
  }
}

const openVariant = async ({
  browser,
  mocks,
  settings,
  variant
}: {
  browser: Browser
  mocks: readonly RouteMock[]
  settings: ShotsSettings
  variant: ShotVariant
}): Promise<BrowserContext> => {
  const context = await browser.newContext({
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    timezoneId: settings.timezone,
    viewport: { height: settings.height, width: variant.width },
    ...(variant.locale === null ? {} : { locale: variant.locale }),
    ...(variant.theme === null ? {} : { colorScheme: variant.theme })
  })

  await context.addInitScript(
    seedStorage,
    storageEntriesOf({ settings, variant })
  )
  await context.addInitScript(silencePage, settings.volumeKeys)

  if (settings.time !== null) {
    await context.clock.setFixedTime(settings.time)
  }

  for (const mock of mocks.toReversed()) {
    await context.route(mock.url, (route) => answer(route, mock.response))
  }

  return context
}

const settle = async (page: Page, settleMs: number): Promise<void> => {
  await page
    .waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS })
    .catch(() => undefined)
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForTimeout(settleMs)
}

const shoot = async ({
  file,
  page,
  settings,
  url
}: {
  file: string
  page: Page
  settings: ShotsSettings
  url: string
}): Promise<ShotOutcome> => {
  const loaded = await page.goto(url, { waitUntil: 'load' }).then(
    () => true,
    () => false
  )
  if (!loaded) return { reason: 'unreachable', status: 'failed' }

  await settle(page, settings.settleMs)
  const overflow = overflowVerdictOf(await page.evaluate(measureOverflow))

  const written = await page
    .screenshot({
      animations: 'disabled',
      fullPage: settings.fullPage,
      path: file
    })
    .then(
      () => true,
      () => false
    )
  return written
    ? { overflow, status: 'taken' }
    : { reason: 'unwritable', status: 'failed' }
}

/**
 * Shoots every path in every variant the settings ask for, one browser context
 * per variant, in a Chromium that cannot make a sound. A page that fails to
 * load is reported and the run goes on; only a browser that cannot start, or an
 * output folder that cannot be made, stops it.
 */
export const takeShots = async ({
  mocks,
  settings
}: {
  mocks: readonly RouteMock[]
  settings: ShotsSettings
}): Promise<Result<ShotReport[], ShotsRunFailure>> => {
  const outReady = await mkdir(settings.out, { recursive: true }).then(
    () => true,
    () => false
  )
  if (!outReady) return Result.failure('out_unwritable')

  const browser = await launchMutedChromium()
  if (browser.status === 'failure') return browser

  const reports: ShotReport[] = []
  try {
    for (const variant of shotVariantsOf(settings)) {
      const context = await openVariant({
        browser: browser.data,
        mocks,
        settings,
        variant
      })
      const page = await context.newPage()

      for (const path of settings.paths) {
        const fileName = shotFileNameOf({ path, variant })
        const outcome = await shoot({
          file: join(settings.out, fileName),
          page,
          settings,
          url: new URL(path, settings.origin).href
        })
        reports.push({ fileName, outcome, path, variant })
      }

      await context.close()
    }
  } finally {
    await browser.data.close()
  }

  return Result.success(reports)
}

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readBuildManifest } from './build-manifest.ts'
import { readInputJson, readShell } from './input-file.ts'

let directory = ''

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prerender-input-'))
})

afterEach(async () => {
  await rm(directory, { force: true, recursive: true })
})

describe('input files', () => {
  it('names a missing file and the step that writes it', async () => {
    const path = join(directory, '.data', 'meta.json')

    await expect(
      readInputJson({ path, writtenBy: 'pnpm ingest' })
    ).rejects.toThrow(
      `prerender: ${path} does not exist; pnpm ingest writes it`
    )
  })

  it('names a file that is not JSON', async () => {
    const path = join(directory, 'meta.json')

    await writeFile(path, '', 'utf8')

    await expect(
      readInputJson({ path, writtenBy: 'pnpm ingest' })
    ).rejects.toThrow(`prerender: ${path} is not JSON`)
  })

  it('reads a JSON file', async () => {
    const path = join(directory, 'meta.json')

    await writeFile(path, '{"generatedAt":"2026-10-09"}', 'utf8')

    expect(await readInputJson({ path, writtenBy: 'pnpm ingest' })).toEqual({
      generatedAt: '2026-10-09'
    })
  })

  it('says the client build writes the shell and the manifest', async () => {
    await expect(readShell(directory)).rejects.toThrow(
      'index.html does not exist; vite build writes it'
    )
    await expect(readBuildManifest(directory)).rejects.toThrow(
      'manifest.json does not exist; vite build with build.manifest: true writes it'
    )
  })
})

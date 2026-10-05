import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'

const SCRATCH_ROOT = join(import.meta.dirname, '..', 'node_modules', '.cache')

/**
 * A fresh folder for a test's files, inside the package: Vitest cannot import
 * a module from outside the project, and a mocks module is read by import.
 */
export const makeScratchFolder = async (): Promise<string> => {
  await mkdir(SCRATCH_ROOT, { recursive: true })
  return mkdtemp(join(SCRATCH_ROOT, 'shots-'))
}

export const removeScratchFolder = (folder: string): Promise<void> =>
  rm(folder, { force: true, recursive: true })

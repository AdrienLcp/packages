/**
 * Marks as private, in the CI checkout only, every package npm has never seen,
 * so `changeset publish` skips it instead of failing the whole release.
 *
 * npm trusted publishing is configured per package, on a package that already
 * exists: the first version of a new package can only be published by hand.
 * Until then, the release publishes everything else and leaves a warning.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'
const CHANGESET_DIR = '.changeset'
const REGISTRY_URL = 'https://registry.npmjs.org'

const hasPendingChangesets = async () => {
  const entries = await readdir(CHANGESET_DIR)
  return entries.some((entry) => entry.endsWith('.md') && entry !== 'README.md')
}

const isOnNpm = async (name) => {
  const response = await fetch(`${REGISTRY_URL}/${name.replace('/', '%2f')}`, {
    method: 'HEAD'
  })
  if (response.status === 404) {
    return false
  }
  if (!response.ok) {
    throw new Error(`npm answered ${response.status} for ${name}`)
  }
  return true
}

const holdBack = async (packageDir, manifestPath, manifest) => {
  await writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifest, private: true }, null, 2)}\n`
  )
  process.stdout.write(
    `::warning title=${manifest.name} needs its first publish by hand::` +
      `Run \`pnpm build\`, then \`pnpm publish --access public\` in ${packageDir}, ` +
      'then add this repository and release.yml as its trusted publisher on npmjs.com.\n'
  )
}

// With changesets pending, the action opens the Version PR from this working
// tree: a manifest edited here would land in that pull request.
if (!(await hasPendingChangesets())) {
  for (const directory of await readdir(PACKAGES_DIR)) {
    const manifestPath = join(PACKAGES_DIR, directory, 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    if (!manifest.private && !(await isOnNpm(manifest.name))) {
      await holdBack(join(PACKAGES_DIR, directory), manifestPath, manifest)
    }
  }
}

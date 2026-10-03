import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const EN_DICTIONARY = defineDictionary({
  app: {
    description:
      'Documentation and release history of the @adrienlcp packages: small, typed, dependency-free TypeScript packages.',
    name: '@adrienlcp packages'
  },
  docs: {
    how: 'The README and the documents beside it, as written in the repository.',
    opening: 'Overview',
    title: 'Documentation'
  },
  empty: {
    body: 'Names are matched anywhere, and so are the one-line summaries. Try a shorter part of the name, or show every kind.',
    clear: 'Clear the search',
    kindOnly: 'No export of this kind matches',
    query: 'No export matches “{query}”'
  },
  error: {
    note: 'Reloading the page usually sets it straight.',
    reload: 'Reload the page',
    title: 'Something broke on this page.'
  },
  exports: {
    how: 'Grouped by the section of the documentation that explains them. A row leads to its section.',
    sourceOnly: 'Documented in the source only',
    title: 'Exports'
  },
  facts: {
    changelog: 'Changelog',
    dependsOn: 'Depends on',
    noChangelog: 'None yet',
    nothing: 'Nothing',
    released: 'Released',
    source: 'Source',
    title: 'At a glance',
    version: 'Version'
  },
  footer: {
    source: 'Built from the packages monorepo'
  },
  header: {
    home: '@adrienlcp packages, every export',
    skip: 'Skip to content'
  },
  home: {
    exportNoun: defineTranslation('{count:plural}', {
      plural: { count: { one: 'export', other: 'exports' } }
    }),
    intro: defineTranslation(
      'Each name the {count:plural} export, read from their entry points. Type a name, or filter by kind.',
      { plural: { count: { one: 'package', other: '{?} packages' } } }
    ),
    lastRelease: 'Last release',
    packageNoun: defineTranslation('{count:plural}', {
      plural: { count: { one: 'package', other: 'packages' } }
    }),
    title: 'Every export'
  },
  install: {
    copied: 'Copied',
    copy: 'Copy',
    copyFailed: 'Select and copy it',
    title: 'Install'
  },
  inventory: {
    caption: 'Every export, grouped by package, newest release first',
    exportCount: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} export', other: '{?} exports' } }
    }),
    newest: 'Newest release',
    open: 'Open {name}'
  },
  kind: {
    all: 'All',
    component: 'Component',
    constant: 'Constant',
    file: 'File',
    function: 'Function',
    hook: 'Hook',
    sass: 'Sass',
    type: 'Type'
  },
  locale: {
    label: 'Interface language'
  },
  notFound: {
    address: 'Address asked for: {path}',
    backHome: 'Back to every export',
    title: 'No page at this address'
  },
  package: {
    back: 'Every export',
    navigation: 'On this page',
    optionalPeer: 'optional peer',
    worksWith: 'Works with'
  },
  pending: {
    count: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} change', other: '{?} changes' } }
    }),
    everywhere:
      'Nothing merged since the last release. A change merged into main shows here, in its author’s words, until it ships.',
    inPackage:
      'Nothing merged into {name} since {version}. The next change shows here, in its author’s words, until it ships.',
    nothing: 'Nothing pending',
    title: 'Pending'
  },
  search: {
    count: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} export', other: '{?} exports' } }
    }),
    countOf: defineTranslation('{count:number} of {total:plural}', {
      plural: { total: { one: '{?} export', other: '{?} exports' } }
    }),
    kinds: 'Filter by kind',
    label: 'Find an export',
    placeholder: 'Find an export: copyText, plural, ring…'
  },
  sidebar: {
    all: 'Every export',
    noMatch: 'No match',
    title: 'Packages'
  },
  theme: {
    dark: 'Dark theme',
    label: 'Theme',
    light: 'Light theme',
    system: 'System theme'
  },
  versions: {
    bump: {
      major: 'Major',
      minor: 'Minor',
      patch: 'Patch'
    },
    byHand: 'By hand',
    handBefore:
      'Versions before {version} were published by hand, before the changelog: they have no notes.',
    how: 'Newest first, in the changelog’s own words.',
    latest: 'Latest',
    noNotes: 'No release notes',
    noNotesBody:
      'Published by hand before this package kept a changelog. The first version released through changesets will be the first with notes.',
    title: 'Versions'
  }
})

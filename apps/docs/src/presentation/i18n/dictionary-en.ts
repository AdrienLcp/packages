import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const EN_DICTIONARY = defineDictionary({
  app: {
    description:
      'Documentation and release history of the @adrienlcp packages: small, typed, dependency-free TypeScript packages.',
    name: '@adrienlcp packages',
    shareImageAlt:
      'The @adrienlcp/packages logo of stacked blocks above its wordmark, on a dark background.'
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
    legal: 'Legal notice and privacy',
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
  legal: {
    description:
      'Who publishes the @adrienlcp packages documentation, what it keeps about you, and what it does not.',
    host: {
      body: 'The site is hosted on Cloudflare Pages, by:',
      heading: 'Host'
    },
    intro:
      'Who publishes this site, what it keeps about you, and how to change that.',
    measurement: {
      body: 'This site measures no audience. It runs no tracker and no analytics, and counts nobody’s visits.',
      heading: 'Audience measurement'
    },
    publisher: {
      address:
        'As a non-professional publisher, I give the host’s identity in place of a postal address (LCEN, article 6-III-2).',
      body: 'This site is published by {name}, a private individual, not a business. You can write to me through <contact>the contact page of adrienlcp.com</contact>.',
      heading: 'Publisher'
    },
    rights: {
      body: 'Under the GDPR, you may access, correct or erase what concerns you, or object to its use. Ask through <contact>the contact page</contact>; I answer within a month.',
      complaint:
        'If you believe your rights are not respected, you may lodge a complaint with the <authority>CNIL</authority>.',
      heading: 'Your rights'
    },
    search: {
      body: 'Search runs in your browser. When you first open it, your browser downloads the search index from this site; what you type is matched against it on your device and is never sent anywhere.',
      heading: 'Search'
    },
    storage: {
      device:
        'This site sets no cookies. What it remembers stays in your browser, for this site only, until you clear it:',
      heading: 'What this site stores',
      locale:
        'The language you last read the site in, so that its address without a language opens in it.',
      server: 'Nothing about you is kept on a server.',
      theme: 'The theme you picked: light, dark, or your system’s.'
    },
    thirdParties: {
      body: 'Your browser talks to this site only: its fonts and its search index are served from it. Its host, Cloudflare, receives your IP address with each request, to deliver the page and protect the site from abuse, and may receive the reports your browser sends when a request fails.',
      heading: 'Who else receives your data',
      links:
        'A link to GitHub or npm takes you to their site, under their own rules, only when you follow it.'
    },
    title: 'Legal notice and privacy'
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
    placeholder: 'An export: copyText, ring…'
  },
  settings: {
    appearance: 'Appearance',
    dark: 'Dark',
    language: 'Language',
    light: 'Light',
    open: 'Settings',
    system: 'Match my device',
    title: 'Settings'
  },
  sidebar: {
    all: 'Every export',
    noMatch: 'No match',
    title: 'Packages'
  },
  siteSearch: {
    close: 'Close',
    hint: 'Every README, document and release note of the packages, matched in your browser.',
    keyMove: 'to move',
    keyOpen: 'to open',
    label: 'Search the documentation',
    noMatch: 'Nothing matches “{query}”',
    noMatchBody:
      'Every word is looked for, whole or with another ending. Try fewer words, or another spelling.',
    open: 'Search the docs',
    pageCount: defineTranslation('{count:plural}', {
      plural: {
        count: { one: '{?} page matches', other: '{?} pages match' }
      }
    }),
    placeholder: 'A word, a phrase, an export…',
    results: 'Pages that match',
    searching: 'Searching…',
    unavailable: 'Search is unavailable',
    unavailableBody:
      'Its index could not be loaded. Reload the page, or check your connection.'
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

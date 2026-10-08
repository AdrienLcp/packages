import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const FR_DICTIONARY = defineDictionary({
  app: {
    description:
      'Documentation et historique des versions des paquets @adrienlcp : de petits paquets TypeScript typés, sans dépendance.',
    name: '@adrienlcp packages',
    shareImageAlt:
      'Le logotype @adrienlcp/packages à côté de la liste des paquets, chacun avec sa marque de couleur.'
  },
  docs: {
    how: 'Le README et les documents à côté, tels qu’écrits dans le dépôt.',
    opening: 'Présentation',
    title: 'Documentation'
  },
  empty: {
    body: 'Le nom est cherché partout, le résumé d’une ligne aussi. Essayez un morceau plus court du nom, ou affichez toutes les natures.',
    clear: 'Effacer la recherche',
    kindOnly: 'Aucun export de cette nature ne correspond',
    query: 'Aucun export ne correspond à « {query} »'
  },
  error: {
    note: 'Recharger la page remet en général tout d’aplomb.',
    reload: 'Recharger la page',
    title: 'Quelque chose a cassé sur cette page.'
  },
  exports: {
    how: 'Groupés par la section de la documentation qui les explique. Une ligne mène à sa section.',
    sourceOnly: 'Documentés dans le code seulement',
    title: 'Exports'
  },
  facts: {
    changelog: 'Changelog',
    dependsOn: 'Dépend de',
    noChangelog: 'Pas encore',
    nothing: 'Rien',
    released: 'Publiée le',
    source: 'Source',
    title: 'En bref',
    version: 'Version'
  },
  footer: {
    source: 'Construit depuis le monorepo des paquets'
  },
  header: {
    home: '@adrienlcp packages, tous les exports',
    skip: 'Aller au contenu'
  },
  home: {
    exportNoun: defineTranslation('{count:plural}', {
      plural: { count: { one: 'export', other: 'exports' } }
    }),
    intro: defineTranslation(
      'Chaque nom qu’exportent les {count:plural}, lu dans leurs points d’entrée. Tapez un nom, ou filtrez par nature.',
      { plural: { count: { one: 'paquet', other: '{?} paquets' } } }
    ),
    lastRelease: 'Dernière version',
    packageNoun: defineTranslation('{count:plural}', {
      plural: { count: { one: 'paquet', other: 'paquets' } }
    }),
    title: 'Tous les exports'
  },
  install: {
    copied: 'Copié',
    copy: 'Copier',
    copyFailed: 'Sélectionnez et copiez',
    title: 'Installation'
  },
  inventory: {
    caption:
      'Tous les exports, groupés par paquet, la version la plus récente d’abord',
    exportCount: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} export', other: '{?} exports' } }
    }),
    newest: 'Version la plus récente',
    open: 'Ouvrir {name}'
  },
  kind: {
    all: 'Tout',
    component: 'Composant',
    constant: 'Constante',
    file: 'Fichier',
    function: 'Fonction',
    hook: 'Hook',
    sass: 'Sass',
    type: 'Type'
  },
  locale: {
    label: 'Langue de l’interface'
  },
  notFound: {
    address: 'Adresse demandée : {path}',
    backHome: 'Retour à tous les exports',
    title: 'Aucune page à cette adresse'
  },
  package: {
    back: 'Tous les exports',
    navigation: 'Sur cette page',
    optionalPeer: 'peer facultatif',
    worksWith: 'Fonctionne avec'
  },
  pending: {
    count: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} changement', other: '{?} changements' } }
    }),
    everywhere:
      'Rien de fusionné depuis la dernière version. Un changement fusionné dans main s’affiche ici, dans les mots de son auteur, jusqu’à sa publication.',
    inPackage:
      'Rien de fusionné dans {name} depuis la {version}. Le prochain changement s’affiche ici, dans les mots de son auteur, jusqu’à sa publication.',
    nothing: 'Rien en attente',
    title: 'En attente'
  },
  search: {
    count: defineTranslation('{count:plural}', {
      plural: { count: { one: '{?} export', other: '{?} exports' } }
    }),
    countOf: defineTranslation('{count:number} sur {total:plural}', {
      plural: { total: { one: '{?} export', other: '{?} exports' } }
    }),
    kinds: 'Filtrer par nature',
    label: 'Trouver un export',
    placeholder: 'Trouver un export : copyText, plural, ring…'
  },
  sidebar: {
    all: 'Tous les exports',
    noMatch: 'Aucun résultat',
    title: 'Paquets'
  },
  theme: {
    dark: 'Thème sombre',
    label: 'Thème',
    light: 'Thème clair',
    system: 'Thème du système'
  },
  versions: {
    bump: {
      major: 'Majeure',
      minor: 'Mineure',
      patch: 'Correctif'
    },
    byHand: 'À la main',
    handBefore:
      'Les versions antérieures à la {version} ont été publiées à la main, avant le changelog : elles n’ont pas de notes.',
    how: 'La plus récente d’abord, dans les mots du changelog.',
    latest: 'Dernière',
    noNotes: 'Pas de notes de version',
    noNotesBody:
      'Publiée à la main avant que ce paquet tienne un changelog. La première version publiée par changesets sera la première avec des notes.',
    title: 'Versions'
  }
})

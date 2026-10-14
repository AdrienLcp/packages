import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export const FR_DICTIONARY = defineDictionary({
  app: {
    description:
      'Documentation et historique des versions des paquets @adrienlcp : de petits paquets TypeScript typés, sans dépendance.',
    name: '@adrienlcp packages',
    shareImageAlt:
      'Le logo de blocs empilés de @adrienlcp/packages au-dessus de son nom, sur fond sombre.'
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
    legal: 'Mentions légales et confidentialité',
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
  legal: {
    description:
      'Qui édite la documentation des paquets @adrienlcp, ce qu’elle conserve de vous, et ce qu’elle ne fait pas.',
    host: {
      body: 'Le site est hébergé sur Cloudflare Pages, par :',
      heading: 'Hébergeur'
    },
    intro:
      'Qui édite ce site, ce qu’il conserve de vous, et comment le changer.',
    measurement: {
      body: 'Ce site ne mesure aucune audience. Il n’embarque ni traceur ni outil d’analyse, et ne compte les visites de personne.',
      heading: 'Mesure d’audience'
    },
    publisher: {
      address:
        'Éditeur non professionnel, je donne l’identité de l’hébergeur à la place d’une adresse postale (LCEN, article 6-III-2).',
      body: 'Ce site est édité par {name}, à titre de particulier et non de professionnel. Vous pouvez m’écrire depuis <contact>la page de contact d’adrienlcp.com</contact>.',
      heading: 'Éditeur'
    },
    rights: {
      body: 'Le RGPD vous permet d’accéder à ce qui vous concerne, de le rectifier ou de l’effacer, et de vous opposer à son utilisation. Demandez-le depuis <contact>la page de contact</contact> ; je réponds sous un mois.',
      complaint:
        'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la <authority>CNIL</authority>.',
      heading: 'Vos droits'
    },
    search: {
      body: 'La recherche s’exécute dans votre navigateur. À sa première ouverture, votre navigateur télécharge l’index de recherche depuis ce site ; ce que vous tapez y est cherché sur votre appareil et n’est envoyé nulle part.',
      heading: 'Recherche'
    },
    storage: {
      device:
        'Ce site ne dépose aucun cookie. Ce qu’il retient reste dans votre navigateur, pour ce seul site, jusqu’à ce que vous l’effaciez :',
      heading: 'Ce que ce site conserve',
      locale:
        'La langue dans laquelle vous avez lu le site en dernier, pour que son adresse sans langue s’ouvre dans celle-ci.',
      server: 'Rien vous concernant n’est conservé sur un serveur.',
      theme: 'Le thème choisi : clair, sombre, ou celui du système.'
    },
    thirdParties: {
      body: 'Votre navigateur ne communique qu’avec ce site : ses polices et son index de recherche sont servis depuis celui-ci. Son hébergeur, Cloudflare, reçoit votre adresse IP à chaque requête, pour servir la page et protéger le site des abus, et peut recevoir les rapports que votre navigateur envoie quand une requête échoue.',
      heading: 'Qui d’autre reçoit vos données',
      links:
        'Un lien vers GitHub ou npm vous mène sur leur site, sous leurs propres règles, seulement si vous le suivez.'
    },
    title: 'Mentions légales et confidentialité'
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
    placeholder: 'Un export : copyText, ring…'
  },
  sidebar: {
    all: 'Tous les exports',
    noMatch: 'Aucun résultat',
    title: 'Paquets'
  },
  siteSearch: {
    close: 'Fermer',
    hint: 'Chaque README, document et note de version des paquets, cherché dans votre navigateur.',
    keyMove: 'pour se déplacer',
    keyOpen: 'pour ouvrir',
    label: 'Chercher dans la documentation',
    noMatch: 'Rien ne correspond à « {query} »',
    noMatchBody:
      'Chaque mot est cherché, entier ou avec une autre terminaison. Essayez moins de mots, ou une autre orthographe.',
    open: 'Chercher dans la doc',
    pageCount: defineTranslation('{count:plural}', {
      plural: {
        count: {
          one: '{?} page correspond',
          other: '{?} pages correspondent'
        }
      }
    }),
    placeholder: 'Un mot, une phrase, un export…',
    results: 'Pages qui correspondent',
    searching: 'Recherche…',
    unavailable: 'La recherche est indisponible',
    unavailableBody:
      'Son index n’a pas pu être chargé. Rechargez la page, ou vérifiez votre connexion.'
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

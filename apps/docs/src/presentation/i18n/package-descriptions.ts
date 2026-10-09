import { DEFAULT_LOCALE, type Locale } from './locale.ts'

type TranslatedLocale = Exclude<Locale, typeof DEFAULT_LOCALE>

/**
 * Each package's description in the locales its `package.json` is not
 * written in, by package `name`: the English stays in the manifest npm shows.
 */
export const PACKAGE_DESCRIPTIONS: Record<
  TranslatedLocale,
  Readonly<Record<string, string>>
> = {
  fr: {
    'biome-config':
      'Les réglages de lint et de formatage de Biome : guillemets simples, pas de points-virgules, clés et imports triés, aucune promesse laissée flottante',
    browser:
      'Les appels au navigateur qui cachent un piège : une copie dans le presse-papiers qui marche en simple HTTP, un verrou d’écran qui survit au départ de l’onglet, la préférence de mouvement réduit, un token de durée lu en secondes, la première arrivée sur laquelle se joue l’entrée d’une page',
    i18n: 'Une bibliothèque i18n typée en cinq fichiers, sans dépendance, bâtie sur Intl',
    'measure-font':
      'Un bin de développement qui mesure une police auto-hébergée face à Arial pour les polices de repli de @adrienlcp/styles — par graisse et par chasse, sur le texte de l’app, ses dictionnaires ou ses pages prérendues, avec les chiffres à part et la plage de ratios qui garde chaque ligne limite coupée au même endroit — et convertit un ch en em',
    prerender:
      'Des outils de build qui font de la coquille d’une app Vite un document prérendu par page : le head rendu remis à sa place, les alternatives de langue, les feuilles de style de la page intégrées sans que Vite les lie une seconde fois, ses polices et ses modules préchargés au choix ; et le côté navigateur, qui démarre l’app après le premier affichage et vérifie que son premier rendu a gardé le texte prérendu',
    react:
      'Des utilitaires React génériques : un contexte qui nomme son provider manquant, un élément qui finit sa transition de sortie avant de se démonter, et une jointure de noms de classes',
    'react-aria':
      'Ce que répète chacune de mes apps react-aria : une fusion de className qui suit l’état de rendu, et un anneau de focus Sass sur data-focus-visible',
    'react-router':
      'Des liens react-aria qui naviguent par react-router : un RouterProvider branché sur useNavigate, les URL externes laissées telles quelles, NavigateOptions typé sur chaque lien',
    result: 'Une valeur succès ou échec, sans exception et sans null',
    'safe-storage':
      'Un localStorage qui ne lève jamais d’erreur : chaque lecture, écriture et suppression renvoie un Result, et les lectures typées vérifient ce qu’elles trouvent',
    styles:
      'Un reset, un interrupteur de mouvement réduit, des tokens par défaut, des mixins Sass pour les polices auto-hébergées, les container queries, un breakpoint, les anneaux de focus, le texte masqué à l’écran, une répartition en deux colonnes, un lien d’évitement qui dégage l’encoche et une entrée à la première arrivée, une taille fluide en rem, un importeur Sass qui sert des valeurs partagées par un script, un plugin PostCSS qui liste les jumelles métriques d’Arial dans les polices de repli de fontaine, et des vérifications : contraste WCAG entre tokens de couleur, tailles que la taille de police de l’utilisateur ne peut atteindre, tokens de police qui sautent leur police de repli, bandes de repli auxquelles manque une graisse et texte SVG qui nomme une famille',
    'theme-preference':
      'Un thème clair, sombre ou système sans flash au chargement, une barre d’outils du navigateur qui suit le choix, et des mixins Sass pour une valeur par thème que light-dark() ne sait pas porter',
    tsconfig:
      'Les réglages TypeScript les plus stricts, pour un projet qui ne fait que vérifier les types et qu’un autre outil bundle'
  }
}

/** A package's description in `locale`: its `package.json` one in English. */
export const packageDescriptionIn = ({
  locale,
  packageInfo
}: {
  locale: Locale
  packageInfo: { description: string; name: string }
}): string =>
  locale === DEFAULT_LOCALE
    ? packageInfo.description
    : (PACKAGE_DESCRIPTIONS[locale][packageInfo.name] ??
      packageInfo.description)

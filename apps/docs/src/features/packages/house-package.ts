import type { EcosystemTie } from './ecosystem.ts'
import type { ExportKind } from './export-kind.ts'
import type { VersionBump } from './version-bump.ts'

/** A heading of a package's documentation, as the page renders it. */
export type DocumentSection = {
  /** The Markdown file it comes from: `README.md`, `documentation.md`. */
  file: string
  /** Its body, rendered. */
  html: string
  /** Unique across the package's documents. */
  slug: string
  /** Rendered inline; `null` for the text before the first heading. */
  titleHtml: string | null
}

/** One name a consumer imports, and where the documentation explains it. */
export type PackageExport = {
  kind: ExportKind
  name: string
  section: Pick<DocumentSection, 'file' | 'slug' | 'titleHtml'> | null
  /** What the consumer imports it from: `@adrienlcp/browser/react`. */
  specifier: string
  /** The first sentence of its doc comment, rendered inline. */
  summaryHtml: string | null
}

/** A note of a release, rendered. */
export type ReleaseNote = {
  bump: VersionBump
  /** `null` on the notes changesets writes itself, such as updated dependencies. */
  commit: string | null
  html: string
}

/**
 * A version, newest first: one the changelog records, or the one published by
 * hand before the package kept a changelog.
 */
export type PackageVersion =
  | {
      /** The largest bump among its notes. */
      bump: VersionBump
      /** `YYYY-MM-DD`, from the commit that wrote it into the changelog. */
      date: string | null
      notes: readonly ReleaseNote[]
      origin: 'changelog'
      version: string
    }
  | { origin: 'hand'; version: string }

/** A change merged on `main` that the next release of this package will carry. */
export type PendingNote = {
  bump: VersionBump
  html: string
}

/** One `@adrienlcp/*` package, as the site documents it. */
export type HousePackage = {
  /** The other house packages it depends on, by `name`. */
  dependsOn: readonly string[]
  description: string
  ecosystem: readonly EcosystemTie[]
  exports: readonly PackageExport[]
  /**
   * The oldest version the changelog records, when versions before it were
   * published by hand and have no notes; `null` otherwise.
   */
  handPublishedBefore: string | null
  /** The command that adds it to a project. */
  install: string
  /** The directory and URL name, `i18n`. */
  name: string
  pending: readonly PendingNote[]
  /** `@adrienlcp/i18n`. */
  scopedName: string
  version: string
  versions: readonly PackageVersion[]
}

/** Every package's documentation, by package `name`: heavy, so read only on its page. */
export type PackageDocuments = Readonly<
  Record<string, readonly DocumentSection[]>
>

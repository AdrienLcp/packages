/** Served by `cataloguePlugin`, built from the repository's files. */
declare module 'virtual:catalogue' {
  export const CATALOGUE: readonly import('./house-package.ts').HousePackage[]
}

/** Served by `cataloguePlugin`: every package's rendered documentation. */
declare module 'virtual:package-documents' {
  export const PACKAGE_DOCUMENTS: import('./house-package.ts').PackageDocuments
}

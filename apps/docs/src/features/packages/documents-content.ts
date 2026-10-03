import { PACKAGE_DOCUMENTS as BUILT_DOCUMENTS } from 'virtual:package-documents'

import type { PackageDocuments } from './house-package.ts'

/** Each package's README and other documents, rendered when the site is built. */
export const PACKAGE_DOCUMENTS: PackageDocuments = BUILT_DOCUMENTS

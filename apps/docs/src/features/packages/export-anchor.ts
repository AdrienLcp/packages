import type { PackageExport } from './house-package.ts'

/** The fragment that lands on an export's row on its package's page. */
export const exportAnchorOf = (
  packageExport: Pick<PackageExport, 'name'>
): string => `export-${packageExport.name.replace(/[^\w-]/g, '_')}`

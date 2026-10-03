export const EXPORT_KINDS = [
  'function',
  'hook',
  'component',
  'type',
  'constant',
  'sass',
  'file'
] as const

/** What an export is, as a reader scanning for one thinks of it. */
export type ExportKind = (typeof EXPORT_KINDS)[number]

export const isExportKind = (value: string): value is ExportKind =>
  EXPORT_KINDS.some((kind) => kind === value)

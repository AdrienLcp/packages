import type {
  DocumentSection,
  PackageExport
} from '@/features/packages/house-package'

/** The exports one section explains; `section` is `null` for those no section names. */
export type SectionExports = {
  exports: readonly PackageExport[]
  section: PackageExport['section']
}

/**
 * The exports grouped by the section that explains them, in the order the
 * documentation reads; those no section names come last.
 */
export const exportsBySection = ({
  documentation,
  exports
}: {
  documentation: readonly DocumentSection[]
  exports: readonly PackageExport[]
}): readonly SectionExports[] => {
  const explained = documentation.flatMap((documentSection) => {
    const inSection = exports.filter(
      (packageExport) => packageExport.section?.slug === documentSection.slug
    )
    const [first] = inSection

    return first === undefined
      ? []
      : [{ exports: inSection, section: first.section }]
  })
  const unexplained = exports.filter(
    (packageExport) => packageExport.section === null
  )

  return unexplained.length === 0
    ? explained
    : [...explained, { exports: unexplained, section: null }]
}

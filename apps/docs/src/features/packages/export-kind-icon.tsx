import type React from 'react'

import {
  ConstantIcon,
  FileIcon,
  FunctionIcon,
  HookIcon,
  PackageIcon,
  SassMemberIcon,
  TypeIcon
} from '@/presentation/components/icons'

import type { ExportKind } from './export-kind.ts'

const KIND_ICONS = {
  component: PackageIcon,
  constant: ConstantIcon,
  file: FileIcon,
  function: FunctionIcon,
  hook: HookIcon,
  sass: SassMemberIcon,
  type: TypeIcon
} as const satisfies Record<ExportKind, React.FC<{ className?: string }>>

/** The glyph a kind of export is recognised by, in every list and filter. */
export const ExportKindIcon: React.FC<{
  className?: string
  kind: ExportKind
}> = ({ className, kind }) => {
  const Icon = KIND_ICONS[kind]

  return <Icon className={className} />
}

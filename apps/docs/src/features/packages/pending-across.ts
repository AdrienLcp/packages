import type { HousePackage, PendingNote } from './house-package.ts'

/** Every package's pending notes in one list, each with the package it will ship in. */
export const pendingAcross = (
  packages: readonly HousePackage[]
): readonly (PendingNote & { housePackage: HousePackage })[] =>
  packages.flatMap((housePackage) =>
    housePackage.pending.map((note) => ({ ...note, housePackage }))
  )

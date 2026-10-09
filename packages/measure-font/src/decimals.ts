/** The decimals a ratio is written with. */
export const RATIO_DECIMALS = 4
/** The decimals a `size-adjust` is written with, as fontaine writes it. */
export const SIZE_ADJUST_DECIMALS = 6

/** `value` rounded to `decimals`, trailing zeros dropped. */
export const rounded = (value: number, decimals = RATIO_DECIMALS): number =>
  Number(value.toFixed(decimals))

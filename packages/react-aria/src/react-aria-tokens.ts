/**
 * The custom properties react-aria-components sets at runtime on the elements
 * it renders, which an app's stylesheets read but never declare: a popover's
 * `--trigger-width`, a disclosure panel's `--disclosure-panel-height`, a tree
 * item's `--tree-item-level`. Pass them to `findTokenFailures` from
 * `@adrienlcp/styles/audit` as `provided`.
 */
export const REACT_ARIA_TOKENS = [
  '--disclosure-panel-height',
  '--disclosure-panel-width',
  '--page-height',
  '--page-width',
  '--tab-panel-height',
  '--tab-panel-width',
  '--table-row-level',
  '--tree-item-level',
  '--trigger-anchor-point',
  '--trigger-width',
  '--visual-viewport-height',
  '--visual-viewport-width'
] as const

/** Every custom property `tokens.defaults` declares, with the value it declares. */
export const SHARED_TOKEN_DEFAULTS = {
  '--control-height': 'max(var(--target), 2.75rem)',
  '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--gutter': '1rem',
  '--gutter-left': 'max(var(--gutter), var(--safe-area-left))',
  '--gutter-right': 'max(var(--gutter), var(--safe-area-right))',
  '--hairline':
    'var(--stroke-hair) solid var(--rule, color-mix(in oklab, currentColor 25%, transparent))',
  '--hairline-strong':
    'var(--stroke-hair) solid var(--rule-strong, color-mix(in oklab, currentColor 55%, transparent))',
  '--icon-l': '1.5rem',
  '--icon-m': '1.25rem',
  '--icon-s': '1rem',
  '--inset-hairline':
    'inset 0 0 0 var(--stroke-hair) var(--rule, color-mix(in oklab, currentColor 25%, transparent))',
  '--measure': '34em',
  '--outline-offset': '3px',
  '--outline-thick': '2px',
  '--ring': 'var(--outline-thick) solid var(--focus, currentColor)',
  '--ring-offset': 'var(--outline-offset)',
  '--safe-area-bottom':
    'env(safe-area-max-inset-bottom, env(safe-area-inset-bottom, 0px))',
  '--safe-area-left': 'env(safe-area-inset-left, 0px)',
  '--safe-area-right': 'env(safe-area-inset-right, 0px)',
  '--safe-area-top': 'env(safe-area-inset-top, 0px)',
  '--stroke-bold': '2px',
  '--stroke-hair': '1px',
  '--stroke-thin': '1.5px',
  '--target': '44px',
  '--tracking-tight': '-0.02em',
  '--transition-base': '250ms',
  '--transition-fast': '150ms',
  '--transition-slow': '400ms',
  '--underline-offset': '0.24em'
} as const

type DefaultToken = keyof typeof SHARED_TOKEN_DEFAULTS

const DEFAULT_TOKENS = Object.keys(SHARED_TOKEN_DEFAULTS).filter(
  (name): name is DefaultToken => name in SHARED_TOKEN_DEFAULTS
)

/**
 * The custom properties `tokens.defaults` declares, plus the palette names the
 * defaults read: an app reads them without declaring them itself.
 */
export const SHARED_TOKENS: readonly string[] = [
  ...DEFAULT_TOKENS,
  '--rule',
  '--rule-strong',
  '--focus'
]

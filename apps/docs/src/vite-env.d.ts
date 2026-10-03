/// <reference types="vite/client" />

/**
 * The `style` prop only ever hands a runtime value to the stylesheet, through a
 * custom property. React's `CSSProperties` has no room for arbitrary names, and
 * widening it here is what keeps the alternative from being a cast.
 */
declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined
  }
}

export {}

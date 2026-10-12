import {
  METRIC_TWINS,
  type MetricTwins,
  withMetricTwins
} from './local-font-twins.ts'

export type { MetricTwins }

export type MetricTwinsOptions = {
  /** Merged over the default twins, the table in the README: a key it holds is replaced. */
  twins?: MetricTwins
}

type Declaration = { value: string }

type FontFaceRule = {
  walkDecls: (
    property: string,
    visit: (declaration: Declaration) => void
  ) => void
}

/** A PostCSS plugin, typed on the slice it reads: postcss is Vite's dependency, not the app's. */
export type MetricTwinsPlugin = {
  AtRule: { 'font-face': (rule: FontFaceRule) => void }
  postcssPlugin: 'metric-twins'
}

/**
 * The PostCSS plugin that widens the `src` of every `@font-face` naming one
 * local font with metric twins to all of them. Listed after `fontaine/postcss`,
 * whose fallback faces name Arial, Courier New or Times New Roman alone:
 *
 * ```ts
 * css: { postcss: { plugins: [fontaine({ … }), metricTwins()] } }
 * ```
 */
export const metricTwins = Object.assign(
  ({ twins }: MetricTwinsOptions = {}): MetricTwinsPlugin => {
    const merged = { ...METRIC_TWINS, ...twins }

    return {
      AtRule: {
        'font-face': (rule) => {
          rule.walkDecls('src', (declaration) => {
            declaration.value = withMetricTwins(declaration.value, merged)
          })
        }
      },
      postcssPlugin: 'metric-twins'
    }
  },
  { postcss: true as const }
)

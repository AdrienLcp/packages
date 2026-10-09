import type { Importer } from 'sass'

/** One module's values, keyed by name in camelCase: `wideScreen` is `$wide-screen` in Sass. */
export type SassModuleValues = Readonly<Record<string, number | string>>

const CAMEL_CASE_NAME = /^[a-z][a-zA-Z0-9]*$/

const MODULE_NAME = /^[a-z][a-z0-9-]*$/

/** What would end the declaration a value is written into, or open another. */
const OUTSIDE_ONE_VALUE = /[;{}\n]/

const kebabCaseOf = (name: string): string =>
  name.replaceAll(/[A-Z]/g, (capital) => `-${capital.toLowerCase()}`)

const declarationOf = ({
  moduleName,
  name,
  value
}: {
  moduleName: string
  name: string
  value: number | string
}): string => {
  if (!CAMEL_CASE_NAME.test(name)) {
    throw new Error(
      `sassValues: ${moduleName}.${name} is not a camelCase name a Sass variable can take`
    )
  }

  if (typeof value === 'string' && OUTSIDE_ONE_VALUE.test(value)) {
    throw new Error(
      `sassValues: ${moduleName}.${name} holds ${JSON.stringify(value)}, which is not one CSS value`
    )
  }

  return `$${kebabCaseOf(name)}: ${value};`
}

/**
 * A Sass importer that serves each of `modules` as a Sass module of
 * variables at `<scheme>:<name>`, so a value both a script and a stylesheet
 * read — a breakpoint a media query and `matchMedia` both answer to — has one
 * source, in TypeScript:
 *
 * ```ts
 * // vite.config.ts
 * css: { preprocessorOptions: { sass: { importers: [sassValues({ 'screen-sizes': SCREEN_SIZES })] } } }
 * ```
 *
 * ```sass
 * @use 'values:screen-sizes'
 * @forward '@adrienlcp/styles/breakpoints' with ($wide-screen: screen-sizes.$wide-screen)
 * ```
 *
 * A string is written as it is, so `'40rem'` is a length and `'"Inter"'` a
 * quoted string. A module the importer does not serve, under its scheme,
 * fails the build naming the ones it does.
 */
export const sassValues = (
  modules: Readonly<Record<string, SassModuleValues>>,
  { scheme = 'values' }: { scheme?: string } = {}
): Importer<'sync'> => {
  const prefix = `${scheme}:`
  const contents = new Map(
    Object.entries(modules).map(([moduleName, values]) => {
      if (!MODULE_NAME.test(moduleName)) {
        throw new Error(
          `sassValues: ${moduleName} is not a kebab-case module name`
        )
      }

      return [
        moduleName,
        Object.entries(values)
          .map(([name, value]) => declarationOf({ moduleName, name, value }))
          .join('\n')
      ]
    })
  )

  return {
    canonicalize: (url) => {
      if (!url.startsWith(prefix)) {
        return null
      }

      const moduleName = url.slice(prefix.length)

      if (!contents.has(moduleName)) {
        throw new Error(
          `sassValues: ${url} is not a module it serves; it serves ${[...contents.keys()].map((name) => `${prefix}${name}`).join(', ')}`
        )
      }

      return new URL(url)
    },
    load: (canonicalUrl) => {
      const moduleContents = contents.get(
        canonicalUrl.href.slice(prefix.length)
      )

      return moduleContents === undefined
        ? null
        : { contents: moduleContents, syntax: 'scss' }
    }
  }
}

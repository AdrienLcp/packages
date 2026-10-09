import { fileURLToPath } from 'node:url'

import { transform } from 'lightningcss'
import postcss from 'postcss'
import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

import { metricTwins, withMetricTwins } from './metric-twins.ts'

const ARIAL_AND_TWINS =
  'local("Arial"), local("Liberation Sans"), local("Arimo"), local("Roboto")'

const FONTAINE_FALLBACK_FACES = `
@font-face {
  font-family: "Onest fallback";
  src: local("Segoe UI");
  size-adjust: 101.2%;
}
@font-face {
  font-family: "Onest fallback";
  src: local("Arial");
  size-adjust: 104.9%;
  ascent-override: 89.6%;
  descent-override: 25.3%;
  line-gap-override: 0%;
}
@font-face {
  font-family: "Onest";
  src: url("/fonts/onest-latin.woff2") format("woff2");
}`

const run = async (css: string, plugin = metricTwins()) =>
  (await postcss([plugin]).process(css, { from: undefined })).css

describe('withMetricTwins', () => {
  it('[metric-twins] lists Arial with the fonts drawn on its metrics', () => {
    expect(withMetricTwins('local("Arial")')).toBe(ARIAL_AND_TWINS)
  })

  it.each(['local(Arial)', "local('Arial')", ' local( "arial" ) '])(
    '[metric-twins] reads %s',
    (src) => {
      expect(withMetricTwins(src)).toBe(ARIAL_AND_TWINS)
    }
  )

  it('[metric-twins] widens the monospace and the serif fallbacks', () => {
    expect(withMetricTwins('local("Courier New")')).toBe(
      'local("Courier New"), local("Liberation Mono"), local("Cousine")'
    )
    expect(withMetricTwins('local("Times New Roman")')).toBe(
      'local("Times New Roman"), local("Liberation Serif"), local("Tinos")'
    )
  })

  it('[metric-twins] widens Arial Bold to the bold cuts of its twins', () => {
    expect(withMetricTwins("local('Arial Bold')")).toBe(
      'local("Arial Bold"), local("Arial-BoldMT"), local("Liberation Sans Bold"), local("Arimo Bold"), local("Roboto Bold")'
    )
  })

  it('[metric-twins] widens the italic cuts of Arial to the italic cuts of its twins', () => {
    expect(withMetricTwins('local("Arial Italic")')).toBe(
      'local("Arial Italic"), local("Arial-ItalicMT"), local("Liberation Sans Italic"), local("Arimo Italic"), local("Roboto Italic")'
    )
    expect(withMetricTwins('local("Arial Bold Italic")')).toBe(
      'local("Arial Bold Italic"), local("Arial-BoldItalicMT"), local("Liberation Sans Bold Italic"), local("Arimo Bold Italic"), local("Roboto Bold Italic")'
    )
  })

  it.each([
    'local("Segoe UI")',
    'url("/fonts/a.woff2") format("woff2")',
    'local("Arial"), local("Helvetica")'
  ])('[metric-twins] leaves %s as it is', (src) => {
    expect(withMetricTwins(src)).toBe(src)
  })
})

describe('metricTwins', () => {
  it('[metric-twins] widens the fallback face fontaine writes on Arial, and only it', async () => {
    const css = await run(FONTAINE_FALLBACK_FACES)

    expect(css).toContain(`src: ${ARIAL_AND_TWINS};\n  size-adjust: 104.9%`)
    expect(css).toContain('src: local("Segoe UI")')
    expect(css).toContain('src: url("/fonts/onest-latin.woff2")')
  })

  it('[metric-twins] leaves a src outside a font face alone', async () => {
    const css = '.a { src: local("Arial") }'

    expect(await run(css)).toBe(css)
  })

  it('[metric-twins] takes more twins, and replaces a default it is given', async () => {
    const plugin = metricTwins({
      twins: { Arial: ['Arial', 'Arimo'], Helvetica: ['Helvetica', 'Arial'] }
    })

    expect(await run('@font-face { src: local("Arial") }', plugin)).toContain(
      'src: local("Arial"), local("Arimo")'
    )
    expect(
      await run('@font-face { src: local("Helvetica") }', plugin)
    ).toContain('src: local("Helvetica"), local("Arial")')
  })

  it('[metric-twins] widens a face once, however often it runs', async () => {
    const plugin = metricTwins()

    expect(await run(await run(FONTAINE_FALLBACK_FACES, plugin), plugin)).toBe(
      await run(FONTAINE_FALLBACK_FACES, plugin)
    )
  })

  it('[metric-twins] passes as a plugin to PostCSS uncalled', async () => {
    const { css } = await postcss([metricTwins]).process(
      '@font-face { src: local("Arial") }',
      { from: undefined }
    )

    expect(css).toContain(ARIAL_AND_TWINS)
  })
})

describe('fallback faces through a build', () => {
  const FALLBACK_FACES = `
@use 'fonts'
@include fonts.fallback-faces('Sofia Sans', (ascent: 0.9, descent: 0.3, cap-height: 0.655), 0.964556, (300 449: 1.0094, 650 800: 1.0567))
`

  it('[metric-twins] keeps every twin of both Arial cuts once minified', async () => {
    const compiled = compileString(FALLBACK_FACES, {
      loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
      syntax: 'indented'
    }).css
    const minified = transform({
      code: Buffer.from(await run(compiled)),
      filename: 'fonts.css',
      minify: true
    }).code.toString()

    for (const face of [
      'Liberation Sans',
      'Arimo',
      'Roboto',
      'Liberation Sans Bold',
      'Arimo Bold',
      'Roboto Bold'
    ])
      expect(minified.replaceAll('"', '')).toContain(`local(${face})`)
  })
})

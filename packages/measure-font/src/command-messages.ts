import type { MeasureFailure } from './fallback-measure.ts'
import type { TextSourceFailure } from './text-sources.ts'

/** What `measure-font` prints when the family cannot be measured. */
export const measureFailureMessage = (failure: MeasureFailure): string => {
  switch (failure.reason) {
    case 'empty-text':
      return 'No text to measure: the text is empty.'
    case 'no-face':
      return 'No font file to measure.'
    case 'no-glyph':
      return failure.text === 'text'
        ? `${failure.face}: no glyph for any character of the text. A unicode-range subset draws only its range: list it after the subset that draws the text — the latin file before the latin-ext one.`
        : `${failure.face}: no glyph for the digits. List the subset that draws them with it.`
    case 'missing-feature':
      return `${failure.file}: no ${failure.features.join(', ')} feature. A browser sets its digits without it, so the measure would describe figures the page never shows: serve a file that has it, or drop --figure-feature ${failure.features[0]}.`
    case 'missing-axis':
      return `${failure.face}: no ${failure.axis} axis to read at --axis ${failure.axis}.`
    case 'duplicate-weight':
      return `Two faces measure at ${failure.weight}: ${failure.faces.join(', ')}. Measure one family in one style per run.`
    case 'unmeasured-line-weight':
      return `A line is set at ${failure.weight}, a weight not measured: add --weight ${failure.weight}.`
  }
}

/** What `measure-font` prints when a text source cannot be read. */
export const textSourceFailureMessage = (
  failure: TextSourceFailure
): string => {
  switch (failure.reason) {
    case 'missing':
      return `${failure.path}: no such file`
    case 'unsupported-dictionary':
      return `${failure.path}: a dictionary is a .json, .ts or .js file`
    case 'unreadable-dictionary':
      return `${failure.path}: not a dictionary Node can read`
    case 'no-html':
      return `${failure.path}: no .html page under it`
    case 'bad-selector':
      return `--select ${failure.select}: not a selector`
  }
}

const MILLISECONDS_PER_SECOND = 1000

const IN_MILLISECONDS = /ms$/

/**
 * A `<time>` custom property as `element` computes it, in seconds: what a
 * script hands to the Web Animations API or a timer, read from the token the
 * stylesheet already holds rather than a copy of it.
 *
 * Register the property with `@property` and `syntax: '<time>'`: the browser
 * then computes it to one duration, whatever `calc()` or `var()` wrote it, and
 * `reduced-motion.css` collapsing a token reaches the script too. Unregistered,
 * it hands back the text as written. `0` when the property is unset or does
 * not read as a duration: no motion is the safe answer.
 */
export const readDurationSeconds = (
  element: Element,
  property: `--${string}`
): number => {
  const value = getComputedStyle(element).getPropertyValue(property).trim()
  const amount = Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return 0
  }

  return IN_MILLISECONDS.test(value) ? amount / MILLISECONDS_PER_SECOND : amount
}

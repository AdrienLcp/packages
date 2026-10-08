/**
 * A `<` in the JSON, inside a string, would let `</script>` close the tag it
 * sits in. `<` reads back as the same character.
 */
const withoutScriptClosingTags = (json: string): string =>
  json.replaceAll('<', '\\u003c')

/** Appends `data` to the head as JSON-LD. */
export const appendStructuredData = ({
  data,
  document
}: {
  data: object
  document: Document
}): void => {
  const script = document.createElement('script')

  script.setAttribute('type', 'application/ld+json')
  script.textContent = withoutScriptClosingTags(JSON.stringify(data))
  document.head.append(script)
}

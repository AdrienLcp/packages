# @adrienlcp/browser

## 0.2.0

### Minor Changes

- 1f53002: `reloadPage()` reloads the page through `location.reload()`, and does nothing where there is no `location`, as on a server.

## 0.1.1

### Patch Changes

- e742dd1: Keep a modal dialog open when the selection copy runs from inside it: the hidden textarea now sits next to the focused element, and focus goes back to that element after the copy.

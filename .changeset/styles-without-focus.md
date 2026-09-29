---
'@adrienlcp/styles': minor
---

The `focus` module moves to `@adrienlcp/react-aria/focus`, without `hovered`: react-aria's `[data-hovered]` already ignores the hover a touch screen emulates, so a hover style is a plain `&[data-hovered]` rule

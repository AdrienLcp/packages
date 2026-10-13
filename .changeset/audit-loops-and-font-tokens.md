---
'@adrienlcp/styles': patch
---

`findUnreadFontFaces` lists a face whose family or `$widths` an `@each` or `@for` around it binds, even when a variable of the file shares the loop variable's name, and an include of a face mixin of the same file whose family it cannot read: those faces passed every font check unread. `findFontAttributeFailures` fails a `var(--font-…)` whose fallback names a family, and takes the stylesheets as an optional second argument to demand a token they declare as a font stack.

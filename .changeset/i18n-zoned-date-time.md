---
"@adrienlcp/i18n": minor
---

`{x:date}` now also takes a `Temporal.ZonedDateTime`, added to `FormattableDate`. It is shown in its own time zone, as its `toLocaleString` would, whatever the `timeZone` option says; a calendar other than `iso8601` must be the formatter's, or the placeholder stays standing. Every Temporal value still reaches `Intl.DateTimeFormat` as itself, never through a `Date`.

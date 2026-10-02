---
'@adrienlcp/i18n': minor
---

`{x:date}` now also takes a `Temporal.Instant`, `Temporal.PlainDate`, `Temporal.PlainDateTime` or `Temporal.PlainTime`, typed through the new `FormattableDate`. An `Instant` is shown in the `timeZone` option; a `Plain*` value keeps its own wall clock. A `ZonedDateTime`, `PlainYearMonth` or `PlainMonthDay` is refused at compile time and left standing at runtime, as are options asking for fields the value lacks. A project compiling without Temporal in its `lib`, or running without a `Temporal` global, keeps taking a `Date` alone.

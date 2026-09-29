# @adrienlcp/safe-storage

`localStorage` that never throws. Every read, write and removal returns a
[`Result`](https://github.com/AdrienLcp/packages/tree/main/packages/result), and a typed read checks what it finds instead of
trusting it.

`localStorage` throws on plain access in a Safari private window, when the
user blocks site data, when the quota is full, and on a server, where it does
not exist. An app that calls it bare turns any of those into a blank page.

```bash
pnpm add @adrienlcp/safe-storage
```

## Reading

```ts
import { readRecognizedText, readStoredJson, readStoredText } from '@adrienlcp/safe-storage'

readStoredText('app:volume')
// Result<string | null, 'unavailable'>

readRecognizedText({ isRecognized: isLocale, key: 'app:locale' })
// Result<Locale | null, 'unavailable' | 'unrecognized'>

readStoredJson({ isValue: isTrainingLog, key: 'app:log' })
// Result<TrainingLog | null, 'unavailable' | 'unrecognized'>
```

- A `null` success is **nothing stored yet**, never a failure.
- `'unavailable'` — `localStorage` threw, or there is none.
- `'unrecognized'` — something is stored, but the guard refuses it: a value an
  older version wrote, text that is not JSON, JSON of another shape.

The guard is a plain type predicate, so no schema library is required. One
plugs in through its own:

```ts
const isTrainingLog = (value: unknown): value is TrainingLog =>
  trainingLogSchema.safeParse(value).success
```

## Writing and removing

```ts
import { removeStored, writeStoredJson, writeStoredText } from '@adrienlcp/safe-storage'

writeStoredText({ key: 'app:locale', text: 'fr' })  // Result<void, 'unavailable' | 'quota'>
writeStoredJson({ key: 'app:log', value: log })     // Result<void, 'unavailable' | 'quota'>
removeStored('app:locale')                          // Result<void, 'unavailable'>
```

`'quota'` is a full storage. A value `JSON.stringify` cannot write, like a
cycle, still throws: that is a bug in the caller, not a refusal.

## What to do with a failure

This package reports; it never decides. What the user gets instead is the
app's call, made where the storage is read:

```ts
const readTrainingLogOrEmpty = (): TrainingLog => {
  const stored = readStoredJson({ isValue: isTrainingLog, key: LOG_KEY })

  return stored.status === 'success' ? (stored.data ?? EMPTY_LOG) : EMPTY_LOG
}
```

# @adrienlcp/result

A success-or-failure value in thirty lines, with no exceptions and no nulls.
Zero dependencies.

```ts
import { Result } from '@adrienlcp/result'

const parse = (input: string): Result<number, 'not_a_number'> => {
  const value = Number(input)
  return Number.isNaN(value) ? Result.failure('not_a_number') : Result.success(value)
}

const result = parse(raw)
if (result.status === 'failure') return result.error // 'not_a_number'
result.data // number
```

`Result<T = void, E = 'unknown'>`. A result carrying nothing is
`Result.success()` — **no `data` key at all**, so a caller cannot read
`undefined` off something the signature never promised. `Result.failure()` with
no argument means the unknown error.

```bash
pnpm add @adrienlcp/result
```

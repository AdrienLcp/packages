import { Result } from '@adrienlcp/result'

/** What a mocked request gets instead of the network. */
export type MockResponse =
  | { body: string; contentType: string; kind: 'body'; status: number }
  | { json: unknown; kind: 'json'; status: number }
  | { kind: 'abort' }
  | { kind: 'hang' }

/** A request pattern, a glob or URL as `page.route` reads it, and its answer. */
export type RouteMock = { response: MockResponse; url: string }

/** Why a list of mocks was refused. */
export type MocksRefusal =
  | { code: 'invalid_mock'; index: number }
  | { code: 'not_a_list' }

const DEFAULT_STATUS = 200
const DEFAULT_CONTENT_TYPE = 'text/plain'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const statusOf = (value: unknown): number | null => {
  if (value === undefined) return DEFAULT_STATUS
  return Number.isInteger(value) &&
    typeof value === 'number' &&
    value >= 100 &&
    value <= 599
    ? value
    : null
}

const responseOf = (mock: Record<string, unknown>): MockResponse | null => {
  if (mock.abort === true) return { kind: 'abort' }
  if (mock.hang === true) return { kind: 'hang' }

  const status = statusOf(mock.status)
  if (status === null) return null

  if ('json' in mock) return { json: mock.json, kind: 'json', status }

  if (typeof mock.body !== 'string') return null
  const contentType = mock.contentType ?? DEFAULT_CONTENT_TYPE
  return typeof contentType === 'string'
    ? { body: mock.body, contentType, kind: 'body', status }
    : null
}

const routeMockOf = (value: unknown): RouteMock | null => {
  if (!isRecord(value) || typeof value.url !== 'string' || value.url === '') {
    return null
  }
  const response = responseOf(value)
  return response === null ? null : { response, url: value.url }
}

/**
 * Checks a list of mocks, as a mocks file holds them:
 * `{ "url", "json" }`, `{ "url", "body", "contentType" }`,
 * `{ "url", "abort": true }` (a network failure) or `{ "url", "hang": true }`
 * (a request that never answers, for a loading state). `status` defaults to 200.
 * The failure names the first mock it refuses.
 */
export const parseRouteMocks = (
  value: unknown
): Result<RouteMock[], MocksRefusal> => {
  if (!Array.isArray(value)) return Result.failure({ code: 'not_a_list' })

  const mocks: RouteMock[] = []
  for (const [index, item] of value.entries()) {
    const mock = routeMockOf(item)
    if (mock === null) return Result.failure({ code: 'invalid_mock', index })
    mocks.push(mock)
  }
  return Result.success(mocks)
}

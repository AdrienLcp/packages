import { describe, expect, it } from 'vitest'

import { parseRouteMocks } from './route-mocks.ts'

describe('parseRouteMocks', () => {
  it('[route-mocks] reads every kind of answer, status 200 by default', () => {
    expect(
      parseRouteMocks([
        { json: { total: 3 }, url: '**/api/stats' },
        { body: 'down', status: 503, url: '**/api/health' },
        { body: '<p>hi</p>', contentType: 'text/html', url: '**/fragment' },
        { abort: true, url: '**/analytics' },
        { hang: true, url: '**/slow' }
      ])
    ).toEqual({
      data: [
        {
          response: { json: { total: 3 }, kind: 'json', status: 200 },
          url: '**/api/stats'
        },
        {
          response: {
            body: 'down',
            contentType: 'text/plain',
            kind: 'body',
            status: 503
          },
          url: '**/api/health'
        },
        {
          response: {
            body: '<p>hi</p>',
            contentType: 'text/html',
            kind: 'body',
            status: 200
          },
          url: '**/fragment'
        },
        { response: { kind: 'abort' }, url: '**/analytics' },
        { response: { kind: 'hang' }, url: '**/slow' }
      ],
      status: 'success'
    })
  })

  it('[route-mocks] keeps a null JSON answer as an answer', () => {
    expect(parseRouteMocks([{ json: null, url: '**/me' }])).toEqual({
      data: [
        { response: { json: null, kind: 'json', status: 200 }, url: '**/me' }
      ],
      status: 'success'
    })
  })

  it.each([
    [{ json: {} }, 'no url'],
    [{ json: {}, url: '' }, 'an empty url'],
    [{ url: '**/api' }, 'no answer'],
    [{ body: 3, url: '**/api' }, 'a body that is not text'],
    [
      { body: 'x', contentType: 1, url: '**/api' },
      'a content type that is not text'
    ],
    [{ json: {}, status: 700, url: '**/api' }, 'a status out of range'],
    ['**/api', 'not an object']
  ])('[route-mocks] refuses %j (%s), naming its position', (mock, _reason) => {
    expect(parseRouteMocks([{ abort: true, url: '**/ok' }, mock])).toEqual({
      error: { code: 'invalid_mock', index: 1 },
      status: 'failure'
    })
  })

  it('[route-mocks] refuses a file that is not a list', () => {
    expect(parseRouteMocks({ url: '**/api' })).toEqual({
      error: { code: 'not_a_list' },
      status: 'failure'
    })
  })
})

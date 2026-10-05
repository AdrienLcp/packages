import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { measureOverflow } from './measure-overflow.ts'

const VIEWPORT_WIDTH = 320

const boxFrom = (element: Element): DOMRect => {
  const left = Number(element.getAttribute('data-left') ?? 0)
  const right = Number(element.getAttribute('data-right') ?? 100)
  return new DOMRect(left, 0, right - left, 20)
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      return boxFrom(this)
    }
  )
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
    VIEWPORT_WIDTH
  )
  vi.spyOn(document.documentElement, 'scrollWidth', 'get').mockReturnValue(
    VIEWPORT_WIDTH + 80
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('measureOverflow', () => {
  it('[measure-overflow] reports the document and viewport widths', () => {
    expect(measureOverflow()).toMatchObject({
      documentWidth: 400,
      viewportWidth: VIEWPORT_WIDTH
    })
  })

  it('[measure-overflow] lists what sticks out past either edge, with a path from body', () => {
    document.body.innerHTML = `
      <main data-right="400">
        <p>fits</p>
        <div id="plate" class="card wide extra" data-right="400"></div>
      </main>
      <aside data-left="-12"></aside>`

    expect(measureOverflow().candidates).toEqual([
      { label: 'main', left: 0, path: 'main:nth-child(1)', right: 400 },
      {
        label: 'div#plate.card.wide',
        left: 0,
        path: 'main:nth-child(1)>div:nth-child(2)',
        right: 400
      },
      { label: 'aside', left: -12, path: 'aside:nth-child(2)', right: 100 }
    ])
  })

  it('[measure-overflow] leaves out what a scroll container clips, and what has no width', () => {
    document.body.innerHTML = `
      <div style="overflow-x: auto"><table data-right="900"></table></div>
      <span data-left="400" data-right="400"></span>`

    expect(measureOverflow().candidates).toEqual([])
  })
})

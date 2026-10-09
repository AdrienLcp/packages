import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Result } from '@adrienlcp/result'
import { parseHTML } from 'linkedom'

export type DistFailure = 'no-html' | 'bad-selector'

const ELEMENT_NODE = 1
const TEXT_NODE = 3
const HIDDEN_ELEMENTS = new Set([
  'head',
  'noscript',
  'script',
  'style',
  'template'
])

type TextTreeNode = {
  nodeType: number
  nodeName: string
  textContent: string | null
  childNodes: ArrayLike<TextTreeNode>
  parentNode: TextTreeNode | null
}

const isTextTreeNode = (value: unknown): value is TextTreeNode =>
  typeof value === 'object' &&
  value !== null &&
  'nodeType' in value &&
  'childNodes' in value

const hasAncestorIn = (
  node: TextTreeNode,
  nodes: ReadonlySet<TextTreeNode>
): boolean =>
  node.parentNode !== null &&
  (nodes.has(node.parentNode) || hasAncestorIn(node.parentNode, nodes))

const shownText = (node: TextTreeNode): string[] => {
  if (node.nodeType === TEXT_NODE) return [node.textContent ?? '']
  if (
    node.nodeType !== ELEMENT_NODE ||
    HIDDEN_ELEMENTS.has(node.nodeName.toLowerCase())
  )
    return []
  return Array.from(node.childNodes).flatMap(shownText)
}

/**
 * The text a prerendered page shows, one text node per line: the body's, or
 * only the elements `selector` matches — `h1, h2` for the text set at the
 * headings' weight. Scripts, styles, templates and `noscript` are left out.
 */
export const pageText = (
  html: string,
  selector?: string
): Result<string, 'bad-selector'> => {
  const { document } = parseHTML(html)
  const root: unknown = document.documentElement
  if (selector === undefined)
    return Result.success(
      (isTextTreeNode(root) ? shownText(root) : []).join('\n')
    )
  try {
    const matched = new Set(
      Array.from<unknown>(document.querySelectorAll(selector)).filter(
        isTextTreeNode
      )
    )
    const outermost = [...matched].filter(
      (element) => !hasAncestorIn(element, matched)
    )
    return Result.success(outermost.flatMap(shownText).join('\n'))
  } catch {
    return Result.failure('bad-selector')
  }
}

const htmlFilesIn = (directory: string): string[] =>
  readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
    .toSorted()

/** The text of every `.html` page under `directory`, as {@link pageText} reads one. */
export const readDistText = (
  directory: string,
  selector?: string
): Result<string, DistFailure> => {
  const files = htmlFilesIn(directory)
  if (files.length === 0) return Result.failure('no-html')
  const pages = files.map((file) =>
    pageText(readFileSync(file, 'utf8'), selector)
  )
  const failed = pages.find((page) => page.status === 'failure')
  if (failed !== undefined) return failed
  return Result.success(
    pages
      .flatMap((page) =>
        page.status === 'success' && page.data !== '' ? [page.data] : []
      )
      .join('\n')
  )
}

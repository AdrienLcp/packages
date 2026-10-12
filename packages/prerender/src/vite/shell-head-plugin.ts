import type { Plugin } from 'vite'

import {
  type ShellHeadOptions,
  shellHeadTransform
} from './shell-head-transform.ts'

/**
 * Writes one page's head into the shell, `index.html`, so the document
 * `pnpm dev` and the SPA fallback serve carries real copy rather than an empty
 * title. Read the values from where the app keeps its page heads, so the two
 * cannot drift; the prerender then rewrites the head per document.
 */
export const shellHead = (options: ShellHeadOptions): Plugin => ({
  name: '@adrienlcp/prerender:shell-head',
  transformIndexHtml: { handler: shellHeadTransform(options), order: 'pre' }
})

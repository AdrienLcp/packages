/** Firefox named it differently before adopting the standard name. */
const QUOTA_EXCEEDED_NAMES = [
  'QuotaExceededError',
  'NS_ERROR_DOM_QUOTA_REACHED'
]

export const isQuotaExceeded = (error: unknown): boolean =>
  error instanceof DOMException && QUOTA_EXCEEDED_NAMES.includes(error.name)

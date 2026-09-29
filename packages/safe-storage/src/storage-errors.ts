/**
 * `localStorage` threw on access: a Safari private window, storage blocked by
 * the user or a policy, or no `localStorage` at all, as on a server.
 */
export type StorageUnavailable = 'unavailable'

/** Something is stored under the key, but not a value the caller recognizes. */
export type StoredValueUnrecognized = 'unrecognized'

/** The browser refused the write because the origin's storage is full. */
export type StorageQuotaExceeded = 'quota'

export type StorageReadError = StorageUnavailable | StoredValueUnrecognized

export type StorageWriteError = StorageUnavailable | StorageQuotaExceeded

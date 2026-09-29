# @adrienlcp/i18n

## 0.1.1

### Patch Changes

- 152b3c0: `createI18n` refuses a `defaultLocale` typed as a union of locales (`const DEFAULT_LOCALE: Locale = 'en'`). Such a value made the reference dictionary every locale's at once, so keys with placeholders resolved to `never` at the call site; the error now shows up at `defaultLocale` and says how to declare it.

  The `DictionaryFor` documentation now says it is for `createTranslator` only: a locale registered with `createI18n` is written through `defineDictionary`.

import type { Translator } from '@adrienlcp/i18n'

import type { EN_DICTIONARY } from './dictionary-en'

export type Translate = Translator<typeof EN_DICTIONARY>

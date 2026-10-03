import type React from 'react'
import { useEffect, useState } from 'react'

import { NpmLogo } from '@/features/packages/ecosystem-logo'
import { copyToClipboard } from '@/infrastructure/browser'
import { IconSquare } from '@/presentation/components/icon-square'
import { CheckIcon, CopyIcon } from '@/presentation/components/icons'
import { TextButton } from '@/presentation/components/ui/text-button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './package-install.sass'

type CopyState = 'copied' | 'failed' | 'idle'

const COPY_FEEDBACK_MS = 1600

/** How long the button says what happened before it offers to copy again. */
const useCopyState = () => {
  const [copyState, setCopyState] = useState<CopyState>('idle')

  useEffect(() => {
    if (copyState === 'idle') {
      return
    }

    const timeout = setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS)

    return () => clearTimeout(timeout)
  }, [copyState])

  return [copyState, setCopyState] as const
}

/** The command that adds the package, and a button that copies it. */
export const PackageInstall: React.FC<{ command: string }> = ({ command }) => {
  const translate = useTranslate()
  const [copyState, setCopyState] = useCopyState()

  const copyCommand = async (): Promise<void> => {
    const copied = await copyToClipboard(command)
    setCopyState(copied.status === 'success' ? 'copied' : 'failed')
  }

  return (
    <div className='package-install'>
      <IconSquare tone='neutral'>
        <NpmLogo />
      </IconSquare>
      <code className='package-install-command'>{command}</code>
      <TextButton onPress={copyCommand}>
        {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
        <span aria-live='polite'>
          {copyState === 'idle' && translate('install.copy')}
          {copyState === 'copied' && translate('install.copied')}
          {copyState === 'failed' && translate('install.copyFailed')}
        </span>
      </TextButton>
    </div>
  )
}

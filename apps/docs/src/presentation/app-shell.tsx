import type React from 'react'

import './app-shell.sass'

type AppShellProps = {
  children: React.ReactNode
  /** Under the page, in its column. */
  footer?: React.ReactNode
  /**
   * Left out by the error screen, which must not depend on chrome that may be
   * what broke.
   */
  header?: React.ReactNode
  /** Beside the page on a wide screen; gone on a narrow one. */
  sidebar?: React.ReactNode
}

/** The settings app's two panes: a list of places on the left, the place on the right. */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  footer,
  header,
  sidebar
}) => (
  <div className='app-shell'>
    {header}
    <div className='app-panes'>
      {sidebar}
      <div className='app-pane'>
        {children}
        {footer}
      </div>
    </div>
  </div>
)

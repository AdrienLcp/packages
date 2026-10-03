import type React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { routes } from './routes'

const router = createBrowserRouter(routes)

export const BrowserRouterProvider: React.FC = () => (
  <RouterProvider router={router} />
)

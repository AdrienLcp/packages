import { CATALOGUE } from '@/features/packages/catalogue-content'
import { useRouteData } from '@/infrastructure/router/navigation'

export const homeLoader = () => ({
  packages: CATALOGUE
})

export const useHomeData = () => useRouteData<typeof homeLoader>()

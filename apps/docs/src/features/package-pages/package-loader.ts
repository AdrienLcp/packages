import { CATALOGUE } from '@/features/packages/catalogue-content'
import { PACKAGE_DOCUMENTS } from '@/features/packages/documents-content'
import { useRouteData } from '@/infrastructure/router/navigation'

/** `packageName` is the URL's last segment, the name without its `@adrienlcp/` scope. */
export const packageLoader = ({ packageName }: { packageName: string }) => ({
  documentation: PACKAGE_DOCUMENTS[packageName] ?? [],
  documentedPackage:
    CATALOGUE.find((housePackage) => housePackage.name === packageName) ?? null
})

export const usePackageData = () => useRouteData<typeof packageLoader>()

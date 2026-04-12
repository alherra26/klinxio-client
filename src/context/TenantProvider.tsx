import type { ReactNode } from 'react'
import { TenantContext } from './tenantContext'

interface TenantProviderProps {
  tenantId: string | null
  children: ReactNode
}

export function TenantProvider({ tenantId, children }: TenantProviderProps) {
  return <TenantContext.Provider value={tenantId}>{children}</TenantContext.Provider>
}

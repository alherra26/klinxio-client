import { createContext, useContext } from 'react'

export const TenantContext = createContext<string | null>(null)

export function useTenantId() {
  return useContext(TenantContext)
}

function sanitizeTenantId(value: string | null): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function getTenantIdFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const markerSegments = ['tenant', 'tenants', 'booking']

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]?.toLowerCase()
    if (markerSegments.includes(segment)) {
      return sanitizeTenantId(decodeURIComponent(segments[index + 1]))
    }
  }

  return null
}

export function getTenantIdFromLocation(location: Pick<Location, 'search' | 'pathname' | 'hash'>): string | null {
  const searchParams = new URLSearchParams(location.search)
  const searchTenantId = sanitizeTenantId(searchParams.get('tenantId'))
  if (searchTenantId) {
    return searchTenantId
  }

  const pathnameTenantId = getTenantIdFromPathname(location.pathname)
  if (pathnameTenantId) {
    return pathnameTenantId
  }

  const hashQueryIndex = location.hash.indexOf('?')
  if (hashQueryIndex !== -1) {
    const hashSearchParams = new URLSearchParams(location.hash.slice(hashQueryIndex + 1))
    const hashTenantId = sanitizeTenantId(hashSearchParams.get('tenantId'))
    if (hashTenantId) {
      return hashTenantId
    }
  }

  return null
}

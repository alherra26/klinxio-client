import { PublicBookingWidget } from './components/PublicBookingWidget'
import { TenantProvider } from './context/TenantProvider'

function App() {
  const contextTenantId = import.meta.env.VITE_TENANT_ID ?? 'CLINICA_TEST'

  return (
    <TenantProvider tenantId={contextTenantId}>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <PublicBookingWidget />
      </main>
    </TenantProvider>
  )
}

export default App

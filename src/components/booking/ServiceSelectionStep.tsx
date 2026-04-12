import type { Service } from '../../types/booking'

interface ServiceSelectionStepProps {
  services: Service[]
  selectedServiceId: string | null
  isLoadingServices: boolean
  serviceError: string | null
  onSelectService: (service: Service) => void
  onRetryLoadingServices: () => void
}

function formatDuration(durationMinutes: number): string {
  return `${durationMinutes} min`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function ServiceSelectionStep({
  services,
  selectedServiceId,
  isLoadingServices,
  serviceError,
  onSelectService,
  onRetryLoadingServices,
}: ServiceSelectionStepProps) {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Step 1 of 5</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Select your service</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Choose the clinical pathway that best suits your current health needs. Our specialists are
          ready to provide premium care.
        </p>
      </header>

      {isLoadingServices ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <p role="status" className="sr-only">
            Loading services...
          </p>
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
              <div className="mt-5 h-7 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            </article>
          ))}
        </div>
      ) : null}

      {!isLoadingServices && serviceError ? (
        <article className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Unable to load services</h2>
          <p className="mt-2 text-sm text-slate-700">{serviceError}</p>
          <button
            type="button"
            onClick={onRetryLoadingServices}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Retry
          </button>
        </article>
      ) : null}

      {!isLoadingServices && !serviceError ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.length === 0 ? (
            <article className="md:col-span-2 xl:col-span-3 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <h2 className="text-xl font-semibold text-slate-900">No services found</h2>
              <p className="mt-2 text-sm text-slate-600">
                We could not find active services for this clinic. Please try again in a moment.
              </p>
            </article>
          ) : null}

          {services.map((service) => {
            const isSelected = selectedServiceId === service.id
            return (
              <article
                key={service.id}
                className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? 'border-cyan-700 ring-2 ring-cyan-600/50' : 'border-slate-200'
                }`}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-2xl">
                  {service.icon}
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">{service.name}</h2>
                <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">{service.description}</p>

                <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-xs tracking-[0.1em] text-slate-500 uppercase">Duration</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs tracking-[0.1em] text-slate-500 uppercase">Price</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-700">{formatPrice(service.price)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Select
                </button>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

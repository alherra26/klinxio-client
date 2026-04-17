import type { Professional } from '../../types/booking'

interface ProfessionalSelectionStepProps {
  staff: Professional[]
  selectedProviderId: string | null
  isLoadingStaff: boolean
  staffError: string | null
  onSelectProvider: (providerId: string | null) => void
  onRetryLoadingStaff: () => void
  onBackToServices: () => void
}

const NO_PREFERENCE_PROVIDER_ID = '__no_preference__'

export function ProfessionalSelectionStep({
  staff,
  selectedProviderId,
  isLoadingStaff,
  staffError,
  onSelectProvider,
  onRetryLoadingStaff,
  onBackToServices,
}: ProfessionalSelectionStepProps) {
  const shouldShowNoPreferenceOption = staff.length > 1
  const providerCards = [
    ...(shouldShowNoPreferenceOption
      ? [
          {
            id: NO_PREFERENCE_PROVIDER_ID,
            name: 'Any Professional',
            subtitle: 'No Preference',
            initials: '',
            avatarClassName: 'bg-slate-700 text-white',
            avatarUrl: null as string | null,
            isNoPreference: true,
          },
        ]
      : []),
    ...staff.map((provider) => ({
      id: provider.id,
      name: provider.name,
      subtitle: provider.role,
      initials: provider.initials,
      avatarClassName: provider.avatarClassName,
      avatarUrl: provider.avatarUrl ?? null,
      isNoPreference: false,
    })),
  ]

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Step 2 of 5</p>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Select Professional</h2>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Select your preferred professional or continue with no preference.
        </p>
      </header>

      {isLoadingStaff ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <p role="status" className="sr-only">
            Loading professionals...
          </p>
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-5 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            </article>
          ))}
        </div>
      ) : null}

      {!isLoadingStaff && staffError ? (
        <article className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-xl font-semibold text-slate-900">Unable to load professionals</h3>
          <p className="mt-2 text-sm text-slate-700">{staffError}</p>
          <button
            type="button"
            onClick={onRetryLoadingStaff}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Retry
          </button>
        </article>
      ) : null}

      {!isLoadingStaff && !staffError && staff.length === 0 ? (
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-xl font-semibold text-slate-900">No professionals available</h3>
          <p className="mt-2 text-sm text-slate-700">
            No professionals are available for this service at the moment.
          </p>
        </article>
      ) : null}

      {!isLoadingStaff && !staffError && staff.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {providerCards.map((provider) => {
            const isSelected =
              provider.isNoPreference ? selectedProviderId === null : selectedProviderId === provider.id

            return (
              <article
                key={provider.id}
                className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? 'border-cyan-700 ring-2 ring-cyan-600/50' : 'border-slate-200'
                }`}
              >
                {provider.avatarUrl ? (
                  <img
                    src={provider.avatarUrl}
                    alt={`${provider.name} avatar`}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold ${provider.avatarClassName}`}
                  >
                    {provider.isNoPreference ? '👤' : provider.initials}
                  </div>
                )}

                <h3 className="mt-5 text-2xl font-semibold text-slate-900">{provider.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{provider.subtitle}</p>

                <button
                  type="button"
                  onClick={() => onSelectProvider(provider.isNoPreference ? null : provider.id)}
                  className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  Select
                </button>
              </article>
            )
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onBackToServices}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Back to services
      </button>
    </section>
  )
}

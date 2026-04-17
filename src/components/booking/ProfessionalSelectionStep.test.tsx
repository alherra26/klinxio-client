import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Professional } from '../../types/booking'
import { ProfessionalSelectionStep } from './ProfessionalSelectionStep'

function buildProvider(overrides: Partial<Professional>): Professional {
  return {
    id: 'provider-1',
    name: 'Evan Carter',
    initials: 'EC',
    role: 'Dermatologist',
    avatarClassName: 'bg-sky-600 text-white',
    avatarUrl: null,
    ...overrides,
  }
}

function renderStep(staff: Professional[]) {
  return render(
    <ProfessionalSelectionStep
      staff={staff}
      selectedProviderId={null}
      isLoadingStaff={false}
      staffError={null}
      onSelectProvider={vi.fn()}
      onRetryLoadingStaff={vi.fn()}
      onBackToServices={vi.fn()}
    />,
  )
}

describe('ProfessionalSelectionStep', () => {
  it('renders Any Professional first when multiple providers are available', () => {
    renderStep([
      buildProvider({ id: 'provider-1', name: 'Evan Carter', initials: 'EC' }),
      buildProvider({ id: 'provider-2', name: 'Mina Kim', initials: 'MK' }),
    ])

    const providerHeadings = screen.getAllByRole('heading', { level: 3 }).map((element) => element.textContent?.trim())
    expect(providerHeadings).toEqual(['Any Professional', 'Evan Carter', 'Mina Kim'])
  })

  it('does not render Any Professional when a single provider is available', () => {
    renderStep([buildProvider({ id: 'provider-1', name: 'Evan Carter', initials: 'EC' })])

    expect(screen.queryByRole('heading', { name: /any professional/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /evan carter/i })).toBeInTheDocument()
  })

  it('renders an empty state when no providers are available', () => {
    renderStep([])

    expect(screen.getByRole('heading', { name: /no professionals available/i })).toBeInTheDocument()
    expect(screen.getByText(/no professionals are available for this service at the moment/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /any professional/i })).not.toBeInTheDocument()
  })
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { PublicBookingWidget } from './PublicBookingWidget'
import { server } from '../test/msw/server'

function renderWidget() {
  return render(<PublicBookingWidget />)
}

describe('PublicBookingWidget', () => {
  it('shows loading state on initial mount', async () => {
    renderWidget()

    expect(await screen.findByText(/loading services/i)).toBeInTheDocument()
  })

  it('shows API error with retry action', async () => {
    server.use(
      http.get('*/public/services/:tenantId', () => {
        return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
      }),
    )

    renderWidget()

    expect(await screen.findByText(/unable to load services/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('renders services from API and advances to Step 2 professional selection', async () => {
    const user = userEvent.setup()
    renderWidget()

    const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
    expect(serviceHeading).toBeInTheDocument()

    const card = serviceHeading.closest('article')
    if (!card) {
      throw new Error('Service card was not rendered.')
    }

    await user.click(within(card).getByRole('button', { name: /select/i }))

    expect(await screen.findByRole('heading', { name: /select professional/i })).toBeInTheDocument()
  })

  it('validates empty patient details form submission in Step 4', async () => {
    const user = userEvent.setup()
    renderWidget()

    const firstServiceSelectButton = (await screen.findAllByRole('button', { name: /select/i }))[0]
    await user.click(firstServiceSelectButton)
    expect(await screen.findByRole('heading', { name: /select professional/i })).toBeInTheDocument()

    const noPreferenceCardHeading = await screen.findByRole('heading', { name: /any professional/i })
    const noPreferenceCard = noPreferenceCardHeading.closest('article')
    if (!noPreferenceCard) {
      throw new Error('No preference provider card was not rendered.')
    }

    await user.click(within(noPreferenceCard).getByRole('button', { name: /select/i }))

    expect((await screen.findAllByRole('heading', { name: /select date & time/i })).length).toBeGreaterThan(
      0,
    )

    const firstSlotTimeLabel = (await screen.findAllByText(/\d{2}:\d{2}/))[0]
    const firstAvailableSlotButton = firstSlotTimeLabel.closest('button')
    if (!firstAvailableSlotButton) {
      throw new Error('Unable to resolve time slot button from rendered slot label.')
    }
    await user.click(firstAvailableSlotButton)
    expect(await screen.findByRole('heading', { name: /patient details/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByText(/please complete all required fields/i)).toBeInTheDocument()
  })

  it('shows professional API error with retry action', async () => {
    server.use(
      http.get('*/public/staff/:tenantId', () => {
        return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
      }),
    )

    const user = userEvent.setup()
    renderWidget()

    const firstServiceSelectButton = (await screen.findAllByRole('button', { name: /select/i }))[0]
    await user.click(firstServiceSelectButton)

    expect(await screen.findByText(/unable to load professionals/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

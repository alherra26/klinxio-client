import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { TenantProvider } from '../context/TenantProvider'
import { server } from '../test/msw/server'
import { PublicBookingWidget } from './PublicBookingWidget'

function renderWidget() {
  return render(
    <TenantProvider tenantId="CLINICA_TEST">
      <PublicBookingWidget />
    </TenantProvider>,
  )
}

async function goToContactStep(user: ReturnType<typeof userEvent.setup>) {
  const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
  const serviceCard = serviceHeading.closest('article')
  if (!serviceCard) {
    throw new Error('Service card was not rendered.')
  }
  await user.click(within(serviceCard).getByRole('button', { name: /select/i }))
  expect(await screen.findByRole('heading', { name: /select professional/i })).toBeInTheDocument()

  const noPreferenceCardHeading = await screen.findByRole('heading', { name: /any professional/i })
  const noPreferenceCard = noPreferenceCardHeading.closest('article')
  if (!noPreferenceCard) {
    throw new Error('No preference provider card was not rendered.')
  }
  await user.click(within(noPreferenceCard).getByRole('button', { name: /select/i }))

  expect(await screen.findByRole('heading', { name: /select day & time/i })).toBeInTheDocument()
  const dayButtons = await screen.findAllByTestId(/day-button-/)
  await user.click(dayButtons[0])

  const slotButtons = await screen.findAllByTestId(/slot-button-/)
  await user.click(slotButtons[0])

  expect(await screen.findByRole('heading', { name: /contact information/i })).toBeInTheDocument()
}

describe('PublicBookingWidget', () => {
  it('shows loading state on initial mount', async () => {
    renderWidget()
    expect(await screen.findByText(/loading services/i)).toBeInTheDocument()
  })

  it('shows service API error with retry action', async () => {
    server.use(
      http.get('*/public/services/:tenantId', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    )

    renderWidget()
    expect(await screen.findByText(/unable to load services/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows professional API error with retry action', async () => {
    server.use(
      http.get('*/public/staff/:tenantId', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    )

    const user = userEvent.setup()
    renderWidget()

    const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
    const serviceCard = serviceHeading.closest('article')
    if (!serviceCard) {
      throw new Error('Service card was not rendered.')
    }
    await user.click(within(serviceCard).getByRole('button', { name: /select/i }))

    expect(await screen.findByText(/unable to load professionals/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows provider name from name fallback and avoids Provider label', async () => {
    server.use(
      http.get('*/public/staff/:tenantId', () =>
        HttpResponse.json({
          data: [
            {
              id: 'provider-1',
              name: 'Dra. Laura Mendez',
              role: 'Dermatologist',
              avatarUrl: null,
            },
          ],
        }),
      ),
    )

    const user = userEvent.setup()
    renderWidget()

    const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
    const serviceCard = serviceHeading.closest('article')
    if (!serviceCard) {
      throw new Error('Service card was not rendered.')
    }
    await user.click(within(serviceCard).getByRole('button', { name: /select/i }))

    expect(await screen.findByRole('heading', { name: /dra\. laura mendez/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^provider$/i })).not.toBeInTheDocument()
  })

  it('submits booking and shows confirmation on 201', async () => {
    const user = userEvent.setup()
    renderWidget()
    await goToContactStep(user)

    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/phone/i), '+1 555 111 222')
    await user.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByRole('heading', { name: /booking confirmed/i })).toBeInTheDocument()
  })

  it('handles 409 conflict by showing friendly message and returning to slot selection', async () => {
    const user = userEvent.setup()
    renderWidget()
    await goToContactStep(user)

    await user.type(screen.getByLabelText(/name/i), 'Conflict Case')
    await user.type(screen.getByLabelText(/phone/i), '+1 555 333 444')
    await user.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByText(/slot no longer available/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /select day & time/i })).toBeInTheDocument()
  })

  it('shows generic message on 500 booking error', async () => {
    const user = userEvent.setup()
    renderWidget()
    await goToContactStep(user)

    await user.type(screen.getByLabelText(/name/i), 'Server Error')
    await user.type(screen.getByLabelText(/phone/i), '+1 555 666 777')
    await user.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByText(/try again later/i)).toBeInTheDocument()
  })
})

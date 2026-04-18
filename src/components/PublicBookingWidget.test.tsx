import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { TenantProvider } from '../context/TenantProvider'
import { server } from '../test/msw/server'
import { PublicBookingWidget } from './PublicBookingWidget'

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  let slotButtons = screen.queryAllByTestId(/slot-button-/)
  if (slotButtons.length === 0) {
    await user.click(screen.getByRole('button', { name: /next/i }))
    slotButtons = await screen.findAllByTestId(/slot-button-/)
  }
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

  it('requests professionals with selected serviceId query parameter', async () => {
    let requestedServiceId: string | null = null

    server.use(
      http.get('*/public/staff/:tenantId', ({ request }) => {
        const requestUrl = new URL(request.url)
        requestedServiceId = requestUrl.searchParams.get('serviceId')

        return HttpResponse.json({
          data: [
            {
              id: 'provider-1',
              name: 'Evan Carter',
              role: 'Dermatologist',
              avatarUrl: null,
            },
          ],
        })
      }),
    )

    const user = userEvent.setup()
    renderWidget()

    const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
    const serviceCard = serviceHeading.closest('article')
    if (!serviceCard) {
      throw new Error('Service card was not rendered.')
    }

    await user.click(within(serviceCard).getByRole('button', { name: /select/i }))

    expect(await screen.findByRole('heading', { name: /select professional/i })).toBeInTheDocument()
    expect(requestedServiceId).toBe('general-consultation')
  })

  it('requests weekly availability with ANY providerId, serviceId, and startDate', async () => {
    let requestedProviderId: string | null = null
    let requestedServiceId: string | null = null
    let requestedStartDate: string | null = null

    server.use(
      http.get('*/public/availability/:tenantId', ({ request }) => {
        const requestUrl = new URL(request.url)
        requestedProviderId = requestUrl.searchParams.get('providerId')
        requestedServiceId = requestUrl.searchParams.get('serviceId')
        requestedStartDate = requestUrl.searchParams.get('startDate')

        return HttpResponse.json({
          weekData: {
            '2026-04-18': [{ time: '10:00', availableProviderIds: ['provider-1', 'provider-2'] }],
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderWidget()

    const serviceHeading = await screen.findByRole('heading', { name: /general consultation/i })
    const serviceCard = serviceHeading.closest('article')
    if (!serviceCard) {
      throw new Error('Service card was not rendered.')
    }
    await user.click(within(serviceCard).getByRole('button', { name: /select/i }))

    const noPreferenceCardHeading = await screen.findByRole('heading', { name: /any professional/i })
    const noPreferenceCard = noPreferenceCardHeading.closest('article')
    if (!noPreferenceCard) {
      throw new Error('No preference provider card was not rendered.')
    }
    await user.click(within(noPreferenceCard).getByRole('button', { name: /select/i }))

    await screen.findByRole('heading', { name: /select day & time/i })

    expect(requestedProviderId).toBe('ANY')
    expect(requestedServiceId).toBe('general-consultation')
    expect(requestedStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('submits booking with the assigned provider from selected slot when ANY is selected', async () => {
    let submittedProviderId: string | null = null
    const todayIsoDate = formatIsoDate(new Date())
    const selectableTime = '23:59'

    server.use(
      http.get('*/public/availability/:tenantId', () =>
        HttpResponse.json({
          weekData: {
            [todayIsoDate]: [{ time: selectableTime, availableProviderIds: ['provider-2', 'provider-1'] }],
          },
        }),
      ),
      http.post('*/public/appointments/:tenantId', async ({ request }) => {
        const payload = (await request.json()) as { providerId?: string }
        submittedProviderId = payload.providerId ?? null
        return HttpResponse.json({ status: 'confirmed' }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWidget()
    await goToContactStep(user)

    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/phone/i), '+1 555 111 222')
    await user.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByRole('heading', { name: /booking confirmed/i })).toBeInTheDocument()
    expect(submittedProviderId).toBe('provider-2')
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

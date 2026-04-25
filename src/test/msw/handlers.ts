import { delay, http, HttpResponse } from 'msw'

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const handlers = [
  http.get('*/public/services/:tenantId', async () => {
    await delay(150)

    return HttpResponse.json({
      data: [
        {
          id: 'general-consultation',
          name: 'General Consultation',
          durationMinutes: 30,
          price: 100,
          description:
            'A comprehensive primary assessment for general wellness and acute symptoms.',
        },
        {
          id: 'specialist-follow-up',
          name: 'Specialist Follow-up',
          durationMinutes: 45,
          price: 180,
          description:
            'Dedicated time for chronic care management or detailed specialist review.',
        },
      ],
    })
  }),
  http.get('*/public/staff/:tenantId', async ({ request }) => {
    await delay(120)
    const requestUrl = new URL(request.url)
    const serviceId = requestUrl.searchParams.get('serviceId')

    if (!serviceId) {
      return HttpResponse.json({ message: 'serviceId query parameter is required' }, { status: 400 })
    }

    return HttpResponse.json({
      data: [
        {
          id: 'provider-1',
          name: 'Evan Carter',
          role: 'Dermatologist',
          avatarUrl: null,
        },
        {
          id: 'provider-2',
          name: 'Mina Kim',
          role: 'General Practitioner',
          avatarUrl: null,
        },
      ],
    })
  }),
  http.get('*/public/availability/:tenantId', async ({ request }) => {
    await delay(120)

    const requestUrl = new URL(request.url)
    const selectedProviderId = requestUrl.searchParams.get('providerId')
    const serviceId = requestUrl.searchParams.get('serviceId')
    const startDate = requestUrl.searchParams.get('startDate') ?? '2026-04-18'

    if (!serviceId || !selectedProviderId) {
      return HttpResponse.json({ message: 'serviceId and providerId query parameters are required' }, { status: 400 })
    }

    const baseDate = new Date(`${startDate}T00:00:00`)
    const weekData: Record<string, Array<{ time: string; availableProviderIds: string[] }>> = {}

    for (let index = 0; index < 7; index += 1) {
      const isoDate = formatIsoDate(new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000))
      const hasSlots = index % 2 === 0
      weekData[isoDate] = hasSlots
        ? [
            {
              time: '09:00',
              availableProviderIds:
                selectedProviderId === 'ANY' ? ['provider-1', 'provider-2'] : [selectedProviderId],
            },
            {
              time: '10:30',
              availableProviderIds: selectedProviderId === 'ANY' ? ['provider-1'] : [selectedProviderId],
            },
          ]
        : []
    }

    return HttpResponse.json({
      weekData,
    })
  }),
  http.post('*/public/appointments/:tenantId', async ({ request }) => {
    await delay(100)

    const payload = (await request.json()) as {
      customer?: { name?: string; phone?: string; email?: string }
      time?: string
    }

    if (payload.customer?.name === 'Conflict Case') {
      return HttpResponse.json({ message: 'Slot already taken' }, { status: 409 })
    }

    if (payload.customer?.name === 'Server Error') {
      return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
    }

    if (!payload.customer?.name || !payload.customer?.phone || !payload.customer?.email || !payload.time) {
      return HttpResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    return HttpResponse.json({ status: 'confirmed' }, { status: 201 })
  }),
]

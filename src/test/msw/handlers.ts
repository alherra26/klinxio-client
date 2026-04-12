import { delay, http, HttpResponse } from 'msw'

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
  http.get('*/public/staff/:tenantId', async () => {
    await delay(120)

    return HttpResponse.json({
      data: [
        {
          id: 'provider-1',
          firstName: 'Evan',
          lastName: 'Carter',
          role: 'Dermatologist',
          avatarUrl: null,
        },
        {
          id: 'provider-2',
          firstName: 'Mina',
          lastName: 'Kim',
          role: 'General Practitioner',
          avatarUrl: null,
        },
      ],
    })
  }),
  http.get('*/public/availability/:tenantId', async ({ request }) => {
    await delay(120)

    const requestUrl = new URL(request.url)
    const selectedProviderId = requestUrl.searchParams.get('providerId') ?? ''
    const date = requestUrl.searchParams.get('date') ?? '2026-04-06'
    const startTimes = date.endsWith('-06') ? ['09:00', '10:30'] : ['11:00']

    return HttpResponse.json({
      data: {
        date,
        availableSlots: startTimes.map((startTime, index) => ({
          slotId: `${selectedProviderId || 'any'}-${date}-${index + 1}`,
          startTime,
          endTime: index === 0 ? '09:30' : '11:00',
          bufferEnd: index === 0 ? '09:40' : '11:10',
        })),
      },
    })
  }),
  http.post('*/public/appointments/:tenantId', async ({ request }) => {
    await delay(100)

    const payload = (await request.json()) as {
      customer?: { name?: string; phone?: string }
      startTime?: string
    }

    if (payload.customer?.name === 'Conflict Case') {
      return HttpResponse.json({ message: 'Slot already taken' }, { status: 409 })
    }

    if (payload.customer?.name === 'Server Error') {
      return HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
    }

    if (!payload.customer?.name || !payload.customer?.phone || !payload.startTime) {
      return HttpResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    return HttpResponse.json({ status: 'confirmed' }, { status: 201 })
  }),
]

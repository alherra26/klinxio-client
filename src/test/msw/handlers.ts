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

    return HttpResponse.json({
      data: [
        {
          isoDate: '2026-04-06T00:00:00.000Z',
          dayShortLabel: 'Mon',
          dayNumber: 6,
          slots: [
            {
              id: 'slot-1',
              time: '09:00',
              isAvailable: true,
              professionalIds: selectedProviderId ? [selectedProviderId] : ['provider-1', 'provider-2'],
            },
            {
              id: 'slot-2',
              time: '10:30',
              isAvailable: false,
              professionalIds: [],
            },
          ],
        },
      ],
    })
  }),
]

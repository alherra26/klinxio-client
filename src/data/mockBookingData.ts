import { addDays } from '../utils/date'
import type { DaySchedule, Professional, Service } from '../types/booking'

const SLOT_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']

export const services: Service[] = [
  {
    id: 'general-consultation',
    name: 'General Consultation',
    description: 'A comprehensive primary assessment for general wellness and acute symptoms.',
    durationMinutes: 30,
    price: 100,
    icon: '🩺',
  },
  {
    id: 'specialist-follow-up',
    name: 'Specialist Follow-up',
    description: 'Dedicated time for chronic care management or detailed specialist review.',
    durationMinutes: 45,
    price: 180,
    icon: '🫀',
  },
  {
    id: 'diagnostic-test',
    name: 'Diagnostic Test',
    description: 'Advanced screening including blood work, imaging analysis, and laboratory review.',
    durationMinutes: 20,
    price: 150,
    icon: '🧪',
  },
]

export const professionals: Professional[] = [
  {
    id: 'dr-carter',
    name: 'Dr. Carter',
    initials: 'DC',
    role: 'General Practitioner',
    avatarClassName: 'bg-sky-600 text-white',
  },
  {
    id: 'dr-kim',
    name: 'Dr. Kim',
    initials: 'DK',
    role: 'Cardiologist',
    avatarClassName: 'bg-emerald-600 text-white',
  },
  {
    id: 'dr-ross',
    name: 'Dr. Ross',
    initials: 'DR',
    role: 'Pulmonologist',
    avatarClassName: 'bg-violet-600 text-white',
  },
]

export function buildWeekSchedule(weekStart: Date, serviceId: string | null): DaySchedule[] {
  const serviceSeed = serviceId?.length ?? 3
  const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const dayDate = addDays(weekStart, dayIndex)
    const isoDate = dayDate.toISOString()

    const slots = SLOT_TIMES.map((time, slotIndex) => {
      const score = (dayIndex * 7 + slotIndex * 5 + serviceSeed) % 10
      const isAvailable = score !== 0 && score !== 4
      const professionalCount = ((dayIndex + slotIndex) % 3) + 1
      const professionalIds = isAvailable
        ? professionals.slice(0, professionalCount).map((professional) => professional.id)
        : []

      return {
        id: `${isoDate}-${time}`,
        time,
        isAvailable,
        professionalIds,
      }
    })

    return {
      isoDate,
      dayShortLabel: dayFormatter.format(dayDate),
      dayNumber: dayDate.getDate(),
      slots,
    }
  })
}

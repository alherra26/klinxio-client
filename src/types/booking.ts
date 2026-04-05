export interface Service {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  icon: string
}

export interface Professional {
  id: string
  name: string
  initials: string
  avatarClassName: string
}

export interface TimeSlot {
  id: string
  time: string
  isAvailable: boolean
  professionalIds: string[]
}

export interface DaySchedule {
  isoDate: string
  dayShortLabel: string
  dayNumber: number
  slots: TimeSlot[]
}

export interface SelectedSlot {
  slotId: string
  isoDate: string
  dayShortLabel: string
  time: string
  professionalIds: string[]
}

export interface PatientDetails {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export interface Service {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  icon: string
}

export interface PublicServiceApiItem {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
}

export interface PublicServicesApiResponse {
  data: PublicServiceApiItem[]
}

export interface PublicStaffApiItem {
  id: string
  firstName: string
  lastName: string
  role: string
  avatarUrl: string | null
}

export interface PublicStaffApiResponse {
  data: PublicStaffApiItem[]
}

export interface PublicAvailabilitySlotApiItem {
  id?: string
  time: string
  isAvailable: boolean
  professionalIds?: string[]
}

export interface PublicAvailabilityDayApiItem {
  isoDate: string
  dayShortLabel?: string
  dayNumber?: number
  slots: PublicAvailabilitySlotApiItem[]
}

export interface PublicAvailabilityApiResponse {
  data: PublicAvailabilityDayApiItem[]
}

export interface Professional {
  id: string
  name: string
  initials: string
  role: string
  avatarClassName: string
  avatarUrl?: string | null
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

export interface SelectedTimeSlot {
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

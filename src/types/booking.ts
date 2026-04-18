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
  name: string
  role: string
  avatarUrl: string | null
}

export interface PublicStaffApiResponse {
  data: PublicStaffApiItem[]
}

export interface PublicAvailabilitySlotApiItem {
  time: string
  availableProviderIds: string[]
}

export interface PublicAvailabilityApiResponse {
  weekData: Record<string, PublicAvailabilitySlotApiItem[]>
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
  date: string
  startTime: string
  endTime: string | null
  bufferEnd: string | null
}

export interface SelectedAppointment {
  date: string
  time: string
  assignedProviderId: string
}

export interface CalendarDay {
  isoDate: string
  dayShortLabel: string
  dayNumber: number
}

export interface PatientDetails {
  name: string
  phone: string
}

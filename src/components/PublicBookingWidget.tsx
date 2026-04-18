import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenantId } from '../context/tenantContext'
import type {
  CalendarDay,
  PatientDetails,
  Professional,
  PublicAvailabilitySlotApiItem,
  PublicAvailabilityApiResponse,
  PublicStaffApiResponse,
  PublicServicesApiResponse,
  SelectedAppointment,
  Service,
} from '../types/booking'
import { addDays, formatWeekRange, getStartOfWeek } from '../utils/date'
import { getTenantIdFromLocation } from '../utils/tenant'
import { PatientDetailsStep } from './booking/PatientDetailsStep'
import { ProfessionalSelectionStep } from './booking/ProfessionalSelectionStep'
import { ServiceSelectionStep } from './booking/ServiceSelectionStep'
import { SuccessStep } from './booking/SuccessStep'
import { WeeklyCalendarStep } from './booking/WeeklyCalendarStep'

const EMPTY_PATIENT_DETAILS: PatientDetails = {
  name: '',
  phone: '',
}

const STEP_COUNT = 5
const SERVICE_ICONS = ['🩺', '🫀', '🧪', '🧬', '💊']
const AVATAR_CLASS_NAMES = [
  'bg-sky-600 text-white',
  'bg-emerald-600 text-white',
  'bg-violet-600 text-white',
  'bg-amber-600 text-white',
]

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function PublicBookingWidget() {
  const contextTenantId = useTenantId()
  const [currentStep, setCurrentStep] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Professional[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [slotConflictMessage, setSlotConflictMessage] = useState<string | null>(null)
  const [weeklySlots, setWeeklySlots] = useState<Record<string, PublicAvailabilitySlotApiItem[]>>({})
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null)
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(EMPTY_PATIENT_DETAILS)

  const tenantId = useMemo(() => {
    if (typeof window === 'undefined') {
      return contextTenantId
    }

    return getTenantIdFromLocation(window.location) ?? contextTenantId
  }, [contextTenantId])

  const weekStart = useMemo(() => {
    const today = new Date()
    return getStartOfWeek(addDays(today, weekOffset * 7))
  }, [weekOffset])

  const weekDays = useMemo<CalendarDay[]>(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index)
        const isoDate = formatIsoDate(date)
        const dayShortLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
        return {
          isoDate,
          dayShortLabel,
          dayNumber: date.getDate(),
        }
      }),
    [weekStart],
  )

  const selectedProviderName = useMemo(() => {
    const finalProviderId = selectedAppointment?.assignedProviderId ?? selectedProviderId

    if (!finalProviderId) {
      return 'Any Professional'
    }

    return staff.find((provider) => provider.id === finalProviderId)?.name ?? 'Selected Professional'
  }, [selectedAppointment, selectedProviderId, staff])

  const availabilityStartDate = useMemo(() => {
    if (weekOffset === 0) {
      return formatIsoDate(new Date())
    }
    return formatIsoDate(weekStart)
  }, [weekOffset, weekStart])

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true)
    setServiceError(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      if (!baseUrl) {
        throw new Error('VITE_API_URL is not configured.')
      }
      if (!tenantId) {
        throw new Error('Tenant is missing from URL or app context.')
      }

      const response = await fetch(`${baseUrl}/public/services/${encodeURIComponent(tenantId)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch services (${response.status}).`)
      }

      const json = (await response.json()) as PublicServicesApiResponse
      const mappedServices: Service[] = (Array.isArray(json.data) ? json.data : []).map((service, index) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        icon: SERVICE_ICONS[index % SERVICE_ICONS.length],
      }))

      setServices(mappedServices)
      setSelectedService((currentSelectedService) =>
        currentSelectedService && mappedServices.some((service) => service.id === currentSelectedService.id)
          ? currentSelectedService
          : null,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load services at the moment.'
      setServices([])
      setServiceError(message)
    } finally {
      setIsLoadingServices(false)
    }
  }, [tenantId])

  const loadStaff = useCallback(async () => {
    if (!selectedService?.id) {
      setStaff([])
      setStaffError(null)
      return
    }

    setIsLoadingStaff(true)
    setStaffError(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      if (!baseUrl) {
        throw new Error('VITE_API_URL is not configured.')
      }
      if (!tenantId) {
        throw new Error('Tenant is missing from URL or app context.')
      }

      const searchParams = new URLSearchParams({
        serviceId: selectedService.id,
      })
      const staffUrl = `${baseUrl}/public/staff/${encodeURIComponent(tenantId)}?${searchParams.toString()}`

      const response = await fetch(staffUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch staff (${response.status}).`)
      }

      const json = (await response.json()) as PublicStaffApiResponse
      const mappedStaff: Professional[] = (Array.isArray(json.data) ? json.data : []).map((provider, index) => {
        const safeName = typeof provider.name === 'string' ? provider.name.trim() : ''
        const fullName = safeName || 'Provider'
        const initials =
          safeName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase() || 'PR'
        const safeRole = typeof provider.role === 'string' && provider.role.trim() ? provider.role : 'Professional'
        const safeId = typeof provider.id === 'string' && provider.id.trim() ? provider.id : `provider-${index + 1}`

        return {
          id: safeId,
          name: fullName,
          initials,
          role: safeRole,
          avatarClassName: AVATAR_CLASS_NAMES[index % AVATAR_CLASS_NAMES.length],
          avatarUrl: provider.avatarUrl ?? null,
        }
      })

      setStaff(mappedStaff)
      setSelectedProviderId((currentProviderId) =>
        currentProviderId && mappedStaff.some((provider) => provider.id === currentProviderId)
          ? currentProviderId
          : null,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load professionals at the moment.'
      setStaff([])
      setStaffError(message)
    } finally {
      setIsLoadingStaff(false)
    }
  }, [selectedService, tenantId])

  const loadAvailability = useCallback(
    async (startDate: string, providerIdOverride?: string | null) => {
      if (!selectedService) {
        setWeeklySlots({})
        return
      }

      setIsLoadingAvailability(true)
      setAvailabilityError(null)

      try {
        const baseUrl = import.meta.env.VITE_API_URL
        if (!baseUrl) {
          throw new Error('VITE_API_URL is not configured.')
        }
        if (!tenantId) {
          throw new Error('Tenant is missing from URL or app context.')
        }

        const providerId = providerIdOverride ?? selectedProviderId ?? 'ANY'
        const searchParams = new URLSearchParams({
          startDate,
          providerId,
          serviceId: selectedService.id,
        })

        const response = await fetch(
          `${baseUrl}/public/availability/${encodeURIComponent(tenantId)}?${searchParams.toString()}`,
        )
        if (!response.ok) {
          throw new Error(`Failed to fetch availability (${response.status}).`)
        }

        const json = (await response.json()) as PublicAvailabilityApiResponse
        const nextWeeklySlots = Object.entries(json.weekData ?? {}).reduce<
          Record<string, PublicAvailabilitySlotApiItem[]>
        >((accumulator, [date, slots]) => {
          accumulator[date] = (Array.isArray(slots) ? slots : []).map((slot) => ({
            time: typeof slot.time === 'string' ? slot.time : '',
            availableProviderIds: Array.isArray(slot.availableProviderIds)
              ? slot.availableProviderIds.filter((providerIdValue) => typeof providerIdValue === 'string')
              : [],
          }))
          return accumulator
        }, {})

        setWeeklySlots(nextWeeklySlots)
        setSelectedAppointment((currentAppointment) => {
          if (!currentAppointment) {
            return null
          }

          const matchingSlot = (nextWeeklySlots[currentAppointment.date] ?? []).find(
            (slot) => slot.time === currentAppointment.time,
          )
          if (!matchingSlot || !matchingSlot.availableProviderIds.includes(currentAppointment.assignedProviderId)) {
            return null
          }
          return currentAppointment
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load availability at the moment.'
        setWeeklySlots({})
        setAvailabilityError(message)
      } finally {
        setIsLoadingAvailability(false)
      }
    },
    [selectedProviderId, selectedService, tenantId],
  )

  const submitBooking = useCallback(
    async (contact: PatientDetails) => {
      setIsSubmittingBooking(true)
      setBookingError(null)
      setSlotConflictMessage(null)

      try {
        const baseUrl = import.meta.env.VITE_API_URL
        if (!baseUrl || !tenantId || !selectedService || !selectedAppointment) {
          throw new Error('Booking flow is not fully initialized.')
        }

        const response = await fetch(`${baseUrl}/public/appointments/${encodeURIComponent(tenantId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            providerId: selectedAppointment.assignedProviderId,
            serviceId: selectedService.id,
            date: selectedAppointment.date,
            startTime: selectedAppointment.time,
            customer: {
              name: contact.name,
              phone: contact.phone,
            },
          }),
        })

        if (response.status === 201) {
          setPatientDetails(contact)
          setCurrentStep(4)
          return
        }

        if (response.status === 409) {
          setSelectedAppointment(null)
          setCurrentStep(2)
          setSlotConflictMessage('Slot no longer available. Please choose another time.')
          await loadAvailability(availabilityStartDate, selectedProviderId)
          return
        }

        if (response.status === 400 || response.status >= 500) {
          setBookingError('Try again later.')
          return
        }

        setBookingError('Try again later.')
      } catch {
        setBookingError('Try again later.')
      } finally {
        setIsSubmittingBooking(false)
      }
    },
    [availabilityStartDate, loadAvailability, selectedAppointment, selectedProviderId, selectedService, tenantId],
  )

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (currentStep !== 2 || !selectedService) {
      return
    }
    void loadAvailability(availabilityStartDate)
  }, [availabilityStartDate, currentStep, loadAvailability, selectedService])

  const handleServiceSelection = (service: Service) => {
    setSelectedService(service)
    setStaff([])
    setSelectedProviderId(null)
    setSelectedAppointment(null)
    setWeeklySlots({})
    setWeekOffset(0)
    setBookingError(null)
    setSlotConflictMessage(null)
    setPatientDetails(EMPTY_PATIENT_DETAILS)
    setCurrentStep(1)
  }

  const handleProviderSelection = (providerId: string | null) => {
    setSelectedProviderId(providerId)
    setSelectedAppointment(null)
    setWeeklySlots({})
    setWeekOffset(0)
    setBookingError(null)
    setSlotConflictMessage(null)
    setCurrentStep(2)
  }

  const handleAppointmentSelection = (date: string, slot: PublicAvailabilitySlotApiItem) => {
    const assignedProviderId = slot.availableProviderIds[0]
    if (!assignedProviderId) {
      setSlotConflictMessage('Selected slot is no longer assignable. Please choose another time.')
      return
    }

    setSelectedAppointment({
      date,
      time: slot.time,
      assignedProviderId,
    })
    setCurrentStep(3)
    setBookingError(null)
    setSlotConflictMessage(null)
  }

  const handlePatientDetailsSubmit = (values: PatientDetails) => {
    void submitBooking(values)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setWeekOffset(0)
    setSelectedService(null)
    setSelectedProviderId(null)
    setSelectedAppointment(null)
    setWeeklySlots({})
    setPatientDetails(EMPTY_PATIENT_DETAILS)
    setBookingError(null)
    setSlotConflictMessage(null)
  }

  return (
    <section className="w-full rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8 lg:p-10">
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-cyan-700 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / STEP_COUNT) * 100}%` }}
        />
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentStep * 100}%)` }}
        >
          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 0 ? 'opacity-100' : 'opacity-60'}`}>
            <ServiceSelectionStep
              services={services}
              selectedServiceId={selectedService?.id ?? null}
              isLoadingServices={isLoadingServices}
              serviceError={serviceError}
              onSelectService={handleServiceSelection}
              onRetryLoadingServices={() => void loadServices()}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
            <ProfessionalSelectionStep
              staff={staff}
              selectedProviderId={selectedProviderId}
              isLoadingStaff={isLoadingStaff}
              staffError={staffError}
              onSelectProvider={handleProviderSelection}
              onRetryLoadingStaff={() => void loadStaff()}
              onBackToServices={() => setCurrentStep(0)}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
            <WeeklyCalendarStep
              weekLabel={formatWeekRange(weekStart)}
              weekDays={weekDays}
              weeklySlots={weeklySlots}
              selectedAppointment={selectedAppointment}
              isLoadingAvailability={isLoadingAvailability}
              availabilityError={availabilityError}
              slotConflictMessage={slotConflictMessage}
              onPreviousWeek={() => {
                setWeekOffset((value) => value - 1)
                setSelectedAppointment(null)
                setAvailabilityError(null)
                setSlotConflictMessage(null)
              }}
              onNextWeek={() => {
                setWeekOffset((value) => value + 1)
                setSelectedAppointment(null)
                setAvailabilityError(null)
                setSlotConflictMessage(null)
              }}
              onRetryLoadingAvailability={() => {
                void loadAvailability(availabilityStartDate)
              }}
              onBackToProfessionals={() => setCurrentStep(1)}
              onSelectAppointment={handleAppointmentSelection}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
            <PatientDetailsStep
              initialValues={patientDetails}
              submitError={bookingError}
              isSubmitting={isSubmittingBooking}
              onBack={() => setCurrentStep(2)}
              onSubmit={handlePatientDetailsSubmit}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 4 ? 'opacity-100' : 'opacity-60'}`}>
            {selectedService && selectedAppointment ? (
              <SuccessStep
                service={selectedService}
                appointment={selectedAppointment}
                providerName={selectedProviderName}
                patientDetails={patientDetails}
                onRestart={handleRestart}
              />
            ) : null}
          </div>
        </div>
      </div>

      {currentStep !== 4 ? (
        <button
          type="button"
          onClick={handleRestart}
          className="mt-8 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Restart flow
        </button>
      ) : null}
    </section>
  )
}

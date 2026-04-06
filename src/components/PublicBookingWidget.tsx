import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildWeekSchedule } from '../data/mockBookingData'
import type {
  DaySchedule,
  PatientDetails,
  Professional,
  PublicAvailabilityApiResponse,
  PublicStaffApiResponse,
  PublicServicesApiResponse,
  SelectedTimeSlot,
  Service,
} from '../types/booking'
import { addDays, formatWeekRange, getStartOfWeek } from '../utils/date'
import { PatientDetailsStep } from './booking/PatientDetailsStep'
import { ProfessionalSelectionStep } from './booking/ProfessionalSelectionStep'
import { ServiceSelectionStep } from './booking/ServiceSelectionStep'
import { WeeklyCalendarStep } from './booking/WeeklyCalendarStep'

const EMPTY_PATIENT_DETAILS: PatientDetails = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
}

const STEP_COUNT = 4
const SERVICE_ICONS = ['🩺', '🫀', '🧪', '🧬', '💊']
const AVATAR_CLASS_NAMES = [
  'bg-sky-600 text-white',
  'bg-emerald-600 text-white',
  'bg-violet-600 text-white',
  'bg-amber-600 text-white',
]
const DEBUG_TENANT_ID = 'CLINICA_TEST'

export function PublicBookingWidget() {
  const [currentStep, setCurrentStep] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Professional[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilitySchedule, setAvailabilitySchedule] = useState<DaySchedule[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<SelectedTimeSlot | null>(null)
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(EMPTY_PATIENT_DETAILS)

  const weekStart = useMemo(() => {
    const today = new Date()
    return getStartOfWeek(addDays(today, weekOffset * 7))
  }, [weekOffset])

  const fallbackSchedule = useMemo(
    () => buildWeekSchedule(weekStart, selectedService?.id ?? null),
    [selectedService?.id, weekStart],
  )

  const professionalsById = useMemo(
    () => staff.reduce<Record<string, Professional>>((accumulator, professional) => {
        accumulator[professional.id] = professional
        return accumulator
      }, {}),
    [staff],
  )

  const mapAvailabilityResponse = useCallback(
    (payload: PublicAvailabilityApiResponse): DaySchedule[] => {
      const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

      return payload.data.map((day) => {
        const date = new Date(day.isoDate)
        const dayShortLabel = day.dayShortLabel ?? dayFormatter.format(date)
        const dayNumber = day.dayNumber ?? date.getDate()

        const slots = day.slots.map((slot) => ({
          id: slot.id ?? `${day.isoDate}-${slot.time}`,
          time: slot.time,
          isAvailable: slot.isAvailable,
          professionalIds:
            slot.professionalIds && slot.professionalIds.length > 0
              ? slot.professionalIds
              : selectedProviderId
                ? [selectedProviderId]
                : [],
        }))

        return {
          isoDate: day.isoDate,
          dayShortLabel,
          dayNumber,
          slots,
        }
      })
    },
    [selectedProviderId],
  )

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true)
    setServiceError(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      if (!baseUrl) {
        throw new Error('VITE_API_URL is not configured.')
      }

      const fetchUrl = `${baseUrl}/public/services/${DEBUG_TENANT_ID}`
      console.log('Services API URL:', fetchUrl)

      const response = await fetch(fetchUrl)
      console.log('Services API raw response:', response)

      if (!response.ok) {
        throw new Error(`Failed to fetch services (${response.status}).`)
      }

      const json = (await response.json()) as PublicServicesApiResponse
      console.log('Services API raw JSON:', json)

      const serviceItems = Array.isArray(json.data) ? json.data : []
      const mappedServices: Service[] = serviceItems.map((service, index) => ({
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
      setSelectedProviderId(null)
      setSelectedTimeSlot(null)
      setCurrentStep(0)
    } catch (error) {
      console.error('Services API fetch error:', error)
      const message = error instanceof Error ? error.message : 'Unable to load services at the moment.'
      setServices([])
      setServiceError(message)
    } finally {
      setIsLoadingServices(false)
    }
  }, [])

  const loadStaff = useCallback(async () => {
    setIsLoadingStaff(true)
    setStaffError(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      if (!baseUrl) {
        throw new Error('VITE_API_URL is not configured.')
      }

      const fetchUrl = `${baseUrl}/public/staff/${DEBUG_TENANT_ID}`
      console.log('Staff API URL:', fetchUrl)

      const response = await fetch(fetchUrl)
      console.log('Staff API raw response:', response)

      if (!response.ok) {
        throw new Error(`Failed to fetch staff (${response.status}).`)
      }

      const json = (await response.json()) as PublicStaffApiResponse
      console.log('Staff API raw JSON:', json)

      const staffItems = Array.isArray(json.data) ? json.data : []
      const mappedStaff: Professional[] = staffItems.map((provider, index) => {
        const safeFirstName = typeof provider.firstName === 'string' ? provider.firstName : ''
        const safeLastName = typeof provider.lastName === 'string' ? provider.lastName : ''
        const fullName = `${safeFirstName || ''} ${safeLastName || ''}`.trim() || 'Provider'
        const initials = `${safeFirstName?.charAt(0) || ''}${safeLastName?.charAt(0) || ''}`.toUpperCase() || 'PR'
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
      console.error('Staff API fetch error:', error)
      const message = error instanceof Error ? error.message : 'Unable to load professionals at the moment.'
      setStaff([])
      setStaffError(message)
    } finally {
      setIsLoadingStaff(false)
    }
  }, [])

  const loadAvailability = useCallback(async (providerIdOverride?: string | null) => {
    if (!selectedService) {
      setAvailabilitySchedule([])
      return
    }

    setIsLoadingAvailability(true)
    setAvailabilityError(null)

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      if (!baseUrl) {
        throw new Error('VITE_API_URL is not configured.')
      }

      const providerId = providerIdOverride ?? selectedProviderId ?? ''
      const fetchUrl =
        `${baseUrl}/public/availability/${DEBUG_TENANT_ID}` +
        `?serviceId=${encodeURIComponent(selectedService.id)}` +
        `&providerId=${encodeURIComponent(providerId)}`

      console.log('Availability API URL:', fetchUrl)

      const response = await fetch(fetchUrl)
      console.log('Availability API raw response:', response)

      if (!response.ok) {
        throw new Error(`Failed to fetch availability (${response.status}).`)
      }

      const json = (await response.json()) as PublicAvailabilityApiResponse
      console.log('Availability API raw JSON:', json)

      const mappedAvailability = mapAvailabilityResponse(json)
      setAvailabilitySchedule(mappedAvailability)
      setSelectedTimeSlot((currentTimeSlot) =>
        currentTimeSlot &&
        mappedAvailability.some((day) => day.slots.some((slot) => slot.id === currentTimeSlot.slotId))
          ? currentTimeSlot
          : null,
      )
    } catch (error) {
      console.error('Availability API fetch error:', error)
      const message = error instanceof Error ? error.message : 'Unable to load availability at the moment.'
      setAvailabilitySchedule([])
      setAvailabilityError(message)
    } finally {
      setIsLoadingAvailability(false)
    }
  }, [mapAvailabilityResponse, selectedProviderId, selectedService])

  useEffect(() => {
    void loadServices()
    void loadStaff()
  }, [loadServices, loadStaff])

  useEffect(() => {
    if (currentStep < 2 || !selectedService) {
      return
    }

    void loadAvailability()
  }, [currentStep, loadAvailability, selectedService, weekOffset])

  const handleServiceSelection = (service: Service) => {
    setSelectedService(service)
    setSelectedProviderId(null)
    setSelectedTimeSlot(null)
    setAvailabilitySchedule([])
    setWeekOffset(0)
    setCurrentStep(1)
  }

  const handleProviderSelection = (providerId: string | null) => {
    setSelectedProviderId(providerId)
    setSelectedTimeSlot(null)
    setAvailabilitySchedule([])
    setWeekOffset(0)
    setCurrentStep(2)
    void loadAvailability(providerId)
  }

  const handleTimeSlotSelection = (timeSlot: SelectedTimeSlot) => {
    setSelectedTimeSlot(timeSlot)
    setCurrentStep(3)
  }

  const handlePatientDetailsSubmit = (values: PatientDetails) => {
    setPatientDetails(values)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setWeekOffset(0)
    setSelectedService(null)
    setSelectedProviderId(null)
    setSelectedTimeSlot(null)
    setPatientDetails(EMPTY_PATIENT_DETAILS)
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
              schedule={availabilitySchedule.length > 0 ? availabilitySchedule : fallbackSchedule}
              professionalsById={professionalsById}
              selectedTimeSlot={selectedTimeSlot}
              isLoadingAvailability={isLoadingAvailability}
              availabilityError={availabilityError}
              onPreviousWeek={() => setWeekOffset((value) => value - 1)}
              onNextWeek={() => setWeekOffset((value) => value + 1)}
              onRetryLoadingAvailability={() => void loadAvailability()}
              onBackToProfessionals={() => setCurrentStep(1)}
              onSelectTimeSlot={handleTimeSlotSelection}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
            <PatientDetailsStep
              initialValues={patientDetails}
              onBack={() => setCurrentStep(2)}
              onSubmit={handlePatientDetailsSubmit}
            />
          </div>
        </div>
      </div>

      {currentStep === 3 ? (
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

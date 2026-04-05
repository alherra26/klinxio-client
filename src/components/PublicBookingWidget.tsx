import { useMemo, useState } from 'react'
import { buildWeekSchedule, professionals, services } from '../data/mockBookingData'
import type { PatientDetails, SelectedSlot, Service } from '../types/booking'
import { addDays, formatWeekRange, getStartOfWeek } from '../utils/date'
import { PatientDetailsStep } from './booking/PatientDetailsStep'
import { ServiceSelectionStep } from './booking/ServiceSelectionStep'
import { SuccessStep } from './booking/SuccessStep'
import { WeeklyCalendarStep } from './booking/WeeklyCalendarStep'

const EMPTY_PATIENT_DETAILS: PatientDetails = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
}

const STEP_COUNT = 4

export function PublicBookingWidget() {
  const [currentStep, setCurrentStep] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(EMPTY_PATIENT_DETAILS)

  const weekStart = useMemo(() => {
    const today = new Date()
    return getStartOfWeek(addDays(today, weekOffset * 7))
  }, [weekOffset])

  const schedule = useMemo(
    () => buildWeekSchedule(weekStart, selectedService?.id ?? null),
    [weekStart, selectedService?.id],
  )

  const professionalsById = useMemo(
    () =>
      professionals.reduce<Record<string, (typeof professionals)[number]>>((accumulator, professional) => {
        accumulator[professional.id] = professional
        return accumulator
      }, {}),
    [],
  )

  const handleServiceSelection = (service: Service) => {
    setSelectedService(service)
    setSelectedSlot(null)
    setCurrentStep(1)
  }

  const handleSlotSelection = (slot: SelectedSlot) => {
    setSelectedSlot(slot)
    setCurrentStep(2)
  }

  const handlePatientDetailsSubmit = (values: PatientDetails) => {
    setPatientDetails(values)
    setCurrentStep(3)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setWeekOffset(0)
    setSelectedService(null)
    setSelectedSlot(null)
    setPatientDetails(EMPTY_PATIENT_DETAILS)
  }

  const canRenderSuccess = selectedService !== null && selectedSlot !== null

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
              onSelectService={handleServiceSelection}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
            <WeeklyCalendarStep
              weekLabel={formatWeekRange(weekStart)}
              schedule={schedule}
              professionalsById={professionalsById}
              selectedSlot={selectedSlot}
              onPreviousWeek={() => setWeekOffset((value) => value - 1)}
              onNextWeek={() => setWeekOffset((value) => value + 1)}
              onBackToServices={() => setCurrentStep(0)}
              onSelectSlot={handleSlotSelection}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
            <PatientDetailsStep
              initialValues={patientDetails}
              onBack={() => setCurrentStep(1)}
              onSubmit={handlePatientDetailsSubmit}
            />
          </div>

          <div className={`w-full shrink-0 transition-opacity duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
            {canRenderSuccess ? (
              <SuccessStep
                service={selectedService}
                slot={selectedSlot}
                patientDetails={patientDetails}
                onRestart={handleRestart}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

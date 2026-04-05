import type { PatientDetails, SelectedSlot, Service } from '../../types/booking'
import { formatAppointmentDate } from '../../utils/date'

interface SuccessStepProps {
  service: Service
  slot: SelectedSlot
  patientDetails: PatientDetails
  onRestart: () => void
}

export function SuccessStep({ service, slot, patientDetails, onRestart }: SuccessStepProps) {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">Step 4 of 4</p>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Booking Confirmed</h2>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Thank you {patientDetails.firstName}. Your appointment request has been successfully submitted.
        </p>
      </header>

      <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Appointment summary</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-[0.1em] text-slate-500 uppercase">Service</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{service.name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.1em] text-slate-500 uppercase">Date</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatAppointmentDate(slot.isoDate)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.1em] text-slate-500 uppercase">Time</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{slot.time}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.1em] text-slate-500 uppercase">Contact</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{patientDetails.email}</dd>
          </div>
        </dl>
      </article>

      <button
        type="button"
        onClick={onRestart}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Book another appointment
      </button>
    </section>
  )
}

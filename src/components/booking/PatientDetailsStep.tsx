import { useState, type FormEvent } from 'react'
import type { PatientDetails } from '../../types/booking'

interface PatientDetailsStepProps {
  initialValues: PatientDetails
  onBack: () => void
  onSubmit: (values: PatientDetails) => void
}

export function PatientDetailsStep({ initialValues, onBack, onSubmit }: PatientDetailsStepProps) {
  const [values, setValues] = useState<PatientDetails>(initialValues)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFieldChange = (field: keyof PatientDetails, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setErrorMessage(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasMissingValues = Object.values(values).some((value) => !value.trim())

    if (hasMissingValues) {
      setErrorMessage('Please complete all required fields.')
      return
    }

    if (!values.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    onSubmit(values)
  }

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Step 3 of 4</p>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Patient Details</h2>
        <p className="max-w-xl text-base leading-7 text-slate-600">
          Fill in your details to finalize the appointment request.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-slate-700">
          First Name
          <input
            type="text"
            value={values.firstName}
            onChange={(event) => handleFieldChange('firstName', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Last Name
          <input
            type="text"
            value={values.lastName}
            onChange={(event) => handleFieldChange('lastName', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={values.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200"
          />
        </label>

        {errorMessage ? <p className="sm:col-span-2 text-sm font-medium text-red-600">{errorMessage}</p> : null}

        <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Confirm booking
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Back
      </button>
    </section>
  )
}

import type { CalendarDay, TimeSlot } from '../../types/booking'

interface WeeklyCalendarStepProps {
  weekLabel: string
  weekDays: CalendarDay[]
  selectedDate: string | null
  availableSlots: TimeSlot[]
  selectedTimeSlot: TimeSlot | null
  isLoadingAvailability: boolean
  availabilityError: string | null
  slotConflictMessage: string | null
  onPreviousWeek: () => void
  onNextWeek: () => void
  onRetryLoadingAvailability: () => void
  onBackToProfessionals: () => void
  onSelectDate: (date: string) => void
  onSelectTimeSlot: (slot: TimeSlot) => void
}

export function WeeklyCalendarStep({
  weekLabel,
  weekDays,
  selectedDate,
  availableSlots,
  selectedTimeSlot,
  isLoadingAvailability,
  availabilityError,
  slotConflictMessage,
  onPreviousWeek,
  onNextWeek,
  onRetryLoadingAvailability,
  onBackToProfessionals,
  onSelectDate,
  onSelectTimeSlot,
}: WeeklyCalendarStepProps) {
  const formatSlotTime = (time: string) => {
    if (!time) {
      return '--:--'
    }

    const [hourPart, minutePart] = time.split(':')
    const hour = Number(hourPart)
    const minute = Number(minutePart)
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      return time
    }

    const suffix = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
  }

  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Step 3 of 5</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Select Day & Time</h2>
            <p className="mt-2 text-base text-slate-600">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousWeek}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Next →
            </button>
          </div>
        </div>
      </header>

      {slotConflictMessage ? (
        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-900">{slotConflictMessage}</p>
        </article>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {weekDays.map((day) => {
          const isSelected = day.isoDate === selectedDate
          return (
            <button
              key={day.isoDate}
              type="button"
              onClick={() => onSelectDate(day.isoDate)}
              data-testid={`day-button-${day.isoDate}`}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? 'border-cyan-700 bg-cyan-50 ring-2 ring-cyan-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">{day.dayShortLabel}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{day.dayNumber}</p>
            </button>
          )
        })}
      </div>

      {isLoadingAvailability ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <p role="status" className="sr-only">
            Loading availability...
          </p>
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : null}

      {!isLoadingAvailability && availabilityError ? (
        <article className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-xl font-semibold text-slate-900">Unable to load availability</h3>
          <p className="mt-2 text-sm text-slate-700">{availabilityError}</p>
          <button
            type="button"
            onClick={onRetryLoadingAvailability}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Retry
          </button>
        </article>
      ) : null}

      {!isLoadingAvailability && !availabilityError ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selectedDate ? (
            <p className="text-sm text-slate-700">Choose a day to load available time slots.</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-slate-700">No slots available for this day. Please choose another date.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {availableSlots.map((slot) => {
                const isSelected = selectedTimeSlot?.id === slot.id
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSelectTimeSlot(slot)}
                    data-testid={`slot-button-${slot.id}`}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-green-700 bg-green-50 text-slate-900 ring-2 ring-green-300'
                        : 'border-green-500 bg-green-50 text-slate-900 hover:bg-green-100'
                    }`}
                  >
                    <span className="inline-block text-slate-900">{formatSlotTime(slot.startTime)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onBackToProfessionals}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Back to professionals
      </button>
    </section>
  )
}

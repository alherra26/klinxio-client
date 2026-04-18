import type { CalendarDay, PublicAvailabilitySlotApiItem, SelectedAppointment } from '../../types/booking'

interface WeeklyCalendarStepProps {
  weekLabel: string
  weekDays: CalendarDay[]
  weeklySlots: Record<string, PublicAvailabilitySlotApiItem[]>
  selectedAppointment: SelectedAppointment | null
  isLoadingAvailability: boolean
  availabilityError: string | null
  slotConflictMessage: string | null
  onPreviousWeek: () => void
  onNextWeek: () => void
  onRetryLoadingAvailability: () => void
  onBackToProfessionals: () => void
  onSelectAppointment: (date: string, slot: PublicAvailabilitySlotApiItem) => void
}

export function WeeklyCalendarStep({
  weekLabel,
  weekDays,
  weeklySlots,
  selectedAppointment,
  isLoadingAvailability,
  availabilityError,
  slotConflictMessage,
  onPreviousWeek,
  onNextWeek,
  onRetryLoadingAvailability,
  onBackToProfessionals,
  onSelectAppointment,
}: WeeklyCalendarStepProps) {
  const now = new Date()
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const currentWeekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const currentWeekDay = currentWeekStartDate.getDay()
  const currentWeekDiffFromMonday = currentWeekDay === 0 ? 6 : currentWeekDay - 1
  currentWeekStartDate.setDate(currentWeekStartDate.getDate() - currentWeekDiffFromMonday)
  const currentWeekStart = `${currentWeekStartDate.getFullYear()}-${String(currentWeekStartDate.getMonth() + 1).padStart(2, '0')}-${String(currentWeekStartDate.getDate()).padStart(2, '0')}`
  const viewedWeekStart = weekDays[0]?.isoDate ?? currentWeekStart
  const isPreviousWeekDisabled = viewedWeekStart <= currentWeekStart

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
              disabled={isPreviousWeekDisabled}
              className={`rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                isPreviousWeekDisabled ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-400'
              }`}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const daySlots = weeklySlots[day.isoDate] ?? []
            const isPastDay = day.isoDate < currentDate
            const isCurrentDay = day.isoDate === currentDate
            const renderableSlots = isPastDay
              ? []
              : isCurrentDay
                ? daySlots.filter((slot) => slot.time > currentTime)
                : daySlots
            const fallbackMessage = isPastDay || isCurrentDay ? 'Unavailable' : 'No slots available'

            return (
              <article
                key={day.isoDate}
                data-testid={`day-column-${day.isoDate}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">{day.dayShortLabel}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{day.dayNumber}</p>

                <div className="mt-4 space-y-2">
                  {renderableSlots.length === 0 ? (
                    <p className="text-xs text-slate-600">{fallbackMessage}</p>
                  ) : (
                    renderableSlots.map((slot, slotIndex) => {
                      const isSelected =
                        selectedAppointment?.date === day.isoDate && selectedAppointment.time === slot.time

                      return (
                        <button
                          key={`${day.isoDate}-${slot.time}-${slotIndex}`}
                          type="button"
                          onClick={() => onSelectAppointment(day.isoDate, slot)}
                          data-testid={`slot-button-${day.isoDate}-${slot.time}`}
                          className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? 'border-green-700 bg-green-50 text-slate-900 ring-2 ring-green-300'
                              : 'border-green-500 bg-green-50 text-slate-900 hover:bg-green-100'
                          }`}
                        >
                          <span className="inline-block text-slate-900">{formatSlotTime(slot.time)}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}

      {!isLoadingAvailability &&
      !availabilityError &&
      weekDays.every((day) => {
        const daySlots = weeklySlots[day.isoDate] ?? []
        if (day.isoDate < currentDate) {
          return true
        }
        if (day.isoDate === currentDate) {
          return daySlots.filter((slot) => slot.time > currentTime).length === 0
        }
        return daySlots.length === 0
      }) ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">No slots available for this week. Please try another week.</p>
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

import type { DaySchedule, Professional, SelectedSlot } from '../../types/booking'
import { AvatarStack } from './AvatarStack'

interface WeeklyCalendarStepProps {
  weekLabel: string
  schedule: DaySchedule[]
  professionalsById: Record<string, Professional>
  selectedSlot: SelectedSlot | null
  onPreviousWeek: () => void
  onNextWeek: () => void
  onBackToServices: () => void
  onSelectSlot: (slot: SelectedSlot) => void
}

export function WeeklyCalendarStep({
  weekLabel,
  schedule,
  professionalsById,
  selectedSlot,
  onPreviousWeek,
  onNextWeek,
  onBackToServices,
  onSelectSlot,
}: WeeklyCalendarStepProps) {
  return (
    <section className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Step 2 of 4</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Select Date & Time</h2>
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

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {schedule.map((day) => (
            <article key={day.isoDate} className="rounded-2xl bg-slate-50 p-3">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {day.dayShortLabel} {day.dayNumber}
              </h3>
              <div className="space-y-2">
                {day.slots.map((slot) => {
                  const isSelected = selectedSlot?.slotId === slot.id
                  const slotProfessionals = slot.professionalIds
                    .map((professionalId) => professionalsById[professionalId])
                    .filter(Boolean)

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() =>
                        onSelectSlot({
                          slotId: slot.id,
                          isoDate: day.isoDate,
                          dayShortLabel: day.dayShortLabel,
                          time: slot.time,
                          professionalIds: slot.professionalIds,
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                        slot.isAvailable
                          ? `bg-green-50 text-green-700 hover:bg-green-100 ${
                              isSelected ? 'border-green-600 ring-2 ring-green-300' : 'border-green-500'
                            }`
                          : 'cursor-not-allowed border-red-200 bg-red-50/50 text-red-300 line-through opacity-50'
                      }`}
                    >
                      <span>{slot.time}</span>
                      {slot.isAvailable && slotProfessionals.length > 0 ? (
                        <AvatarStack professionals={slotProfessionals} />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBackToServices}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Back to services
      </button>
    </section>
  )
}

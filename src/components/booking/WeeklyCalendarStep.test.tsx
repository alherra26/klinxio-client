import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarDay, PublicAvailabilitySlotApiItem } from '../../types/booking'
import { WeeklyCalendarStep } from './WeeklyCalendarStep'

function renderStep(weekDays: CalendarDay[], weeklySlots: Record<string, PublicAvailabilitySlotApiItem[]>) {
  return render(
    <WeeklyCalendarStep
      weekLabel="Apr 14 - Apr 20"
      weekDays={weekDays}
      weeklySlots={weeklySlots}
      selectedAppointment={null}
      isLoadingAvailability={false}
      availabilityError={null}
      slotConflictMessage={null}
      onPreviousWeek={vi.fn()}
      onNextWeek={vi.fn()}
      onRetryLoadingAvailability={vi.fn()}
      onBackToProfessionals={vi.fn()}
      onSelectAppointment={vi.fn()}
    />,
  )
}

describe('WeeklyCalendarStep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hides past slots, filters today slots by current time, and keeps future slots', () => {
    vi.setSystemTime(new Date('2026-04-18T10:00:00'))

    const weekDays: CalendarDay[] = [
      { isoDate: '2026-04-17', dayShortLabel: 'Fri', dayNumber: 17 },
      { isoDate: '2026-04-18', dayShortLabel: 'Sat', dayNumber: 18 },
      { isoDate: '2026-04-19', dayShortLabel: 'Sun', dayNumber: 19 },
    ]

    const weeklySlots: Record<string, PublicAvailabilitySlotApiItem[]> = {
      '2026-04-17': [{ time: '09:00', availableProviderIds: ['provider-1'] }],
      '2026-04-18': [
        { time: '09:30', availableProviderIds: ['provider-1'] },
        { time: '10:00', availableProviderIds: ['provider-1'] },
        { time: '10:01', availableProviderIds: ['provider-1'] },
      ],
      '2026-04-19': [{ time: '08:00', availableProviderIds: ['provider-1'] }],
    }

    renderStep(weekDays, weeklySlots)

    expect(screen.getByTestId('day-column-2026-04-17')).toBeInTheDocument()
    expect(screen.getByTestId('day-column-2026-04-18')).toBeInTheDocument()
    expect(screen.getByTestId('day-column-2026-04-19')).toBeInTheDocument()

    expect(screen.queryByTestId('slot-button-2026-04-17-09:00')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slot-button-2026-04-18-09:30')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slot-button-2026-04-18-10:00')).not.toBeInTheDocument()

    expect(screen.getByTestId('slot-button-2026-04-18-10:01')).toBeInTheDocument()
    expect(screen.getByTestId('slot-button-2026-04-19-08:00')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('renders Unavailable when today has no remaining future slots', () => {
    vi.setSystemTime(new Date('2026-04-18T10:00:00'))

    const weekDays: CalendarDay[] = [{ isoDate: '2026-04-18', dayShortLabel: 'Sat', dayNumber: 18 }]
    const weeklySlots: Record<string, PublicAvailabilitySlotApiItem[]> = {
      '2026-04-18': [{ time: '09:00', availableProviderIds: ['provider-1'] }],
    }

    renderStep(weekDays, weeklySlots)

    expect(screen.queryByTestId('slot-button-2026-04-18-09:00')).not.toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('disables Previous for current week and keeps Next enabled', () => {
    vi.setSystemTime(new Date('2026-04-18T10:00:00'))

    renderStep(
      [
        { isoDate: '2026-04-13', dayShortLabel: 'Mon', dayNumber: 13 },
        { isoDate: '2026-04-14', dayShortLabel: 'Tue', dayNumber: 14 },
      ],
      {},
    )

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })

  it('enables Previous when viewing a future week', () => {
    vi.setSystemTime(new Date('2026-04-18T10:00:00'))

    renderStep(
      [
        { isoDate: '2026-04-20', dayShortLabel: 'Mon', dayNumber: 20 },
        { isoDate: '2026-04-21', dayShortLabel: 'Tue', dayNumber: 21 },
      ],
      {},
    )

    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })
})

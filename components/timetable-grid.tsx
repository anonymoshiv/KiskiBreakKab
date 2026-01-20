'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface TimeSlot {
  slot_no: number
  time: string
}

interface TimetableGridProps {
  onSave?: (timetable: Record<string, Record<number, string>>) => void
  isLoading?: boolean
  initialTimetable?: Record<string, Record<number, string>> | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SLOTS: TimeSlot[] = [
  { slot_no: 1, time: '09:30 - 10:20' },
  { slot_no: 2, time: '10:20 - 11:10' },
  { slot_no: 3, time: '11:20 - 12:10' },
  { slot_no: 4, time: '12:10 - 01:00' },
  { slot_no: 5, time: '01:05 - 01:55' },
  { slot_no: 6, time: '01:55 - 02:45' },
  { slot_no: 7, time: '02:45 - 03:35' },
  { slot_no: 8, time: '03:35 - 04:25' },
]

export function TimetableGrid({ onSave, isLoading = false, initialTimetable }: TimetableGridProps) {
  const [timetable, setTimetable] = useState<Record<string, Record<number, string>>>(() => {
    const initial: Record<string, Record<number, string>> = {}
    DAYS.forEach(day => {
      initial[day] = {}
      SLOTS.forEach(slot => {
        initial[day][slot.slot_no] = 'BUSY' // Default to BUSY
      })
    })
    return initial
  })

  // Load initial timetable when it becomes available
  useEffect(() => {
    if (initialTimetable) {
      setTimetable(initialTimetable)
    }
  }, [initialTimetable])

  const toggleSlot = (day: string, slotNo: number) => {
    setTimetable(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotNo]: prev[day][slotNo] === 'BUSY' ? 'FREE' : 'BUSY',
      },
    }))
  }

  const handleSave = () => {
    onSave?.(timetable)
  }

  const getFreeCount = () => {
    let count = 0
    Object.values(timetable).forEach(day => {
      Object.values(day).forEach(status => {
        if (status === 'FREE') count++
      })
    })
    return count
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Your Weekly Timetable</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Click slots to toggle between FREE (green) and BUSY (red)</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-semibold text-green-700 dark:text-green-400">Free</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/30">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="font-semibold text-red-700 dark:text-red-400">Busy</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row - Time Slots */}
            <div className="grid grid-cols-9 gap-3 mb-4">
              <div className="font-black text-sm text-center py-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl text-slate-900 dark:text-white">Day</div>
              {SLOTS.map(slot => (
                <div key={slot.slot_no} className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="font-black text-sm text-blue-700 dark:text-blue-300">Slot {slot.slot_no}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{slot.time}</div>
                </div>
              ))}
            </div>

            {/* Rows - Days */}
            {DAYS.map(day => (
              <div key={day} className="grid grid-cols-9 gap-3 mb-3">
                <div className="flex items-center justify-center font-black text-sm bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl py-4 text-slate-900 dark:text-white">
                  {day.slice(0, 3)}
                </div>
                {SLOTS.map(slot => {
                  const isFree = timetable[day][slot.slot_no] === 'FREE'
                  return (
                    <button
                      key={`${day}-${slot.slot_no}`}
                      onClick={() => toggleSlot(day, slot.slot_no)}
                      className={`
                        h-16 rounded-xl font-bold text-xs transition-all transform hover:scale-105 active:scale-95 shadow-lg
                        ${
                          isFree
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50'
                            : 'bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-red-500/30 hover:shadow-red-500/50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-lg">{isFree ? '✓' : '✗'}</span>
                        <span>{isFree ? 'FREE' : 'BUSY'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
            <span className="text-sm text-slate-700 dark:text-slate-300">Free slots:</span>
            <span className="font-black text-xl text-green-600 dark:text-green-400">{getFreeCount()}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/ {DAYS.length * SLOTS.length}</span>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isLoading} 
            size="lg" 
            className="min-w-[200px] h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
          >
            {isLoading ? 'Saving...' : 'Save Timetable'}
          </Button>
        </div>
      </div>
    </div>
  )
}

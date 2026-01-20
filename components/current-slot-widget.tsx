'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface SlotInfo {
  day: string
  slot_no: number | null
  time_range: string
  status: 'in-progress' | 'break' | 'after-hours' | 'weekend'
  userStatus?: 'FREE' | 'BUSY' | null
  currentTime: string
}

interface CurrentSlotWidgetProps {
  timetable?: Record<string, Record<number, string>> | null
}

// Define slot timings
const SLOTS = [
  { slot_no: 1, start: '09:30', end: '10:20' },
  { slot_no: 2, start: '10:20', end: '11:10' },
  { slot_no: 3, start: '11:20', end: '12:10' },
  { slot_no: 4, start: '12:10', end: '13:00' },
  { slot_no: 5, start: '13:05', end: '13:55' },
  { slot_no: 6, start: '13:55', end: '14:45' },
  { slot_no: 7, start: '14:45', end: '15:35' },
  { slot_no: 8, start: '15:35', end: '16:25' },
]

// Convert time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Get current slot based on real time
function getCurrentSlot(timetable?: Record<string, Record<number, string>> | null): SlotInfo {
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dayOfWeek = now.getDay()
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const currentMinutes = timeToMinutes(currentTime)

  // Check if weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      day,
      slot_no: null,
      time_range: 'Weekend',
      status: 'weekend',
      userStatus: null,
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Check if within any slot
  for (const slot of SLOTS) {
    const startMinutes = timeToMinutes(slot.start)
    const endMinutes = timeToMinutes(slot.end)

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      // Get user's status for this slot
      const userStatus = timetable?.[day]?.[slot.slot_no] as 'FREE' | 'BUSY' | undefined
      
      return {
        day,
        slot_no: slot.slot_no,
        time_range: `${slot.start} - ${slot.end}`,
        status: 'in-progress',
        userStatus: userStatus || null,
        currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    }
  }

  // Check if before first slot
  if (currentMinutes < timeToMinutes(SLOTS[0].start)) {
    return {
      day,
      slot_no: null,
      time_range: 'Classes start at 09:30',
      status: 'after-hours',
      userStatus: null,
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Check if after last slot
  if (currentMinutes >= timeToMinutes(SLOTS[SLOTS.length - 1].end)) {
    return {
      day,
      slot_no: null,
      time_range: 'Classes ended at 16:25',
      status: 'after-hours',
      userStatus: null,
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Must be in a break between slots
  return {
    day,
    slot_no: null,
    time_range: 'Break Time',
    status: 'break',
    userStatus: null,
    currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
}

export function CurrentSlotWidget({ timetable }: CurrentSlotWidgetProps) {
  const [slot, setSlot] = useState<SlotInfo>(getCurrentSlot(timetable))

  useEffect(() => {
    // Update every 30 seconds
    const interval = setInterval(() => {
      setSlot(getCurrentSlot(timetable))
    }, 30000)

    return () => clearInterval(interval)
  }, [timetable])

  // Update when timetable changes
  useEffect(() => {
    setSlot(getCurrentSlot(timetable))
  }, [timetable])

  const getStatusBadge = () => {
    // Show user status if in a slot
    if (slot.status === 'in-progress' && slot.userStatus) {
      if (slot.userStatus === 'FREE') {
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/40 flex items-center gap-2">
          <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
          <span className="text-white font-bold text-sm">You're FREE</span>
        </div>
      } else {
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/40 flex items-center gap-2">
          <span className="w-3 h-3 bg-white rounded-full"></span>
          <span className="text-white font-bold text-sm">You're BUSY</span>
        </div>
      }
    }

    // Default status badges
    switch (slot.status) {
      case 'in-progress':
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/40 flex items-center gap-2">
          <span className="text-white font-bold text-sm">📚 Set Your Timetable</span>
        </div>
      case 'break':
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/40 flex items-center gap-2">
          <span className="text-white font-bold text-sm">☕ Break Time</span>
        </div>
      case 'weekend':
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 flex items-center gap-2">
          <span className="text-white font-bold text-sm">🎉 Weekend Vibes</span>
        </div>
      case 'after-hours':
        return <div className="px-6 py-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg shadow-slate-500/40 flex items-center gap-2">
          <span className="text-white font-bold text-sm">🌙 After Hours</span>
        </div>
    }
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="relative z-10">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Current Slot</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{slot.currentTime}</span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">DAY</p>
              <p className="text-lg font-black text-blue-700 dark:text-blue-300">{slot.day}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">SLOT</p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{slot.slot_no || '-'}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50 border border-pink-200 dark:border-pink-800">
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-2">TIME</p>
              <p className="text-sm font-bold text-pink-700 dark:text-pink-300">{slot.time_range}</p>
            </div>
          </div>
          <div className="flex justify-center">
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </div>
  )
}

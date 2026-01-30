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

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function getCurrentSlot(timetable?: Record<string, Record<number, string>> | null): SlotInfo {
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dayOfWeek = now.getDay()
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const currentMinutes = timeToMinutes(currentTime)

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

  for (const slot of SLOTS) {
    const startMinutes = timeToMinutes(slot.start)
    const endMinutes = timeToMinutes(slot.end)

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
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

  if (currentMinutes < timeToMinutes(SLOTS[0].start)) {
    return {
      day,
      slot_no: null,
      time_range: 'Starts 09:30',
      status: 'after-hours',
      userStatus: null,
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (currentMinutes >= timeToMinutes(SLOTS[SLOTS.length - 1].end)) {
    return {
      day,
      slot_no: null,
      time_range: 'Classes Over',
      status: 'after-hours',
      userStatus: null,
      currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

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
    const interval = setInterval(() => {
      setSlot(getCurrentSlot(timetable))
    }, 30000)

    return () => clearInterval(interval)
  }, [timetable])

  useEffect(() => {
    setSlot(getCurrentSlot(timetable))
  }, [timetable])

  const getStatusBadge = () => {
    if (slot.status === 'in-progress' && slot.userStatus) {
      if (slot.userStatus === 'FREE') {
        return <div className="w-full text-center px-4 py-3 bg-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#404040]">
          <span className="text-black font-black uppercase tracking-widest text-lg">You Are Free</span>
        </div>
      } else {
        return <div className="w-full text-center px-4 py-3 bg-[#F63049] text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#404040]">
          <span className="font-black uppercase tracking-widest text-lg">In Class</span>
        </div>
      }
    }

    switch (slot.status) {
      case 'in-progress':
        return <div className="w-full text-center px-4 py-3 bg-gray-100 dark:bg-zinc-800 border-2 border-black dark:border-white border-dashed">
          <span className="font-bold uppercase tracking-widest text-sm text-gray-500">No Data Available</span>
        </div>
      case 'break':
        return <div className="w-full text-center px-4 py-3 bg-yellow-400 text-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#404040]">
          <span className="font-black uppercase tracking-widest text-lg">Break Time</span>
        </div>
      case 'weekend':
        return <div className="w-full text-center px-4 py-3 bg-purple-500 text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#404040]">
          <span className="font-black uppercase tracking-widest text-lg">Weekend</span>
        </div>
      case 'after-hours':
        return <div className="w-full text-center px-4 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
          <span className="font-black uppercase tracking-widest text-lg">Day Ended</span>
        </div>
    }
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border-2 border-black dark:border-white p-1">
      <div className="bg-black dark:bg-white p-3 flex justify-between items-center mb-1">
         <h3 className="text-white dark:text-black font-black uppercase tracking-wider text-sm">Status Monitor</h3>
         <div className="font-mono text-xs font-bold text-[#F63049] bg-white dark:bg-black px-2 py-0.5 border border-white dark:border-black">
           LIVE: {slot.currentTime}
         </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
            <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-1">Current Day</p>
            <p className="text-lg sm:text-xl font-black uppercase">{slot.day.slice(0, 3)}</p>
          </div>
          <div className="text-center p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
            <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-1">Slot No.</p>
            <p className="text-2xl sm:text-3xl font-black text-[#F63049] leading-none">{slot.slot_no || '-'}</p>
          </div>
          <div className="text-center p-3 border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
            <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-1">Time Range</p>
            <p className="text-xs sm:text-sm font-bold font-mono">{slot.time_range}</p>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  )
}

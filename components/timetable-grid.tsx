'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

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
  { slot_no: 1, time: '09:30' },
  { slot_no: 2, time: '10:20' },
  { slot_no: 3, time: '11:20' },
  { slot_no: 4, time: '12:10' },
  { slot_no: 5, time: '13:05' },
  { slot_no: 6, time: '13:55' },
  { slot_no: 7, time: '14:45' },
  { slot_no: 8, time: '15:35' },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-black p-4 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
         <div>
            <h2 className="text-xl font-black uppercase">Weekly Configuration</h2>
            <p className="font-mono text-xs text-gray-500">Tap slots to toggle status.</p>
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-[#4ADE80] border-2 border-black dark:border-white"></div>
               <span className="font-bold uppercase text-xs">Free</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-[#F63049] border-2 border-black dark:border-white"></div>
               <span className="font-bold uppercase text-xs">Busy</span>
            </div>
         </div>
      </div>

      <div className="overflow-x-auto border-2 border-black dark:border-white bg-white dark:bg-zinc-900">
        <div className="min-w-[800px]">
           {/* Header Row */}
           <div className="grid grid-cols-9 border-b-2 border-black dark:border-white text-center font-black uppercase text-sm bg-gray-100 dark:bg-zinc-800">
             <div className="p-3 border-r-2 border-black dark:border-white">Day</div>
             {SLOTS.map(slot => (
               <div key={slot.slot_no} className="p-3 border-r-2 border-black dark:border-white last:border-r-0">
                  S{slot.slot_no}
                  <div className="text-[10px] font-mono font-normal opacity-70">{slot.time}</div>
               </div>
             ))}
           </div>

           {/* Days Rows */}
           {DAYS.map((day) => (
             <div key={day} className="grid grid-cols-9 border-b-2 border-black dark:border-white last:border-b-0">
               <div className="p-3 border-r-2 border-black dark:border-white font-bold uppercase flex items-center justify-center bg-gray-50 dark:bg-black">
                 {day.slice(0, 3)}
               </div>
               {SLOTS.map(slot => {
                 const isFree = timetable[day]?.[slot.slot_no] === 'FREE'
                 return (
                   <button
                     key={`${day}-${slot.slot_no}`}
                     onClick={() => toggleSlot(day, slot.slot_no)}
                     className={`
                       relative h-16 border-r-2 border-black dark:border-white last:border-r-0 transition-all
                       flex flex-col items-center justify-center
                       hover:opacity-80
                       ${isFree 
                         ? 'bg-[#4ADE80] text-black' 
                         : 'bg-[#F63049] text-white'}
                     `}
                   >
                     {isFree ? (
                       <Check className="h-6 w-6 stroke-[4]" />
                     ) : (
                       <X className="h-6 w-6 stroke-[4]" />
                     )}
                     <span className="text-[10px] font-black uppercase mt-1">
                       {isFree ? 'FREE' : 'BUSY'}
                     </span>
                   </button>
                 )
               })}
             </div>
           ))}
        </div>
      </div>

      <div className="flex justify-end p-4 border-2 border-black dark:border-white bg-[#FEF08A] dark:bg-yellow-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="rounded-none bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-transparent px-8 py-6 font-black uppercase text-lg tracking-widest shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          {isLoading ? 'Saving...' : 'Confirm Changes'}
        </Button>
      </div>
    </div>
  )
}

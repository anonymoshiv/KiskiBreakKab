'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TimetableGrid } from '@/components/timetable-grid'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Settings } from 'lucide-react'

export default function TimetablePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userUid, setUserUid] = useState('')
  const [initialTimetable, setInitialTimetable] = useState<Record<string, Record<number, string>> | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
      } else {
        try {
          // Find user's college UID
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where('firebaseUid', '==', user.uid))
          const snapshot = await getDocs(q)
          
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data()
            setUserUid(userData.uid)
            
            // Load existing timetable
            const timetableDoc = await getDoc(doc(db, 'timetables', userData.uid))
            if (timetableDoc.exists()) {
              setInitialTimetable(timetableDoc.data().schedule)
            }
          }
        } catch (error) {
          console.error('Error loading timetable:', error)
          toast.error('Failed to load timetable')
        }
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSaveTimetable = async (timetable: Record<string, Record<number, string>>) => {
    if (!userUid) return

    setIsSaving(true)
    try {
      await setDoc(doc(db, 'timetables', userUid), {
        uid: userUid,
        schedule: timetable,
        updatedAt: new Date().toISOString()
      })
      
      toast.success('Timetable saved successfully!')
      // Optional: Redirect back to dashboard after save
      // router.push('/dashboard')
    } catch (error) {
      console.error('Failed to save timetable:', error)
      toast.error('Failed to save timetable')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="font-black uppercase tracking-widest text-xl">Loading Protocol...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-black dark:border-white pb-6">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-block">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2 rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
               <Calendar className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={2.5} />
               Time<span className="text-[#F63049]">table</span>
            </h1>
            <p className="font-mono text-sm font-bold opacity-60 max-w-md">
               CONFIGURE YOUR AVAILABILITY MODULE. MARK SLOTS AS 'FREE' TO ENABLE SOCIAL SYNCHRONIZATION.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-black p-1 sm:p-2 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_#404040]">
           <TimetableGrid 
             onSave={handleSaveTimetable}
             isLoading={isSaving}
             initialTimetable={initialTimetable}
           />
        </div>

        <div className="text-center font-mono text-xs uppercase opacity-50 space-y-1">
           <p>System ID: {userUid || 'UNKNOWN'}</p>
           <p>Secure Connection Established</p>
        </div>
      </div>
    </div>
  )
}

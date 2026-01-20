'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TimetableGrid } from '@/components/timetable-grid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { ArrowLeft, Calendar } from 'lucide-react'

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
    } catch (error) {
      console.error('Failed to save timetable:', error)
      toast.error('Failed to save timetable')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                My Timetable
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Set your schedule to find free friends during breaks
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-secondary/50">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• All slots are marked as <span className="font-semibold text-red-500">BUSY</span> by default</p>
            <p>• Click on slots to mark them as <span className="font-semibold text-green-500">FREE</span> when you don't have lectures</p>
            <p>• Your friends can see when you're available during breaks</p>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <TimetableGrid 
          onSave={handleSaveTimetable} 
          isLoading={isSaving}
          initialTimetable={initialTimetable}
        />
      </div>
    </div>
  )
}

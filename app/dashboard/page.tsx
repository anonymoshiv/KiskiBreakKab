'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrentSlotWidget } from '@/components/current-slot-widget'
import { FreeFriendsList } from '@/components/free-friends-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userUid, setUserUid] = useState('')
  const [friendsCount, setFriendsCount] = useState(0)
  const [groupsCount, setGroupsCount] = useState(0)
  const [userTimetable, setUserTimetable] = useState<Record<string, Record<number, string>> | null>(null)
  const [freeFriends, setFreeFriends] = useState<any[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
      } else {
        // Get user data from Firestore by searching with Firebase UID
        try {
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where('firebaseUid', '==', user.uid))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            setUserName(userData.name)
            setUserUid(userData.uid)
            
            // Load friends count
            const friendsSnapshot = await getDocs(collection(db, 'users', userData.uid, 'friends'))
            setFriendsCount(friendsSnapshot.size)
            
            // Load groups count (groups where user is a member)
            const groupsQuery = query(
              collection(db, 'groups'),
              where('members', 'array-contains', userData.uid)
            )
            const groupsSnapshot = await getDocs(groupsQuery)
            setGroupsCount(groupsSnapshot.size)
            
            // Load user's timetable
            const timetableDoc = await getDoc(doc(db, 'timetables', userData.uid))
            if (timetableDoc.exists()) {
              setUserTimetable(timetableDoc.data().schedule)
            }
            
            // Load free friends
            await loadFreeFriends(userData.uid)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const loadFreeFriends = async (currentUserUid: string) => {
    try {
      setLoadingFriends(true)
      
      // Get current slot info
      const now = new Date()
      const day = now.toLocaleDateString('en-US', { weekday: 'long' })
      const dayOfWeek = now.getDay()
      
      // Skip if weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setFreeFriends([])
        setLoadingFriends(false)
        return
      }
      
      // Calculate current slot
      const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      const currentMinutes = timeToMinutes(currentTime)
      
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
      
      let currentSlot: number | null = null
      for (const slot of SLOTS) {
        const startMinutes = timeToMinutes(slot.start)
        const endMinutes = timeToMinutes(slot.end)
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          currentSlot = slot.slot_no
          break
        }
      }
      
      // If not in any slot, no friends to show
      if (!currentSlot) {
        setFreeFriends([])
        setLoadingFriends(false)
        return
      }
      
      // Get user's friends
      const friendsSnapshot = await getDocs(collection(db, 'users', currentUserUid, 'friends'))
      const friendUids = friendsSnapshot.docs.map(doc => doc.data().uid)
      
      if (friendUids.length === 0) {
        setFreeFriends([])
        setLoadingFriends(false)
        return
      }
      
      // Check each friend's timetable
      const freeFriendsList = []
      for (const friendUid of friendUids) {
        // Get friend's basic info
        const friendDoc = await getDoc(doc(db, 'users', friendUid))
        if (!friendDoc.exists()) continue
        
        const friendData = friendDoc.data()
        
        // Get friend's timetable
        const friendTimetableDoc = await getDoc(doc(db, 'timetables', friendUid))
        
        if (friendTimetableDoc.exists()) {
          const schedule = friendTimetableDoc.data().schedule
          const friendStatus = schedule?.[day]?.[currentSlot]
          
          // Only add if friend is FREE
          if (friendStatus === 'FREE') {
            freeFriendsList.push({
              id: friendUid,
              name: friendData.name,
              uid: friendData.uid,
              email: friendData.email,
              status: 'FREE'
            })
          }
        }
      }
      
      setFreeFriends(freeFriendsList)
      setLoadingFriends(false)
    } catch (error) {
      console.error('Error loading free friends:', error)
      setLoadingFriends(false)
    }
  }
  
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully!')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-base sm:text-lg font-bold">K</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                KiskiBreakKab
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Find free friends instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">{userName.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-2xl shadow-blue-500/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2">Welcome back, {userName}! 👋</h2>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg">Check who's free during breaks and plan hangouts instantly</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
          {/* Left Column - Current Slot (Full width on mobile) */}
          <div className="lg:col-span-2">
            <CurrentSlotWidget timetable={userTimetable} />
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/timetable" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">📅 Edit Timetable</span>
                  </button>
                </Link>
                <Link href="/friends" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200">👥 Manage Friends</span>
                  </button>
                </Link>
                <Link href="/groups" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border border-pink-200 dark:border-pink-800 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-pink-700 dark:text-pink-300 group-hover:text-pink-800 dark:group-hover:text-pink-200">🎯 Manage Groups</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Stats</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">👥 Friends</span>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{friendsCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">🎯 Groups</span>
                  <span className="text-2xl font-black text-purple-700 dark:text-purple-300">{groupsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Friends Free Now */}
        <FreeFriendsList friends={freeFriends} isLoading={loadingFriends} />
      </div>
    </div>
  )
}

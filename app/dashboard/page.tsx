'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CurrentSlotWidget } from '@/components/current-slot-widget'
import { FreeFriendsList } from '@/components/free-friends-list'
import { ThemeToggle } from '@/components/theme-toggle'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { LogOut, User, Trash2, Bell, UserPlus, Users as UsersIcon } from 'lucide-react'
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, writeBatch, updateDoc, arrayUnion, onSnapshot, Unsubscribe, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { acceptFriendRequest, rejectFriendRequest, getPendingRequests } from '@/lib/friends'

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    let notificationUnsubscribe: Unsubscribe | null = null

    // Check if user is logged in
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
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
            
            // Set up real-time listener for friend requests
            const friendRequestsQuery = query(
              collection(db, 'friendRequests'),
              where('to', '==', userData.uid),
              where('status', '==', 'pending')
            )
            
            notificationUnsubscribe = onSnapshot(friendRequestsQuery, async (snapshot) => {
              await loadNotifications(userData.uid)
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
        setIsLoading(false)
      }
    })

    return () => {
      authUnsubscribe()
      if (notificationUnsubscribe) {
        notificationUnsubscribe()
      }
    }
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

  const loadNotifications = async (userUid: string) => {
    try {
      const notifs: any[] = []
      
      // Get dismissed notifications from Firestore
      const dismissedNotificationsDoc = await getDoc(doc(db, 'users', userUid, 'settings', 'dismissedNotifications'))
      const dismissedIds = dismissedNotificationsDoc.exists() 
        ? (dismissedNotificationsDoc.data().notificationIds || [])
        : []
      
      // Load friend requests from friendRequests collection
      const pendingRequests = await getPendingRequests(userUid)
      
      for (const request of pendingRequests) {
        // Skip if this notification was dismissed
        if (!dismissedIds.includes(request.id)) {
          notifs.push({
            id: request.id,
            type: 'friend_request',
            from: request.fromName,
            fromUid: request.from,
            timestamp: request.createdAt?.toDate?.() || new Date(),
            message: `${request.fromName} sent you a friend request`
          })
        }
      }
      
      // Load group invitations (groups where user is member but hasn't been notified yet)
      const groupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userUid)
      )
      const groupsSnapshot = await getDocs(groupsQuery)
      
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data()
        // Skip if this notification was dismissed
        if (dismissedIds.includes(groupDoc.id)) continue
        
        // Check if this is a new group invitation (created in last 24 hours and user is not the owner)
        if (groupData.ownerId !== userUid) {
          const createdAt = groupData.createdAt?.toDate() || new Date()
          const hoursSinceCreated = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceCreated < 24) {
            const ownerDoc = await getDoc(doc(db, 'users', groupData.ownerId))
            notifs.push({
              id: groupDoc.id,
              type: 'group_invitation',
              groupName: groupData.name,
              from: ownerDoc.exists() ? ownerDoc.data().name : 'Someone',
              fromUid: groupData.ownerId,
              timestamp: createdAt,
              message: `${ownerDoc.exists() ? ownerDoc.data().name : 'Someone'} added you to group "${groupData.name}"`
            })
          }
        }
      }
      
      // Sort by timestamp (newest first)
      notifs.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
        return bTime - aTime
      })
      
      setNotifications(notifs)
      setNotificationCount(notifs.length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId, userUid)
      toast.success('Friend request accepted!')
      
      // Reload data
      await loadNotifications(userUid)
      await loadFreeFriends(userUid)
      
      // Update friends count
      const friendsSnapshot = await getDocs(collection(db, 'users', userUid, 'friends'))
      setFriendsCount(friendsSnapshot.size)
    } catch (error: any) {
      console.error('Error accepting friend request:', error)
      toast.error(error.message || 'Failed to accept friend request')
    }
  }

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId)
      toast.success('Friend request rejected')
      await loadNotifications(userUid)
    } catch (error: any) {
      console.error('Error rejecting friend request:', error)
      toast.error(error.message || 'Failed to reject friend request')
    }
  }

  const handleDismissNotification = async (notificationId: string, type: string) => {
    try {
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setNotificationCount(prev => Math.max(0, prev - 1))
      
      // Persist the dismissal to Firestore
      const dismissedNotificationsRef = doc(db, 'users', userUid, 'settings', 'dismissedNotifications')
      const dismissedNotificationsDoc = await getDoc(dismissedNotificationsRef)
      
      if (dismissedNotificationsDoc.exists()) {
        // Update existing document
        await updateDoc(dismissedNotificationsRef, {
          notificationIds: arrayUnion(notificationId)
        })
      } else {
        // Create new document
        await setDoc(dismissedNotificationsRef, {
          notificationIds: [notificationId]
        })
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
      toast.error('Failed to dismiss notification')
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

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !userUid) return

    setIsDeleting(true)
    try {
      // Delete user document and subcollections from Firestore
      const batch = writeBatch(db)
      
      // Delete user's friends subcollection
      const friendsSnapshot = await getDocs(collection(db, 'users', userUid, 'friends'))
      friendsSnapshot.forEach((friendDoc) => {
        batch.delete(friendDoc.ref)
      })
      
      // Delete user's timetable subcollection if exists
      const timetableRef = doc(db, 'users', userUid, 'timetable', 'schedule')
      const timetableDoc = await getDoc(timetableRef)
      if (timetableDoc.exists()) {
        batch.delete(timetableRef)
      }
      
      // Delete main user document
      const userDocRef = doc(db, 'users', userUid)
      batch.delete(userDocRef)
      
      // Commit all deletions
      await batch.commit()
      
      // Delete user from Firebase Auth
      await deleteUser(auth.currentUser)
      
      toast.success('Account deleted successfully')
      router.push('/register')
    } catch (error: any) {
      console.error('Delete account error:', error)
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please log out and log back in before deleting your account')
      } else {
        toast.error('Failed to delete account. Please try again.')
      }
      setIsDeleting(false)
      setShowDeleteDialog(false)
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#F63049] flex items-center justify-center shadow-lg shadow-[#F63049]/30">
              <span className="text-white text-base sm:text-lg font-bold">K</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-black text-[#F63049] dark:text-[#F63049]">
                KiskiBreakKab
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find free friends instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            {/* Notifications */}
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F63049] flex items-center justify-center text-xs font-bold text-white shadow-lg">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 sm:w-96 p-0">
                <div className="bg-[#F63049] p-4">
                  <h3 className="text-lg font-bold text-white">Notifications</h3>
                  <p className="text-xs text-white/80">{notificationCount} new notification{notificationCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          {notif.type === 'friend_request' ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#F63049] flex items-center justify-center flex-shrink-0">
                                  <UserPlus className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.from}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {new Date(notif.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAcceptFriendRequest(notif.id)}
                                  size="sm"
                                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button
                                  onClick={() => handleRejectFriendRequest(notif.id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/30"
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ) : notif.type === 'group_invitation' ? (
                            <div className="space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#F63049] flex items-center justify-center flex-shrink-0">
                                  <UsersIcon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.from}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {new Date(notif.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleDismissNotification(notif.id, notif.type)}
                                size="sm"
                                variant="ghost"
                                className="w-full h-8 text-xs"
                              >
                                Dismiss
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No notifications</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F63049] flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-lg">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">{userName.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userUid}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Account</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#F63049] p-6 sm:p-8 shadow-2xl shadow-[#F63049]/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 sm:mb-2">Welcome back, {userName}! 👋</h2>
            <p className="text-white/80 text-sm sm:text-base md:text-lg">Check who's free during breaks and plan hangouts instantly</p>
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
            <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg dark:shadow-none overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/timetable" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/40 hover:shadow-lg hover:shadow-[#F63049]/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-[#F63049] dark:text-[#F63049] group-hover:text-[#F63049]/80 dark:group-hover:text-[#F63049]/90">📅 Edit Timetable</span>
                  </button>
                </Link>
                <Link href="/friends" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/40 hover:shadow-lg hover:shadow-[#F63049]/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-[#F63049] dark:text-[#F63049] group-hover:text-[#F63049]/80 dark:group-hover:text-[#F63049]/90">👥 Manage Friends</span>
                  </button>
                </Link>
                <Link href="/groups" className="block">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/40 hover:shadow-lg hover:shadow-[#F63049]/20 transition-all duration-200 hover:scale-[1.02] group">
                    <span className="text-sm font-semibold text-[#F63049] dark:text-[#F63049] group-hover:text-[#F63049]/80 dark:group-hover:text-[#F63049]/90">🎯 Manage Groups</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg dark:shadow-none overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Stats</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/40">
                  <span className="text-sm font-medium text-[#F63049] dark:text-[#F63049]">👥 Friends</span>
                  <span className="text-2xl font-black text-[#F63049] dark:text-[#F63049]">{friendsCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/40">
                  <span className="text-sm font-medium text-[#F63049] dark:text-[#F63049]">🎯 Groups</span>
                  <span className="text-2xl font-black text-[#F63049] dark:text-[#F63049]">{groupsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Friends Free Now */}
        <FreeFriendsList friends={freeFriends} isLoading={loadingFriends} />
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your profile information</li>
                <li>Your timetable data</li>
                <li>Your friends list</li>
                <li>All associated data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-[#F63049] hover:bg-[#F63049]/90 dark:bg-[#F63049] dark:hover:bg-[#F63049]/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

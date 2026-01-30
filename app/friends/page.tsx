'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  Friend,
  FriendRequest
} from '@/lib/friends'
import { toast } from 'sonner'
import { UserPlus, UserMinus, Check, X, ArrowLeft, Users, User, Share2, Calendar } from 'lucide-react'

export default function FriendsPage() {
  const router = useRouter()
  const [currentUserUid, setCurrentUserUid] = useState<string>('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [searchUid, setSearchUid] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friendTimetable, setFriendTimetable] = useState<Record<number, string> | null>(null)
  const [loadingTimetable, setLoadingTimetable] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
      } else {
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('firebaseUid', '==', user.uid))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0]
          setCurrentUserUid(userData.data().uid)
          await loadFriendsData(userData.data().uid)
        }
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const loadFriendsData = async (uid: string) => {
    try {
      const [friendsList, pending, sent] = await Promise.all([
        getFriends(uid),
        getPendingRequests(uid),
        getSentRequests(uid)
      ])
      
      setFriends(friendsList)
      setPendingRequests(pending)
      setSentRequests(sent)
    } catch (error) {
      console.error('Error loading friends data:', error)
    }
  }

  const handleSendRequest = async () => {
    if (!searchUid.trim()) {
      toast.error('Please enter a UID')
      return
    }

    if (searchUid.toLowerCase() === currentUserUid.toLowerCase()) {
      toast.error('You cannot add yourself as a friend')
      return
    }

    setIsSubmitting(true)
    try {
      await sendFriendRequest(currentUserUid, searchUid.toLowerCase())
      toast.success('Request transmitted')
      setSearchUid('')
      await loadFriendsData(currentUserUid)
    } catch (error: any) {
      toast.error(error.message || 'Transmission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId)
      toast.success('Connection established')
      await loadFriendsData(currentUserUid)
    } catch (error) {
      toast.error('Failed to establish connection')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId)
      toast.success('Request declined')
      await loadFriendsData(currentUserUid)
    } catch (error) {
      toast.error('Operation failed')
    }
  }

  const handleRemoveFriend = async (friendUid: string) => {
    if (confirm('Are you sure you want to terminate this connection?')) {
      try {
        await removeFriend(currentUserUid, friendUid)
        toast.success('Connection terminated')
        await loadFriendsData(currentUserUid)
      } catch (error) {
        toast.error('Failed to remove friend')
      }
    }
  }

  const handleViewTimetable = async (friend: Friend) => {
    setSelectedFriend(friend)
    setLoadingTimetable(true)
    
    try {
      // Fetch from timetables collection instead of users collection
      const timetableDoc = await getDoc(doc(db, 'timetables', friend.uid))
      
      if (timetableDoc.exists()) {
        const timetableData = timetableDoc.data()
        const now = new Date()
        const day = now.toLocaleDateString('en-US', { weekday: 'long' })
        const todayTimetable = timetableData.schedule?.[day] || {}
        setFriendTimetable(todayTimetable)
      } else {
        setFriendTimetable({})
      }
    } catch (error) {
      console.error('Error fetching timetable:', error)
      toast.error('Failed to load timetable')
      setFriendTimetable({})
    } finally {
      setLoadingTimetable(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="font-black uppercase tracking-widest text-xl">Loading Network...</p>
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
               <Users className="h-8 w-8 sm:h-12 sm:w-12" strokeWidth={2.5} />
               Friend<span className="text-[#8B5CF6]">Zone</span>
            </h1>
            <p className="font-mono text-sm font-bold opacity-60">
               MANAGE SOCIAL CONNECTIONS AND NETWORK REQUESTS.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Sidebar: Add Friend & Pending */}
           <div className="space-y-8">
              
              {/* Add Friend Widget */}
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
                 <div className="bg-[#8B5CF6] p-4 border-b-2 border-black dark:border-white">
                    <h2 className="text-white font-black uppercase tracking-wider flex items-center gap-2">
                       <UserPlus className="h-5 w-5" /> Add Connection
                    </h2>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase">Enter User ID</label>
                       <div className="flex gap-2">
                          <Input 
                             value={searchUid}
                             onChange={(e) => setSearchUid(e.target.value)}
                             placeholder="e.g. 22BCS12345"
                             className="rounded-none border-2 border-black dark:border-white focus-visible:ring-0 font-mono uppercase"
                          />
                       </div>
                    </div>
                    <Button 
                       onClick={handleSendRequest}
                       disabled={isSubmitting || !searchUid}
                       className="w-full rounded-none bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-transparent font-bold uppercase shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_#fff] transition-all"
                    >
                       {isSubmitting ? 'Transmitting...' : 'Send Request'}
                    </Button>
                 </div>
              </div>

              {/* Pending Requests */}
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white">
                 <div className="bg-[#E4E4E7] dark:bg-zinc-800 p-3 border-b-2 border-black dark:border-white">
                    <h2 className="text-black dark:text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
                       <Share2 className="h-4 w-4" /> Incoming ({pendingRequests.length})
                    </h2>
                 </div>
                 <div className="p-4 space-y-3 bg-gray-50 dark:bg-zinc-900 min-h-[100px]">
                    {pendingRequests.length === 0 ? (
                       <p className="text-xs font-mono text-gray-400 text-center py-4">NO PENDING REQUESTS</p>
                    ) : (
                       pendingRequests.map(req => (
                          <div key={req.id} className="bg-white dark:bg-black border-2 border-black dark:border-white p-3 flex flex-col gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 rounded-none border-2 border-black dark:border-white">
                                   <AvatarFallback className="rounded-none bg-black text-white font-bold">{req.fromName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                   <p className="font-bold text-sm uppercase">{req.fromName}</p>
                                   <p className="font-mono text-[10px] text-gray-500">{req.fromUid}</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => handleAcceptRequest(req.id)} size="sm" className="rounded-none bg-[#4ADE80] text-black border-2 border-black hover:bg-[#22c55e] font-bold uppercase text-[10px]">Accept</Button>
                                <Button onClick={() => handleRejectRequest(req.id)} size="sm" className="rounded-none bg-[#F63049] text-white border-2 border-black hover:bg-[#ef4444] font-bold uppercase text-[10px]">Decline</Button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>

           </div>

           {/* Main: Friends List */}
           <div className="lg:col-span-2">
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
                 <div className="bg-black dark:bg-white p-4 border-b-2 border-black dark:border-white flex justify-between items-center">
                    <h2 className="text-white dark:text-black font-black uppercase tracking-wider text-lg">
                       Established Connections
                    </h2>
                    <span className="font-mono text-xs font-bold bg-white dark:bg-black text-black dark:text-white px-2 py-1 border border-transparent">
                       TOTAL: {friends.length}
                    </span>
                 </div>
                 
                 <div className="p-6">
                    {friends.length === 0 ? (
                       <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-zinc-700">
                          <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="font-black uppercase text-gray-400">No Connections Found</p>
                          <p className="font-mono text-xs text-gray-400">Add friends via ID to begin.</p>
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {friends.map(friend => (
                             <div 
                                key={friend.uid} 
                                className="group relative bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                onClick={() => handleViewTimetable(friend)}
                             >
                                <div className="flex items-start justify-between">
                                   <div className="flex items-center gap-3">
                                      <Avatar className="h-12 w-12 rounded-none border-2 border-black dark:border-white">
                                         <AvatarFallback className="rounded-none bg-[#F63049] text-white font-black text-lg">
                                            {friend.name[0]}
                                         </AvatarFallback>
                                      </Avatar>
                                      <div>
                                         <p className="font-black text-sm uppercase">{friend.name}</p>
                                         <p className="font-mono text-xs text-gray-500">{friend.uid}</p>
                                      </div>
                                   </div>
                                </div>
                                <div className="mt-4 pt-4 border-t-2 border-black dark:border-white border-dashed flex justify-between items-center">
                                   <Button
                                      onClick={(e) => {
                                         e.stopPropagation()
                                         handleViewTimetable(friend)
                                      }}
                                      variant="ghost"
                                      className="h-8 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase text-[10px] rounded-none transition-colors"
                                   >
                                      <Calendar className="h-3 w-3 mr-1" /> View Schedule
                                   </Button>
                                   <Button 
                                      onClick={(e) => {
                                         e.stopPropagation()
                                         handleRemoveFriend(friend.uid)
                                      }}
                                      variant="ghost" 
                                      className="h-8 text-red-500 hover:text-white hover:bg-red-500 font-bold uppercase text-[10px] rounded-none transition-colors"
                                   >
                                      <UserMinus className="h-3 w-3 mr-1" /> Terminate
                                   </Button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Timetable Dialog */}
      <Dialog open={!!selectedFriend} onOpenChange={(open) => {
        if (!open) setSelectedFriend(null)
      }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-black p-0 border-4 border-black dark:border-white rounded-none shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_#404040]">
          <DialogHeader className="p-4 pr-12 border-b-2 border-black dark:border-white bg-[#F63049]">
            <DialogTitle className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {selectedFriend?.name}'s Schedule
            </DialogTitle>
            <DialogDescription className="text-white/80 font-mono text-xs">
              Today's timetable • {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-zinc-900">
            {loadingTimetable ? (
              <div className="text-center space-y-3 py-8">
                <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-black uppercase tracking-widest text-sm">Loading Schedule...</p>
              </div>
            ) : friendTimetable && Object.keys(friendTimetable).length > 0 ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
                  const status = friendTimetable[slot]
                  const slotTimes = [
                    '09:30 - 10:20',
                    '10:20 - 11:10',
                    '11:20 - 12:10',
                    '12:10 - 13:00',
                    '13:05 - 13:55',
                    '13:55 - 14:45',
                    '14:45 - 15:35',
                    '15:35 - 16:25'
                  ]
                  
                  return (
                    <div
                      key={slot}
                      className={`p-3 border-2 border-black dark:border-white flex justify-between items-center ${
                        status === 'FREE'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : status === 'BUSY'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-white dark:bg-black'
                      }`}
                    >
                      <div>
                        <p className="font-black text-sm uppercase">Slot {slot}</p>
                        <p className="font-mono text-xs text-gray-500">{slotTimes[slot - 1]}</p>
                      </div>
                      <div
                        className={`px-3 py-1 border-2 border-black dark:border-white font-black text-xs uppercase ${
                          status === 'FREE'
                            ? 'bg-green-500 text-white'
                            : status === 'BUSY'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 text-black'
                        }`}
                      >
                        {status || 'N/A'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-zinc-700">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="font-black uppercase text-gray-400">No Schedule Data</p>
                <p className="font-mono text-xs text-gray-400">This user hasn't set their timetable yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

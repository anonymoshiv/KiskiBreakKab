'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
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
import { UserPlus, UserMinus, Check, X, ArrowLeft } from 'lucide-react'

export default function FriendsPage() {
  const router = useRouter()
  const [currentUserUid, setCurrentUserUid] = useState<string>('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [searchUid, setSearchUid] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check authentication and load data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
      } else {
        // Find user's college UID from Firestore
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
      toast.success('Friend request sent!')
      setSearchUid('')
      await loadFriendsData(currentUserUid)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send friend request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId, currentUserUid)
      toast.success('Friend request accepted!')
      await loadFriendsData(currentUserUid)
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId)
      toast.success('Friend request rejected')
      await loadFriendsData(currentUserUid)
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request')
    }
  }

  const handleRemoveFriend = async (friendUid: string, friendName: string) => {
    if (!confirm(`Remove ${friendName} from your friends?`)) return

    try {
      await removeFriend(currentUserUid, friendUid)
      toast.success('Friend removed')
      await loadFriendsData(currentUserUid)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove friend')
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
    <div className="min-h-screen bg-white dark:bg-black p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#F63049] flex items-center justify-center shadow-lg">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black dark:text-white">
                Friends
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Connect and see who's free during breaks
              </p>
            </div>
          </div>
        </div>
        {/* Add Friend Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          <div className="bg-[#F63049] p-6">
            <h3 className="text-xl font-black text-white mb-1">Add New Friend</h3>
            <p className="text-blue-100 text-sm">Search by college UID (e.g., 23bcs12345)</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uid" className="font-semibold text-gray-700 dark:text-gray-300">Friend's College UID</Label>
              <Input
                id="uid"
                placeholder="e.g., 23bcs12345"
                value={searchUid}
                onChange={e => setSearchUid(e.target.value.toLowerCase())}
                className="h-12 rounded-xl border-gray-300 dark:border-gray-700 focus:border-[#F63049] dark:focus:border-[#F63049]"
              />
            </div>
            <Button 
              onClick={handleSendRequest} 
              disabled={isSubmitting || !searchUid.trim()} 
              className="w-full h-12 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg transition-all duration-300"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Sending...' : 'Send Friend Request'}
            </Button>
          </div>
        </div>

        {/* Pending Requests (Received) */}
        {pendingRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#F63049]/30 dark:border-[#F63049]/50 shadow-xl overflow-hidden">
            <div className="bg-[#F63049] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white mb-1">Pending Requests</h3>
                  <p className="text-purple-100 text-sm">People who want to be your friend</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-lg">{pendingRequests.length}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#F63049] text-white font-bold text-lg">
                          {request.fromName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-black dark:text-white">{request.fromName}</p>
                        <p className="text-xs text-[#F63049] dark:text-[#F63049] font-medium">{request.from}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="h-9 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        className="h-9 rounded-xl border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[#F63049]/30 dark:border-[#F63049]/50 shadow-xl overflow-hidden">
            <div className="bg-[#F63049] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white mb-1">Sent Requests</h3>
                  <p className="text-amber-100 text-sm">Waiting for response</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-lg">{sentRequests.length}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {sentRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#F63049] text-white font-bold text-lg">
                          ?
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-black dark:text-white">{request.to}</p>
                        <p className="text-xs text-[#F63049] dark:text-[#F63049] font-medium">Pending...</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-[#F63049]/20 dark:bg-[#F63049]/30 border border-[#F63049]/50">
                      <span className="text-xs font-bold text-[#F63049] dark:text-white">⏳ Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          <div className="bg-[#F63049] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white mb-1">My Friends</h3>
                <p className="text-white/90 text-sm">Your accepted connections</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-black text-xl">{friends.length}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map(friend => (
                  <div key={friend.uid} className="flex items-center justify-between p-4 rounded-xl bg-[#F63049]/10 dark:bg-[#F63049]/20 border border-[#F63049]/30 dark:border-[#F63049]/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[#F63049] text-white font-bold text-lg">
                            {friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#F63049] rounded-full border-2 border-white dark:border-gray-900"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black dark:text-white">{friend.name}</p>
                        <p className="text-xs text-[#F63049] dark:text-[#F63049] font-medium">{friend.uid}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFriend(friend.uid, friend.name)}
                      className="rounded-xl text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👥</span>
                </div>
                <p className="text-lg font-bold text-black dark:text-white mb-1">No friends yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add friends using their UID above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

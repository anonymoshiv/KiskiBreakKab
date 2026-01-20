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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
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
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                Friends
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Connect and see who's free during breaks
              </p>
            </div>
          </div>
        </div>
        {/* Add Friend Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
            <h3 className="text-xl font-black text-white mb-1">Add New Friend</h3>
            <p className="text-blue-100 text-sm">Search by college UID (e.g., 23bcs12345)</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uid" className="font-semibold text-slate-700 dark:text-slate-300">Friend's College UID</Label>
              <Input
                id="uid"
                placeholder="e.g., 23bcs12345"
                value={searchUid}
                onChange={e => setSearchUid(e.target.value.toLowerCase())}
                className="h-12 rounded-xl border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <Button 
              onClick={handleSendRequest} 
              disabled={isSubmitting || !searchUid.trim()} 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Sending...' : 'Send Friend Request'}
            </Button>
          </div>
        </div>

        {/* Pending Requests (Received) */}
        {pendingRequests.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900 shadow-xl shadow-purple-200/50 dark:shadow-none overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-6">
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
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-lg">
                          {request.fromName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">{request.fromName}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{request.from}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="h-9 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg shadow-green-500/30"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        className="h-9 rounded-xl border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-xl shadow-amber-200/50 dark:shadow-none overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-6">
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
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-600 text-white font-bold text-lg">
                          ?
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">{request.to}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending...</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-amber-200 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">⏳ Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white mb-1">My Friends</h3>
                <p className="text-green-100 text-sm">Your accepted connections</p>
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
                  <div key={friend.uid} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white font-bold text-lg">
                            {friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-white">{friend.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">{friend.uid}</p>
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👥</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">No friends yet</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Add friends using their UID above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

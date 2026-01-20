'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { ArrowLeft, Users, Search, Plus, Trash2 } from 'lucide-react'

interface Friend {
  uid: string
  name: string
  email: string
}

interface GroupMember {
  uid: string
  name: string
  email: string
  status?: 'FREE' | 'BUSY' | null
}

interface Group {
  id: string
  name: string
  createdBy: string
  members: string[] // Array of UIDs
  createdAt: Date
}

export default function GroupsPage() {
  const router = useRouter()
  const [currentUserUid, setCurrentUserUid] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  
  // Create group states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  // View group states
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Check authentication and load data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
      } else {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('firebaseUid', '==', user.uid))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data()
          setCurrentUserUid(userData.uid)
          await loadGroups(userData.uid)
          await loadFriends(userData.uid)
        }
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const loadGroups = async (userUid: string) => {
    try {
      const groupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userUid)
      )
      const snapshot = await getDocs(groupsQuery)
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Group[]
      setGroups(groupsData)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Failed to load groups')
    }
  }

  const loadFriends = async (userUid: string) => {
    try {
      const friendsSnapshot = await getDocs(collection(db, 'users', userUid, 'friends'))
      const friendsData: Friend[] = []
      
      for (const friendDoc of friendsSnapshot.docs) {
        const friendUid = friendDoc.data().uid
        const userDoc = await getDoc(doc(db, 'users', friendUid))
        if (userDoc.exists()) {
          friendsData.push({
            uid: friendUid,
            name: userDoc.data().name,
            email: userDoc.data().email
          })
        }
      }
      
      setFriends(friendsData)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedFriends.length === 0) {
      toast.error('Please enter a group name and select at least one friend')
      return
    }

    setIsCreating(true)
    try {
      const groupData = {
        name: newGroupName.trim(),
        createdBy: currentUserUid,
        members: [currentUserUid, ...selectedFriends],
        createdAt: new Date()
      }
      
      await addDoc(collection(db, 'groups'), groupData)
      toast.success('Group created successfully!')
      
      setNewGroupName('')
      setSelectedFriends([])
      setShowCreateForm(false)
      await loadGroups(currentUserUid)
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return

    try {
      await deleteDoc(doc(db, 'groups', groupId))
      toast.success('Group deleted successfully!')
      setGroups(groups.filter(g => g.id !== groupId))
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null)
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group')
    }
  }

  const loadGroupMembersWithStatus = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    setLoadingMembers(true)
    try {
      // Get current slot info
      const now = new Date()
      const day = now.toLocaleDateString('en-US', { weekday: 'long' })
      const dayOfWeek = now.getDay()
      
      // Skip if weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const membersData = await Promise.all(
          group.members.map(async (memberUid) => {
            const userDoc = await getDoc(doc(db, 'users', memberUid))
            return {
              uid: memberUid,
              name: userDoc.data()?.name || 'Unknown',
              email: userDoc.data()?.email || '',
              status: null
            }
          })
        )
        setGroupMembers(membersData)
        setLoadingMembers(false)
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
      
      // Load member info with status
      const membersData = await Promise.all(
        group.members.map(async (memberUid) => {
          const userDoc = await getDoc(doc(db, 'users', memberUid))
          let status: 'FREE' | 'BUSY' | null = null
          
          if (currentSlot) {
            const timetableDoc = await getDoc(doc(db, 'timetables', memberUid))
            if (timetableDoc.exists()) {
              const schedule = timetableDoc.data().schedule
              status = schedule?.[day]?.[currentSlot] || null
            }
          }
          
          return {
            uid: memberUid,
            name: userDoc.data()?.name || 'Unknown',
            email: userDoc.data()?.email || '',
            status
          }
        })
      )
      
      setGroupMembers(membersData)
    } catch (error) {
      console.error('Error loading group members:', error)
      toast.error('Failed to load group members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const toggleFriendSelection = (uid: string) => {
    setSelectedFriends(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const filteredFriends = friends.filter(friend =>
    friend.uid.toLowerCase().includes(friendSearch.toLowerCase()) ||
    friend.name.toLowerCase().includes(friendSearch.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                Groups
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Create groups and track everyone's availability
              </p>
            </div>
          </div>
        </div>

        {/* Create Group Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          {showCreateForm ? (
            <>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <h3 className="text-xl font-black text-white mb-1">Create New Group</h3>
                <p className="text-purple-100 text-sm">Select friends to add to your group</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="font-semibold text-slate-700 dark:text-slate-300">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., CS Batch, Hostel Friends"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="h-12 rounded-xl border-slate-300 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-500"
                  />
                </div>

                {/* Search Friends */}
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700 dark:text-slate-300">Add Friends ({selectedFriends.length} selected)</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or UID..."
                      value={friendSearch}
                      onChange={e => setFriendSearch(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Friends List */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-64 overflow-y-auto">
                  {filteredFriends.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {filteredFriends.map(friend => (
                        <div
                          key={friend.uid}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 cursor-pointer transition-all duration-200"
                          onClick={() => toggleFriendSelection(friend.uid)}
                        >
                          <Checkbox
                            checked={selectedFriends.includes(friend.uid)}
                            onCheckedChange={() => toggleFriendSelection(friend.uid)}
                            className="data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-600 data-[state=checked]:to-pink-600 border-2"
                          />
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-sm">
                              {friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{friend.name}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{friend.uid}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">👥</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        {friends.length === 0 ? 'No friends yet' : 'No matching friends'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {friends.length === 0 ? 'Add friends first!' : 'Try a different search term'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCreateGroup}
                    disabled={isCreating || !newGroupName.trim() || selectedFriends.length === 0}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewGroupName('')
                      setSelectedFriends([])
                      setFriendSearch('')
                    }}
                    className="flex-1 h-12 rounded-xl border-2 border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <h3 className="text-xl font-black text-white mb-1">Your Groups</h3>
                <p className="text-purple-100 text-sm">Organize friends to track availability together</p>
              </div>
              <div className="p-6">
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Group
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Groups List */}
        <div className="grid gap-4">
          {groups.length > 0 ? (
            groups.map(group => (
              <div key={group.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-white" />
                        <h3 className="text-xl font-black text-white">{group.name}</h3>
                      </div>
                      <p className="text-blue-100 text-sm">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-white hover:bg-white/20 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {selectedGroupId === group.id ? (
                    // Expanded view with member status
                    <div className="space-y-3">
                      {loadingMembers ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 flex items-center justify-center mx-auto mb-3 animate-pulse">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading member status...</p>
                        </div>
                      ) : (
                        <>
                          {groupMembers.map(member => (
                            <div
                              key={member.uid}
                              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-bold text-lg">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{member.uid}</p>
                                </div>
                              </div>
                              {member.status === 'FREE' && (
                                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30">
                                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                    FREE
                                  </span>
                                </div>
                              )}
                              {member.status === 'BUSY' && (
                                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30">
                                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white"></span>
                                    BUSY
                                  </span>
                                </div>
                              )}
                              {!member.status && (
                                <div className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Not Set</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGroupId(null)}
                        className="w-full h-11 rounded-xl border-2 border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 mt-2"
                      >
                        Collapse
                      </Button>
                    </div>
                  ) : (
                    // Collapsed view
                    <Button
                      onClick={() => {
                        setSelectedGroupId(group.id)
                        loadGroupMembersWithStatus(group.id)
                      }}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                    >
                      View Members & Availability
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">No groups yet</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create your first group to get started!</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

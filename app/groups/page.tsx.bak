'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { ArrowLeft, Users, Search, Plus, Trash2, Crown, UserX, UserPlus } from 'lucide-react'

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
  ownerId: string // Owner/Admin UID
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
  
  // Add members states
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false)
  const [addMembersGroupId, setAddMembersGroupId] = useState<string | null>(null)
  const [addMembersSearch, setAddMembersSearch] = useState('')
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)

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
        ownerId: currentUserUid,
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

  const handleDeleteGroup = async (groupId: string, ownerId: string) => {
    if (currentUserUid !== ownerId) {
      toast.error('Only the group owner can delete this group')
      return
    }

    setDeleteGroupId(groupId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteGroup = async () => {
    if (!deleteGroupId) return

    try {
      await deleteDoc(doc(db, 'groups', deleteGroupId))
      toast.success('Group deleted successfully!')
      setGroups(groups.filter(g => g.id !== deleteGroupId))
      if (selectedGroupId === deleteGroupId) {
        setSelectedGroupId(null)
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group')
    } finally {
      setShowDeleteDialog(false)
      setDeleteGroupId(null)
    }
  }

  const handleLeaveGroup = async (groupId: string, ownerId: string) => {
    if (currentUserUid === ownerId) {
      toast.error('You are the owner. Delete the group instead of leaving it.')
      return
    }

    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      const groupRef = doc(db, 'groups', groupId)
      const groupDoc = await getDoc(groupRef)
      if (groupDoc.exists()) {
        const currentMembers = groupDoc.data().members || []
        const updatedMembers = currentMembers.filter((uid: string) => uid !== currentUserUid)
        
        await updateDoc(groupRef, {
          members: updatedMembers
        })
        
        toast.success('Left group successfully!')
        setGroups(groups.filter(g => g.id !== groupId))
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null)
        }
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Failed to leave group')
    }
  }

  const handleAddMembers = async () => {
    if (!addMembersGroupId || selectedNewMembers.length === 0) {
      toast.error('Please select at least one friend to add')
      return
    }

    setIsAddingMembers(true)
    try {
      const groupRef = doc(db, 'groups', addMembersGroupId)
      const groupDoc = await getDoc(groupRef)
      
      if (groupDoc.exists()) {
        const currentMembers = groupDoc.data().members || []
        const membersToAdd = selectedNewMembers.filter(uid => !currentMembers.includes(uid))
        
        if (membersToAdd.length === 0) {
          toast.error('Selected friends are already in the group')
          setIsAddingMembers(false)
          return
        }
        
        await updateDoc(groupRef, {
          members: [...currentMembers, ...membersToAdd]
        })
        
        toast.success(`Added ${membersToAdd.length} member${membersToAdd.length !== 1 ? 's' : ''} successfully!`)
        await loadGroups(currentUserUid)
        
        setShowAddMembersDialog(false)
        setAddMembersGroupId(null)
        setSelectedNewMembers([])
        setAddMembersSearch('')
      }
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Failed to add members')
    } finally {
      setIsAddingMembers(false)
    }
  }

  const getAvailableFriendsForGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return []
    
    return friends.filter(friend => !group.members.includes(friend.uid))
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
    <div className="min-h-screen bg-white dark:bg-black p-3 sm:p-4">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
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
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black dark:text-white">
                Groups
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Create groups and track everyone's availability
              </p>
            </div>
          </div>
        </div>

        {/* Create Group Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          {showCreateForm ? (
            <>
              <div className="bg-[#F63049] p-6">
                <h3 className="text-xl font-black text-white mb-1">Create New Group</h3>
                <p className="text-white/90 text-sm">Select friends to add to your group</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="font-semibold text-gray-700 dark:text-gray-300">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="e.g., CS Batch, Hostel Friends"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="h-12 rounded-xl border-gray-300 dark:border-gray-700 focus:border-[#F63049] dark:focus:border-[#F63049]"
                  />
                </div>

                {/* Search Friends */}
                <div className="space-y-2">
                  <Label className="font-semibold text-gray-700 dark:text-gray-300">Add Friends ({selectedFriends.length} selected)</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or UID..."
                      value={friendSearch}
                      onChange={e => setFriendSearch(e.target.value)}
                      className="pl-11 h-12 rounded-xl border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </div>

                {/* Friends List */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl max-h-64 overflow-y-auto">
                  {filteredFriends.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {filteredFriends.map(friend => (
                        <div
                          key={friend.uid}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F63049]/10 dark:hover:bg-[#F63049]/20 cursor-pointer transition-all duration-200"
                          onClick={() => toggleFriendSelection(friend.uid)}
                        >
                          <Checkbox
                            checked={selectedFriends.includes(friend.uid)}
                            onCheckedChange={() => toggleFriendSelection(friend.uid)}
                            className="data-[state=checked]:bg-[#F63049] border-2"
                          />
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-[#F63049] text-white font-bold text-sm">
                              {friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black dark:text-white">{friend.name}</p>
                            <p className="text-xs text-[#F63049] dark:text-[#F63049] font-medium">{friend.uid}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">👥</span>
                      </div>
                      <p className="text-sm font-semibold text-black dark:text-white mb-1">
                        {friends.length === 0 ? 'No friends yet' : 'No matching friends'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {friends.length === 0 ? 'Add friends first!' : 'Try a different search term'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCreateGroup}
                    disabled={isCreating || !newGroupName.trim() || selectedFriends.length === 0}
                    className="flex-1 h-12 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg transition-all duration-300"
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
                    className="flex-1 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#F63049] p-6">
                <h3 className="text-xl font-black text-white mb-1">Your Groups</h3>
                <p className="text-white/90 text-sm">Organize friends to track availability together</p>
              </div>
              <div className="p-6">
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  className="w-full h-12 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg transition-all duration-300"
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
              <div key={group.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="bg-[#F63049] p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-white" />
                        <h3 className="text-xl font-black text-white">{group.name}</h3>
                        {group.ownerId === currentUserUid && (
                          <div className="px-2 py-1 rounded-full bg-yellow-400/20 border border-yellow-300/30 flex items-center gap-1">
                            <Crown className="h-3 w-3 text-yellow-300" />
                            <span className="text-xs font-bold text-yellow-200">Owner</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white/90 text-sm">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {group.ownerId === currentUserUid ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id, group.ownerId)}
                        className="text-white hover:bg-white/20 rounded-xl"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeaveGroup(group.id, group.ownerId)}
                        className="text-white hover:bg-white/20 rounded-xl"
                        title="Leave Group"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {selectedGroupId === group.id ? (
                    // Expanded view with member status
                    <div className="space-y-3">
                      {loadingMembers ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 animate-pulse">
                            <Users className="h-6 w-6 text-[#F63049] dark:text-[#F63049]" />
                          </div>
                          <p className="text-sm font-semibold text-black dark:text-white">Loading member status...</p>
                        </div>
                      ) : (
                        <>
                          {groupMembers.map(member => (
                            <div
                              key={member.uid}
                              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-[#F63049] text-white font-bold text-lg">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-black dark:text-white">{member.name}</p>
                                    {member.uid === group.ownerId && (
                                      <div className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 flex items-center gap-1">
                                        <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Owner</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{member.uid}</p>
                                </div>
                              </div>
                              {member.status === 'FREE' && (
                                <div className="px-4 py-2 rounded-full bg-[#F63049] shadow-lg">
                                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                    FREE
                                  </span>
                                </div>
                              )}
                              {member.status === 'BUSY' && (
                                <div className="px-4 py-2 rounded-full bg-red-600 shadow-lg">
                                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white"></span>
                                    BUSY
                                  </span>
                                </div>
                              )}
                              {!member.status && (
                                <div className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Not Set</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      <div className="flex gap-3 mt-2">
                        {group.ownerId === currentUserUid && (
                          <Button
                            onClick={() => {
                              setAddMembersGroupId(group.id)
                              setShowAddMembersDialog(true)
                            }}
                            className="flex-1 h-11 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Members
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGroupId(null)}
                          className="flex-1 h-11 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Collapse
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Collapsed view
                    <Button
                      onClick={() => {
                        setSelectedGroupId(group.id)
                        loadGroupMembersWithStatus(group.id)
                      }}
                      className="w-full h-12 rounded-xl bg-[#F63049] hover:bg-[#F63049]/90 font-bold shadow-lg transition-all duration-300"
                    >
                      View Members & Availability
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F63049]/10 dark:bg-[#F63049]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-[#F63049] dark:text-[#F63049]" />
                </div>
                <p className="text-lg font-bold text-black dark:text-white mb-1">No groups yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create your first group to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
              All members will be removed and the group will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteGroupId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Members Dialog */}
      <AlertDialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Members to Group</AlertDialogTitle>
            <AlertDialogDescription>
              Select friends to add to this group
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {/* Search Friends */}
            <div className="relative">
              <Search className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or UID..."
                value={addMembersSearch}
                onChange={e => setAddMembersSearch(e.target.value)}
                className="pl-11 h-12 rounded-xl border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Available Friends List */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl max-h-80 overflow-y-auto">
              {(() => {
                const availableFriends = addMembersGroupId ? getAvailableFriendsForGroup(addMembersGroupId) : []
                const filteredAvailable = availableFriends.filter(friend =>
                  friend.uid.toLowerCase().includes(addMembersSearch.toLowerCase()) ||
                  friend.name.toLowerCase().includes(addMembersSearch.toLowerCase())
                )
                
                return filteredAvailable.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredAvailable.map(friend => (
                      <div
                        key={friend.uid}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#F63049]/10 dark:hover:bg-[#F63049]/20 cursor-pointer transition-all duration-200"
                        onClick={() => {
                          setSelectedNewMembers(prev =>
                            prev.includes(friend.uid)
                              ? prev.filter(id => id !== friend.uid)
                              : [...prev, friend.uid]
                          )
                        }}
                      >
                        <Checkbox
                          checked={selectedNewMembers.includes(friend.uid)}
                          onCheckedChange={() => {
                            setSelectedNewMembers(prev =>
                              prev.includes(friend.uid)
                                ? prev.filter(id => id !== friend.uid)
                                : [...prev, friend.uid]
                            )
                          }}
                          className="data-[state=checked]:bg-[#F63049] border-2"
                        />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#F63049] text-white font-bold text-sm">
                            {friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black dark:text-white">{friend.name}</p>
                          <p className="text-xs text-[#F63049] dark:text-[#F63049] font-medium">{friend.uid}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-black dark:text-white mb-1">
                      {availableFriends.length === 0 ? 'All friends are already members' : 'No matching friends'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {availableFriends.length === 0 ? 'Everyone is already in this group!' : 'Try a different search term'}
                    </p>
                  </div>
                )
              })()}
            </div>
            
            {selectedNewMembers.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNewMembers.length} friend{selectedNewMembers.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowAddMembersDialog(false)
                setAddMembersGroupId(null)
                setSelectedNewMembers([])
                setAddMembersSearch('')
              }}
              disabled={isAddingMembers}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddMembers}
              disabled={isAddingMembers || selectedNewMembers.length === 0}
              className="bg-[#F63049] hover:bg-[#F63049]/90 dark:bg-[#F63049] dark:hover:bg-[#F63049]/90"
            >
              {isAddingMembers ? 'Adding...' : `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

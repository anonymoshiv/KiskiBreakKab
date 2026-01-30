'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { toast } from 'sonner'
import { ArrowLeft, Users, Search, Plus, Trash2, Crown, UserX, UserPlus, Target, Shield, Clock, Activity } from 'lucide-react'

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

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
  ownerId: string
  members: string[] 
  createdAt: Date
}

export default function GroupsPage() {
  const router = useRouter()
  const [currentUserUid, setCurrentUserUid] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  
  // Create group states
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  // View group states
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  // Add members states
  const [addMembersGroupId, setAddMembersGroupId] = useState<string | null>(null)
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([])
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)

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
      const groupsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Group[]
      setGroups(groupsList)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Failed to load groups')
    }
  }

  const loadFriends = async (userUid: string) => {
    // Simplified friend loading from users collection logic or friend collection
    // Assuming friends are stored in users/{uid}/friends or we have a helper
    // For this context, I'll simulate fetching friends logic if missing or use basic query
    // In previous file: await loadFriends(userData.uid)
    try {
       const friendsRef = collection(db, 'users', userUid, 'friends')
       const snapshot = await getDocs(friendsRef)
       const friendsList = snapshot.docs.map(doc => doc.data() as Friend)
       setFriends(friendsList)
    } catch (e) {
       console.log("Error loading friends list", e)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Enter a squad name')
      return
    }
    if (selectedFriends.length === 0) {
      toast.error('Select at least one operative')
      return
    }

    setIsCreating(true)
    try {
      const groupMembers = [currentUserUid, ...selectedFriends]
      
      await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        createdBy: currentUserUid,
        ownerId: currentUserUid,
        members: groupMembers,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      toast.success('Squad mobilized')
      setNewGroupName('')
      setSelectedFriends([])
      await loadGroups(currentUserUid)
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    } finally {
      setIsCreating(false)
    }
  }

  const handleViewGroup = async (groupId: string) => {
    setSelectedGroupId(groupId)
    await loadGroupMembersWithStatus(groupId)
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
      
      let currentSlot: number | null = null

      // Skip calculation if weekend
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
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
        
        for (const slot of SLOTS) {
          const startMinutes = timeToMinutes(slot.start)
          const endMinutes = timeToMinutes(slot.end)
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            currentSlot = slot.slot_no
            break
          }
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
      toast.error('Failed to load squad intel')
    } finally {
      setLoadingMembers(false)
    }
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
               <Target className="h-8 w-8 sm:h-12 sm:w-12 text-[#F63049]" strokeWidth={2.5} />
               Squad<span className="text-black dark:text-white">Ops</span>
            </h1>
            <p className="font-mono text-sm font-bold opacity-60">
               COORDINATE TACTICAL UNITS AND GROUP ACTIVITIES.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left Panel: Create Group */}
           <div className="space-y-6">
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
                 <div className="bg-[#F63049] p-4 border-b-2 border-black dark:border-white text-white">
                    <h2 className="font-black uppercase tracking-widest flex items-center gap-2">
                       <Plus className="h-5 w-5" /> Mobilize Squad
                    </h2>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-2">
                       <Label className="font-black uppercase text-xs">Squad Designation</Label>
                       <Input 
                          placeholder="e.g. ALPHA TEAM"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="rounded-none border-2 border-black dark:border-white font-mono uppercase focus-visible:ring-0"
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="font-black uppercase text-xs">Select Operatives</Label>
                       <div className="max-h-[200px] overflow-y-auto border-2 border-black dark:border-white bg-gray-50 dark:bg-zinc-900 p-2 space-y-2">
                          {friends.length === 0 ? (
                             <p className="text-xs font-mono text-gray-500 text-center py-4">NO AGENTS AVAILABLE</p>
                          ) : (
                             friends.map(friend => (
                                <div key={friend.uid} className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-black border border-transparent hover:border-black dark:hover:border-white transition-all cursor-pointer" onClick={() => {
                                   if (selectedFriends.includes(friend.uid)) {
                                      setSelectedFriends(selectedFriends.filter(id => id !== friend.uid))
                                   } else {
                                      setSelectedFriends([...selectedFriends, friend.uid])
                                   }
                                }}>
                                   <div className={`w-4 h-4 border-2 border-black dark:border-white flex items-center justify-center ${selectedFriends.includes(friend.uid) ? 'bg-[#F63049]' : 'bg-white'}`}>
                                      {selectedFriends.includes(friend.uid) && <Check className="h-3 w-3 text-white" />}
                                   </div>
                                   <span className="font-bold uppercase text-xs">{friend.name}</span>
                                </div>
                             ))
                          )}
                       </div>
                    </div>

                    <Button 
                       onClick={handleCreateGroup}
                       disabled={isCreating}
                       className="w-full rounded-none bg-black text-white hover:bg-gray-800 border-2 border-transparent font-black uppercase tracking-widest py-6"
                    >
                       {isCreating ? 'INITIALIZING...' : 'CREATE SQUAD'}
                    </Button>
                 </div>
              </div>
           </div>

           {/* Right Panel: Active Groups */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white min-h-[400px]">
                 <div className="bg-black dark:bg-white p-4 border-b-2 border-black dark:border-white flex justify-between items-center">
                    <h2 className="text-white dark:text-black font-black uppercase tracking-widest text-lg">
                       Active Units
                    </h2>
                    <Shield className="h-5 w-5 text-white dark:text-black" />
                 </div>
                 
                 <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groups.length === 0 ? (
                       <div className="col-span-full text-center py-12 flex flex-col items-center opacity-50">
                          <Target className="h-16 w-16 mb-4" />
                          <p className="font-black uppercase text-xl">NO ACTIVE UNITS</p>
                          <p className="font-mono text-xs">Create a squad to begin operations.</p>
                       </div>
                    ) : (
                       groups.map(group => (
                          <div key={group.id} className="group relative bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                   <h3 className="font-black uppercase text-lg leading-tight">{group.name}</h3>
                                   <p className="font-mono text-[10px] text-gray-500">ID: {group.id.slice(0,6)}</p>
                                </div>
                                {group.ownerId === currentUserUid && (
                                   <Crown className="h-4 w-4 text-[#FEF08A] fill-black stroke-black" />
                                )}
                             </div>
                             
                             <div className="space-y-4">
                                <div className="text-xs font-bold uppercase border-l-2 border-black dark:border-white pl-2">
                                   Members: {group.members.length}
                                </div>
                                
                                <div className="pt-4 border-t-2 border-black dark:border-white border-dashed flex justify-between items-center">
                                   <div className="flex -space-x-2">
                                      {[1,2,3].map(i => (
                                         <div key={i} className="w-6 h-6 bg-gray-200 border border-black rounded-none"></div>
                                      ))}
                                   </div>
                                    <Button 
                                       onClick={() => handleViewGroup(group.id)}
                                       variant="ghost" 
                                       size="sm" 
                                       className="h-6 text-[10px] font-bold uppercase rounded-none hover:bg-black hover:text-white transition-colors"
                                    >
                                       View Intel &rarr;
                                    </Button>
                                </div>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>

        </div>
      </div>

      <Dialog open={!!selectedGroupId} onOpenChange={(open) => !open && setSelectedGroupId(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-black p-0 border-4 border-black dark:border-white rounded-none shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_#fff]">
          <DialogHeader className="p-4 border-b-2 border-black dark:border-white bg-[#8B5CF6] dark:bg-violet-900">
            <DialogTitle className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Squad Intel <span className="text-white/60 text-sm ml-auto font-mono">LIVE STATUS</span>
            </DialogTitle>
            <DialogDescription className="text-white/80 font-mono text-xs">
               Real-time availability of all squad operatives.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-0 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-zinc-900">
             {loadingMembers ? (
               <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="font-black uppercase tracking-widest text-sm">Decryption in progress...</p>
               </div>
             ) : (
               <div className="divide-y-2 divide-black dark:divide-white border-b-2 border-black dark:border-white">
                 {groupMembers.map(member => (
                   <div key={member.uid} className="p-4 flex items-center justify-between bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors group">
                      <div>
                         <p className="font-black uppercase text-sm group-hover:text-[#F63049] transition-colors">{member.name}</p>
                         <p className="font-mono text-[10px] text-gray-500">{member.uid}</p>
                         {member.uid === groups.find(g => g.id === selectedGroupId)?.ownerId && (
                           <span className="inline-block mt-1 text-[9px] font-bold bg-[#FEF08A] text-black px-1 border border-black">SQUAD LEADER</span>
                         )}
                      </div>
                      
                      {member.status === 'FREE' ? (
                         <div className="flex items-center gap-2 px-3 py-1 bg-[#4ADE80] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_#fff]">
                            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                            <span className="font-black uppercase text-xs text-black">FREE</span>
                         </div>
                      ) : member.status === 'BUSY' ? (
                         <div className="flex items-center gap-2 px-3 py-1 bg-[#F63049] border-2 border-black dark:border-white opacity-50">
                            <span className="font-black uppercase text-xs text-white">BUSY</span>
                         </div>
                      ) : (
                         <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-zinc-800 border-2 border-black dark:border-white border-dashed">
                             <span className="font-bold uppercase text-[10px] text-gray-500">OFFLINE</span>
                         </div>
                      )}
                   </div>
                 ))}
               </div>
             )}
          </div>
          
          <div className="p-4 bg-white dark:bg-black flex justify-between items-center gap-4">
             <div className="text-[10px] font-mono text-gray-500">
                <span className="font-bold text-black dark:text-white">{groupMembers.filter(m => m.status === 'FREE').length}</span> / {groupMembers.length} AGENTS ACTIVE
             </div>
             {groups.find(g => g.id === selectedGroupId)?.ownerId === currentUserUid && (
                <Button 
                   variant="destructive" 
                   size="sm"
                   className="rounded-none font-bold uppercase text-xs border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#F63049] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                   onClick={() => {
                      const groupName = groups.find(g => g.id === selectedGroupId)?.name
                      if(confirm(`Disband ${groupName}? This action cannot be undone.`)) {
                         if (selectedGroupId) {
                           deleteDoc(doc(db, 'groups', selectedGroupId))
                             .then(() => {
                               toast.success('Squad Disbanded')
                               setSelectedGroupId(null)
                               loadGroups(currentUserUid)
                             })
                             .catch(err => {
                               console.error(err)
                               toast.error('Failed to disband')
                             })
                         }
                      }
                   }}
                >
                   <Trash2 className="h-3 w-3 mr-1" /> Disband
                </Button>
             )}
          </div>

        </DialogContent>
      </Dialog>

    </div>
  )
}

function Check({ className }: { className?: string }) {
   return (
      <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
   )
}

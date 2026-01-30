'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageDialog } from '@/components/message-dialog'

interface Friend {
  id: string
  name: string
  uid: string
  email?: string
  status: 'FREE' | 'BUSY'
}

interface FreeFriendsListProps {
  friends?: Friend[]
  isLoading?: boolean
  currentUserUid?: string
  currentUserName?: string
}

export function FreeFriendsList({ friends, isLoading = false, currentUserUid, currentUserName }: FreeFriendsListProps) {
  const displayFriends = friends || []

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border-2 border-black dark:border-white p-1 h-full">
      <div className="bg-[#8B5CF6] dark:bg-[#7c3aed] p-3 border-b-2 border-black dark:border-white mb-1">
        <h3 className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
          <span>👥</span> Friends Free Now
        </h3>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-zinc-900 min-h-[200px]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-zinc-800 animate-pulse border-2 border-dashed border-gray-300 dark:border-zinc-700" />
            ))}
          </div>
        ) : displayFriends.length > 0 ? (
          <div className="space-y-3">
            {displayFriends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-3 bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-black dark:border-white rounded-none">
                      <AvatarFallback className="bg-[#FEF08A] dark:bg-yellow-900 text-black dark:text-white font-black text-xs rounded-none">
                        {friend.name.split(' ')[0][0]}
                        {friend.name.split(' ')[1]?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase text-black dark:text-white truncate max-w-[120px]">{friend.name}</p>
                    <p className="text-[10px] font-mono text-gray-500">{friend.uid}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentUserUid && currentUserName && (
                    <MessageDialog
                      friendName={friend.name}
                      friendUid={friend.uid}
                      currentUserUid={currentUserUid}
                      currentUserName={currentUserName}
                    />
                  )}
                  <div className="hidden sm:block px-2 py-1 bg-[#4ADE80] border-2 border-black dark:border-white text-black font-black text-[10px] uppercase tracking-wider">
                    FREE
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white dark:bg-black border-2 border-black dark:border-white flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff]">
              <span className="text-3xl text-gray-400">∅</span>
            </div>
            <p className="font-black uppercase text-black dark:text-white mb-1">No One is Free</p>
            <p className="text-xs font-mono text-gray-500">Everyone is busy attending classes.</p>
          </div>
        )}
      </div>
    </div>
  )
}

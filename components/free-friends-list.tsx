'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
}

export function FreeFriendsList({ friends, isLoading = false }: FreeFriendsListProps) {
  const displayFriends = friends || []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Friends Free Right Now</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayFriends.length > 0 ? (
          <div className="space-y-3">
            {displayFriends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-green-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-sm">
                        {friend.name.split(' ')[0][0]}
                        {friend.name.split(' ')[1]?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{friend.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{friend.uid}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-green-500 shadow-lg shadow-green-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-white font-bold text-xs">FREE</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😴</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No friends free right now</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Check back during the next break!</p>
          </div>
        )}
      </div>
    </div>
  )
}

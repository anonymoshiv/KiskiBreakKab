'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Message {
  id: string
  from: string
  fromName: string
  message: string
  timestamp: Timestamp
  read: boolean
}

interface MessagesInboxProps {
  userUid: string
  trigger?: React.ReactNode
}

export function MessagesInbox({ userUid, trigger }: MessagesInboxProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userUid) return

    // Listen to messages in real-time (without orderBy to avoid index requirement)
    const messagesQuery = query(
      collection(db, 'messages'),
      where('to', '==', userUid)
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = []
      let unread = 0

      snapshot.forEach((doc) => {
        const data = doc.data()
        msgs.push({
          id: doc.id,
          from: data.from,
          fromName: data.fromName,
          message: data.message,
          timestamp: data.timestamp,
          read: data.read || false,
        })
        if (!data.read) unread++
      })

      // Sort messages client-side by timestamp (newest first)
      msgs.sort((a, b) => {
        if (!a.timestamp) return 1
        if (!b.timestamp) return -1
        return b.timestamp.toMillis() - a.timestamp.toMillis()
      })

      setMessages(msgs)
      setUnreadCount(unread)
    })

    return () => unsubscribe()
  }, [userUid])

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'Just now'
    const date = timestamp.toDate()
    const diffMs = new Date().getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center justify-center p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
        >
          <MessageCircle className="h-6 w-6 text-black dark:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-3 -left-3 h-6 min-w-[1.5rem] px-1 bg-[#F63049] border-2 border-black dark:border-white flex items-center justify-center text-xs font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl bg-white dark:bg-black p-0 border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
          <DialogHeader className="p-4 border-b-2 border-black dark:border-white bg-[#8B5CF6] dark:bg-violet-900">
            <DialogTitle className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Inbox ({unreadCount})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-zinc-900">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group relative p-4 border-2 border-black dark:border-white transition-all ${
                    msg.read
                      ? 'bg-white dark:bg-zinc-900'
                      : 'bg-[#FEF08A] dark:bg-yellow-900/40' // Yellow tint for unread
                  }`}
                  onClick={() => !msg.read && handleMarkAsRead(msg.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8 border-2 border-black dark:border-white rounded-none">
                          <AvatarFallback className="bg-white dark:bg-black font-black text-black dark:text-white text-xs rounded-none">
                            {msg.fromName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold uppercase text-sm">{msg.fromName}</p>
                          <p className="font-mono text-[10px] text-gray-500">{formatTimestamp(msg.timestamp)}</p>
                        </div>
                        {!msg.read && (
                          <span className="bg-[#F63049] text-white text-[10px] font-black uppercase px-2 border border-black dark:border-white ml-auto">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs p-2 bg-white/50 dark:bg-black/50 border border-black dark:border-white border-dashed">
                       {msg.message}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMessage(msg.id)
                      }}
                      className="h-8 w-8 rounded-none border border-transparent hover:border-black dark:hover:border-white text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 border-2 border-black dark:border-white bg-white dark:bg-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff]">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-black uppercase text-lg">No New Messages</p>
                <p className="font-mono text-xs text-gray-500">Wait for friends to shout out.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
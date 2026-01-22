'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MessageCircle, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

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
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
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
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F63049] flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#F63049]">Messages</DialogTitle>
            <DialogDescription>
              {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-4">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    msg.read
                      ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
                      : 'bg-[#F63049]/5 dark:bg-[#F63049]/10 border-[#F63049]/30 dark:border-[#F63049]/40'
                  }`}
                  onClick={() => !msg.read && handleMarkAsRead(msg.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#F63049] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {msg.fromName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {msg.fromName}
                            {!msg.read && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F63049] text-white text-xs font-semibold">
                                New
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMessage(msg.id)
                      }}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No messages yet</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Messages from friends will appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

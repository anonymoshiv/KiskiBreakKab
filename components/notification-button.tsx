'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from './ui/button'
import { requestNotificationPermission, listenForMessages } from '@/lib/notifications'
import { toast } from 'sonner'

interface NotificationButtonProps {
  userUid: string
}

export function NotificationButton({ userUid }: NotificationButtonProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check current permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === 'granted')
      
      // Listen for foreground messages if permission is granted
      if (Notification.permission === 'granted') {
        listenForMessages((payload) => {
          toast.success(payload.notification?.title || 'New notification', {
            description: payload.notification?.body
          })
        })
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (!userUid) return
    
    const token = await requestNotificationPermission(userUid)
    
    if (token) {
      setNotificationsEnabled(true)
      setPermission('granted')
      toast.success('Notifications enabled!', {
        description: "You'll get alerts when friends are free"
      })
      
      // Start listening for messages
      listenForMessages((payload) => {
        toast.success(payload.notification?.title || 'New notification', {
          description: payload.notification?.body
        })
      })
    } else {
      toast.error('Could not enable notifications', {
        description: 'Please check your browser settings'
      })
    }
  }

  if (permission === 'denied') {
    return null // Don't show button if user denied
  }

  if (notificationsEnabled) {
    return (
      <div className="relative p-2 border-2 border-transparent">
        <Bell className="h-6 w-6 text-[#F63049]" strokeWidth={2.5} />
      </div>
    )
  }

  return (
    <button
      onClick={handleEnableNotifications}
      className="relative p-2 border-2 border-dashed border-gray-400 hover:border-[#F63049] rounded-none transition-all"
      title="Enable notifications"
    >
      <BellOff className="h-6 w-6 text-gray-400 hover:text-[#F63049]" strokeWidth={2.5} />
    </button>
  )
}

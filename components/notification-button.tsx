'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from './ui/button'
import { requestNotificationPermission, listenForMessages } from '@/lib/notifications'
import { toast } from 'sonner'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface NotificationButtonProps {
  userUid: string
}

export function NotificationButton({ userUid }: NotificationButtonProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    console.log('NotificationButton userUid:', userUid)
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
  }, [userUid])

  const handleEnableNotifications = async () => {
    console.log('handleEnableNotifications called, userUid:', userUid)
    
    if (!userUid) {
      toast.error('User not loaded yet', {
        description: 'Please wait a moment and try again'
      })
      return
    }
    
    // Check browser support
    if (!('Notification' in window)) {
      toast.error('Browser not supported', {
        description: 'Your browser does not support notifications'
      })
      return
    }

    const loadingToast = toast.loading('Requesting permission...')
    
    const token = await requestNotificationPermission(userUid)
    
    toast.dismiss(loadingToast)
    
    // Check the actual permission state after request
    const currentPermission = Notification.permission
    setPermission(currentPermission)
    
    if (token && currentPermission === 'granted') {
      setNotificationsEnabled(true)
      toast.success('Notifications enabled!', {
        description: "You'll get alerts when friends are free"
      })
      
      // Start listening for messages
      listenForMessages((payload) => {
        toast.success(payload.notification?.title || 'New notification', {
          description: payload.notification?.body
        })
      })
    } else if (currentPermission === 'denied') {
      toast.error('Notifications blocked', {
        description: 'Please allow notifications in your browser settings'
      })
    } else {
      toast.error('Could not enable notifications', {
        description: 'Permission was not granted'
      })
    }
  }

  const handleDisableNotifications = async () => {
    if (!userUid) return
    
    try {
      // Remove FCM token from Firestore
      await updateDoc(doc(db, 'users', userUid), {
        fcmToken: null,
        notificationsEnabled: false
      })
      
      setNotificationsEnabled(false)
      // Update permission state
      setPermission(Notification.permission)
      toast.info('Notifications disabled', {
        description: 'You can re-enable them anytime'
      })
    } catch (error) {
      console.error('Error disabling notifications:', error)
      toast.error('Failed to disable notifications')
    }
  }

  if (permission === 'denied') {
    return (
      <div className="relative p-2 border-2 border-transparent" title="Notifications blocked - check browser settings">
        <BellOff className="h-6 w-6 text-gray-400" strokeWidth={2.5} />
      </div>
    )
  }

  if (notificationsEnabled) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('DISABLE BELL CLICKED!')
          handleDisableNotifications()
        }}
        className="relative p-2 border-2 border-transparent hover:border-black dark:hover:border-white rounded-none transition-all cursor-pointer z-50"
        title="Click to disable notifications"
        style={{ pointerEvents: 'auto' }}
      >
        <Bell className="h-6 w-6 text-[#F63049]" strokeWidth={2.5} />
      </button>
    )
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('BELL CLICKED!')
        handleEnableNotifications()
      }}
      className="relative p-2 border-2 border-dashed border-gray-400 hover:border-[#F63049] rounded-none transition-all cursor-pointer z-50"
      title="Click to enable notifications"
      style={{ pointerEvents: 'auto' }}
    >
      <BellOff className="h-6 w-6 text-gray-400 hover:text-[#F63049]" strokeWidth={2.5} />
    </button>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { listenForMessages } from '@/lib/notifications'
import { toast } from 'sonner'

export function NotificationService() {
  const { user } = useAuth()
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false)
  const [userCustomUid, setUserCustomUid] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // Get the custom UID from Firestore users collection
    const loadUserData = async () => {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('firebaseUid', '==', user.uid))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          const userData = userDoc.data()
          const customUid = userData.uid
          setUserCustomUid(customUid)
          console.log('✅ Custom UID loaded:', customUid, 'Firebase UID:', user.uid)
          
          // Check notification preference
          const notifEnabled = userData.notificationsEnabled || false
          setIsNotificationsEnabled(notifEnabled)
          console.log('✅ Notification preference loaded:', notifEnabled)
        } else {
          console.error('❌ User document not found for Firebase UID:', user.uid)
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error)
      }
    }

    loadUserData()

    // Listen for foreground FCM messages globally
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      listenForMessages((payload) => {
        console.log('📬 FCM message received:', payload)
        toast.success(payload.notification?.title || 'New notification', {
          description: payload.notification?.body
        })
      })
    }
  }, [user])

  // Separate effect for friend request listener (depends on userCustomUid)
  useEffect(() => {
    if (!user || !userCustomUid) {
      console.log('⏳ Waiting for user and custom UID...', { user: !!user, userCustomUid })
      return
    }

    // Listen for friend requests using the custom UID
    const friendRequestsRef = collection(db, 'friendRequests')
    const q = query(
      friendRequestsRef,
      where('to', '==', userCustomUid),
      where('status', '==', 'pending')
    )

    console.log('🎧 Setting up friend request listener for custom UID:', userCustomUid)

    // Track if this is the first snapshot (initial load)
    let isFirstSnapshot = true

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📡 Friend requests snapshot received, changes:', snapshot.docChanges().length, 'total docs:', snapshot.size)
      
      // Skip notifications for the initial load (existing requests)
      if (isFirstSnapshot) {
        console.log('⏭️ Skipping initial snapshot (existing requests)')
        isFirstSnapshot = false
        return
      }
      
      snapshot.docChanges().forEach((change) => {
        console.log('🔄 Change type:', change.type, 'Doc data:', change.doc.data())
        
        if (change.type === 'added') {
          const request = change.doc.data()
          
          console.log('🔔 NEW friend request detected in REAL-TIME:', request)
          
          // Show toast notification (always show in-app)
          toast.info('New friend request!', {
            description: `${request.fromName} wants to be your friend`,
            duration: 5000
          })

          // Show browser notification if permission is granted
          if (typeof window !== 'undefined' && 'Notification' in window) {
            console.log('🔔 Notification permission:', Notification.permission)
            
            if (Notification.permission === 'granted') {
              console.log('✅ Showing browser notification')
              new Notification('New Friend Request!', {
                body: `${request.fromName} wants to be your friend`,
                icon: '/icon-192.svg',
                badge: '/icon-192.svg',
                tag: 'friend-request',
                vibrate: [200, 100, 200],
                requireInteraction: true
              })
            } else {
              console.log('❌ Browser notification not shown. Permission:', Notification.permission)
            }
          }
        }
      })
    }, (error) => {
      console.error('❌ Friend request listener error:', error)
    })

    console.log('✅ Friend request listener is active and running')

    return () => {
      console.log('🛑 Unsubscribing from friend request listener')
      unsubscribe()
    }
  }, [user, userCustomUid])

  return null // This component doesn't render anything
}

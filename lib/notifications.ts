'use client'

import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

// Request notification permission and get FCM token
export async function requestNotificationPermission(userUid: string) {
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      // Dynamically import messaging to avoid SSR issues
      const { getMessaging } = await import('firebase/messaging')
      const messaging = getMessaging()
      
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })
      
      if (token) {
        // Store token in Firestore
        await updateDoc(doc(db, 'users', userUid), {
          fcmToken: token,
          notificationsEnabled: true
        })
        
        return token
      }
    } else {
      console.log('Notification permission denied')
      return null
    }
  } catch (error) {
    console.error('Error getting notification permission:', error)
    return null
  }
}

// Listen for foreground messages
export async function listenForMessages(callback: (payload: any) => void) {
  try {
    const { getMessaging } = await import('firebase/messaging')
    const messaging = getMessaging()
    
    onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload)
      callback(payload)
      
      // Show notification
      if (payload.notification) {
        new Notification(payload.notification.title || 'KiskiBreakKab', {
          body: payload.notification.body,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: payload.data?.type || 'default'
        })
      }
    })
  } catch (error) {
    console.error('Error listening for messages:', error)
  }
}

// Send notification (this would typically be called from a backend/cloud function)
export async function sendNotification(
  recipientUid: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // This is a placeholder - actual implementation would be in a Cloud Function
  // For now, we'll just create a notification document in Firestore
  // A Cloud Function would listen to this and send the actual push notification
  
  try {
    await setDoc(doc(db, 'notifications', `${Date.now()}_${recipientUid}`), {
      to: recipientUid,
      title,
      body,
      data: data || {},
      createdAt: new Date().toISOString(),
      sent: false
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

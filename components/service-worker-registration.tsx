'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for service worker updates
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker is ready')
        
        // Check for updates periodically (every 60 seconds)
        setInterval(() => {
          registration.update()
        }, 60000)
      })
    }
  }, [])

  return null
}

// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBEMCjcGso_k-Sav0aiBZTFrnDjgtftdos",
  authDomain: "kiskibreakkab.firebaseapp.com",
  projectId: "kiskibreakkab",
  storageBucket: "kiskibreakkab.firebasestorage.app",
  messagingSenderId: "21007194148",
  appId: "1:21007194148:web:5149c70e8b2f802b7c20b1"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'KiskiBreakKab';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: payload.data?.type || 'default',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

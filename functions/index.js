const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Send notification when friend request is created
exports.sendFriendRequestNotification = functions.firestore
  .document('friendRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const request = snap.data();
    const recipientUid = request.to;
    
    try {
      // Get recipient's FCM token
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(recipientUid)
        .get();
      
      if (!userDoc.exists) {
        console.log('User not found:', recipientUid);
        return null;
      }
      
      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;
      
      if (!fcmToken) {
        console.log('No FCM token for user:', recipientUid);
        return null;
      }
      
      // Send notification
      const message = {
        notification: {
          title: 'New Friend Request',
          body: `${request.from} sent you a friend request`,
        },
        data: {
          type: 'friend_request',
          requestId: context.params.requestId,
          from: request.from
        },
        token: fcmToken
      };
      
      const response = await admin.messaging().send(message);
      console.log('Successfully sent notification:', response);
      return response;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// Send notification when friend becomes free
exports.sendFriendFreeNotification = functions.firestore
  .document('timetables/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const newSchedule = change.after.data().schedule;
    const oldSchedule = change.before.data().schedule;
    
    // Check if user just became free (changed from BUSY to FREE)
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentSlot = getCurrentSlot(now);
    
    if (!currentSlot) return null;
    
    const wasBusy = oldSchedule?.[day]?.[currentSlot] === 'BUSY';
    const isFree = newSchedule?.[day]?.[currentSlot] === 'FREE';
    
    if (wasBusy && isFree) {
      // User became free, notify their friends
      try {
        const friendsSnapshot = await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('friends')
          .get();
        
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(userId)
          .get();
        const userName = userDoc.data()?.name || 'Your friend';
        
        // Send notification to each friend
        const notifications = friendsSnapshot.docs.map(async (friendDoc) => {
          const friendUid = friendDoc.id;
          
          const friendUserDoc = await admin.firestore()
            .collection('users')
            .doc(friendUid)
            .get();
          
          const fcmToken = friendUserDoc.data()?.fcmToken;
          
          if (!fcmToken) return null;
          
          const message = {
            notification: {
              title: `${userName} is Free Now!`,
              body: `${userName} is free during slot ${currentSlot}. Catch up!`,
            },
            data: {
              type: 'friend_free',
              friendUid: userId,
              slot: currentSlot.toString()
            },
            token: fcmToken
          };
          
          return admin.messaging().send(message);
        });
        
        await Promise.all(notifications);
        console.log('Sent free notifications for user:', userId);
        
      } catch (error) {
        console.error('Error sending free notifications:', error);
      }
    }
    
    return null;
  });

// Helper function to get current slot
function getCurrentSlot(now) {
  const SLOTS = [
    { slot_no: 1, start: '09:30', end: '10:20' },
    { slot_no: 2, start: '10:20', end: '11:10' },
    { slot_no: 3, start: '11:20', end: '12:10' },
    { slot_no: 4, start: '12:10', end: '13:00' },
    { slot_no: 5, start: '13:05', end: '13:55' },
    { slot_no: 6, start: '13:55', end: '14:45' },
    { slot_no: 7, start: '14:45', end: '15:35' },
    { slot_no: 8, start: '15:35', end: '16:25' },
  ];
  
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const currentMinutes = timeToMinutes(currentTime);
  
  for (const slot of SLOTS) {
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return slot.slot_no;
    }
  }
  
  return null;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

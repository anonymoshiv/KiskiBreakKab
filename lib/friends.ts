import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'

export interface FriendRequest {
  id: string
  from: string // UID of sender
  fromName: string
  fromEmail: string
  to: string // UID of receiver
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: any
}

export interface Friend {
  uid: string
  name: string
  email: string
  addedAt: any
}

// Send friend request
export async function sendFriendRequest(fromUid: string, toUid: string) {
  try {
    // Check if user exists
    const toUserDoc = await getDoc(doc(db, 'users', toUid))
    if (!toUserDoc.exists()) {
      throw new Error('User not found with this UID')
    }

    // Check if already friends
    const friendDoc = await getDoc(doc(db, 'users', fromUid, 'friends', toUid))
    if (friendDoc.exists()) {
      throw new Error('Already friends with this user')
    }

    // Check if request already exists
    const existingRequest = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('from', '==', fromUid),
        where('to', '==', toUid),
        where('status', '==', 'pending')
      )
    )

    if (!existingRequest.empty) {
      throw new Error('Friend request already sent')
    }

    // Get sender's info
    const fromUserDoc = await getDoc(doc(db, 'users', fromUid))
    const fromUserData = fromUserDoc.data()

    // Create friend request
    const requestRef = doc(collection(db, 'friendRequests'))
    await setDoc(requestRef, {
      from: fromUid,
      fromName: fromUserData?.name || 'Unknown',
      fromEmail: fromUserData?.email || '',
      to: toUid,
      status: 'pending',
      createdAt: serverTimestamp()
    })

    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send friend request')
  }
}

// Accept friend request
export async function acceptFriendRequest(requestId: string, currentUserUid: string) {
  try {
    const batch = writeBatch(db)

    // Get request details
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId))
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found')
    }

    const requestData = requestDoc.data()
    
    // Get both users' data
    const fromUserDoc = await getDoc(doc(db, 'users', requestData.from))
    const toUserDoc = await getDoc(doc(db, 'users', requestData.to))
    
    const fromUserData = fromUserDoc.data()
    const toUserData = toUserDoc.data()

    // Add to both users' friends subcollection
    batch.set(doc(db, 'users', requestData.from, 'friends', requestData.to), {
      uid: requestData.to,
      name: toUserData?.name || 'Unknown',
      email: toUserData?.email || '',
      addedAt: serverTimestamp()
    })

    batch.set(doc(db, 'users', requestData.to, 'friends', requestData.from), {
      uid: requestData.from,
      name: fromUserData?.name || 'Unknown',
      email: fromUserData?.email || '',
      addedAt: serverTimestamp()
    })

    // Delete the request
    batch.delete(doc(db, 'friendRequests', requestId))

    await batch.commit()
    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to accept friend request')
  }
}

// Reject friend request
export async function rejectFriendRequest(requestId: string) {
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId))
    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reject friend request')
  }
}

// Get user's friends
export async function getFriends(uid: string): Promise<Friend[]> {
  try {
    const friendsSnapshot = await getDocs(collection(db, 'users', uid, 'friends'))
    return friendsSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as Friend))
  } catch (error) {
    console.error('Error getting friends:', error)
    return []
  }
}

// Get pending friend requests (received)
export async function getPendingRequests(uid: string): Promise<FriendRequest[]> {
  try {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('to', '==', uid),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(requestsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest))
  } catch (error) {
    console.error('Error getting pending requests:', error)
    return []
  }
}

// Get sent friend requests
export async function getSentRequests(uid: string): Promise<FriendRequest[]> {
  try {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', uid),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(requestsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest))
  } catch (error) {
    console.error('Error getting sent requests:', error)
    return []
  }
}

// Remove friend
export async function removeFriend(userUid: string, friendUid: string) {
  try {
    const batch = writeBatch(db)

    // Remove from both users' friends subcollection
    batch.delete(doc(db, 'users', userUid, 'friends', friendUid))
    batch.delete(doc(db, 'users', friendUid, 'friends', userUid))

    await batch.commit()
    return { success: true }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove friend')
  }
}

// Check if users are friends
export async function areFriends(uid1: string, uid2: string): Promise<boolean> {
  try {
    const friendDoc = await getDoc(doc(db, 'users', uid1, 'friends', uid2))
    return friendDoc.exists()
  } catch (error) {
    return false
  }
}

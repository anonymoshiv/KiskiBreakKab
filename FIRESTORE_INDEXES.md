# Firestore Index Configuration

If you encounter errors about missing indexes when using the messaging feature, you'll need to add the following composite index to Firebase:

## Required Index for Messages Collection

Collection: `messages`

Fields to index:
1. `to` (Ascending)
2. `timestamp` (Descending)

## How to Add the Index:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index" or click the link in the error message that appears in the browser console
3. Set Collection ID: `messages`
4. Add fields:
   - Field path: `to`, Order: Ascending
   - Field path: `timestamp`, Order: Descending
5. Click "Create Index" and wait for it to build (usually takes a few minutes)

Alternatively, you can click on the auto-generated link in the Firebase error message which will pre-fill the index configuration for you.

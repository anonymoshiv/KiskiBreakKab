# Setting up Push Notifications

## Step 1: Get VAPID Key from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kiskibreakkab**
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Scroll down to **Web Push certificates**
5. Click **Generate key pair** (if you don't have one)
6. Copy the **Key pair** value

## Step 2: Add VAPID Key to .env.local

Add this line to your `.env.local` file:
```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

## Step 3: Enable Firebase Cloud Messaging API

1. In Firebase Console, go to **Cloud Messaging** tab
2. Make sure **Firebase Cloud Messaging API** is enabled
3. If not, click the 3-dot menu and enable it

## How it works:

Once set up, users will see a bell icon with a slash in the dashboard. When they click it:
- Browser will ask for notification permission
- If granted, they'll get notifications for:
  - Friend requests
  - Friends becoming free
  - Group invitations

## Testing:

After adding the VAPID key:
1. Restart your dev server: `pnpm dev`
2. Open the dashboard
3. Click the bell icon
4. Grant permission
5. The bell should turn solid red

Notifications will show when:
- Someone sends you a friend request
- A friend becomes free (we'll implement this logic)
- Someone creates a group and adds you

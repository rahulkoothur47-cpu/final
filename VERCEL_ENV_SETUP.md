# Vercel Environment Variables Setup

## Required Environment Variables

Add these in your Vercel Dashboard → Project Settings → Environment Variables:

### 1. NEXT_PUBLIC_FIREBASE_API_KEY
```
AIzaSyANkSy9yGcORlDYCLIQ9nW1RWNXbp3sqXM
```

### 2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```
bus-tracker-5ef06.firebaseapp.com
```

### 3. NEXT_PUBLIC_FIREBASE_DATABASE_URL
```
https://bus-tracker-5ef06-default-rtdb.asia-southeast1.firebasedatabase.app
```

### 4. NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
bus-tracker-5ef06
```

### 5. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```
bus-tracker-5ef06.firebasestorage.app
```

### 6. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
```
656816196934
```

### 7. NEXT_PUBLIC_FIREBASE_APP_ID
```
1:656816196934:web:06bcaf2226cd8664b2a947
```

## How to Add in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar
5. For each variable above:
   - Paste the variable NAME (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Paste the VALUE (e.g., `AIzaSy...`)
   - Select all environments: Production, Preview, Development
   - Click "Save"
6. After adding all variables, go to "Deployments" tab
7. Click on the latest deployment → Click "..." → "Redeploy"

## Important Notes

- Copy values exactly as shown (no quotes needed in Vercel dashboard)
- Apply to all 3 environments (Production, Preview, Development)
- After adding variables, you MUST redeploy for them to take effect
- These are public Firebase config values (safe to expose on client-side)

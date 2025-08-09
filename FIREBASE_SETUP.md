# Firebase Setup Guide

## Current Issues
The application is experiencing Firebase connection issues. This guide will help resolve them.

## Steps to Fix Firebase Issues

### 1. Firebase Security Rules
The main issue is likely that Firebase security rules are blocking read/write access. You need to update your Firebase security rules in the Firebase Console.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wathiq-9761e`
3. Go to Firestore Database → Rules
4. Replace the current rules with the following (for testing purposes):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all collections for testing
    // In production, you should implement proper authentication and authorization
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click "Publish" to save the rules

### 2. Enable Firestore Database
Make sure Firestore Database is enabled in your Firebase project:

1. Go to Firestore Database in Firebase Console
2. If not already created, click "Create Database"
3. Choose "Start in test mode" for now
4. Select a location (choose the closest to your users)

### 3. Test the Connection
After updating the security rules:

1. Open the application
2. Log in as an admin user
3. Go to the Admin Dashboard
4. Use the "Firebase Debug" panel to test the connection
5. Check the browser console for any error messages

### 4. Common Error Messages and Solutions

#### "Missing or insufficient permissions"
- **Solution**: Update Firebase security rules as shown above

#### "Firebase App named '[DEFAULT]' already exists"
- **Solution**: This is usually not a problem, just a warning

#### "Network error" or "Failed to fetch"
- **Solution**: Check your internet connection and Firebase project status

#### "Permission denied"
- **Solution**: Make sure you're logged in and the user has the correct role

### 5. Production Security Rules
For production, replace the test rules with proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usage reports - users can create, admins can read all
    match /usageReports/{reportId} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Tool requests - users can create, admins can read all
    match /toolRequests/{requestId} {
      allow create: if request.auth != null;
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Tools - everyone can read approved tools, admins can write
    match /tools/{toolId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Policies - everyone can read, admins can write
    match /policies/{policyId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 6. Debugging
If issues persist:

1. Check the browser console for detailed error messages
2. Use the Debug Panel in the Admin Dashboard
3. Verify Firebase configuration in `client/firebase/firebase.ts`
4. Ensure all required Firebase services are enabled

### 7. Testing Checklist
- [ ] Firebase security rules updated
- [ ] Firestore Database enabled
- [ ] User authentication working
- [ ] Debug panel shows successful connection
- [ ] Can create/read reports
- [ ] Can create/read tool requests
- [ ] Can manage tools (admin only)
- [ ] No console errors 
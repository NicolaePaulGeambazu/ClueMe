# Firebase Security Rules for ClearCue - Family Sharing Enabled

## Updated Security Rules (Recommended for Family Features)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reminders - allow users to read their own reminders and family-assigned reminders
    match /reminders/{reminderId} {
      allow read: if request.auth != null && (
        // User's own reminders
        resource.data.userId == request.auth.uid ||
        // Reminders assigned to this user
        (resource.data.assignedTo != null && request.auth.uid in resource.data.assignedTo) ||
        // Family reminders that are shared
        (resource.data.sharedWithFamily == true && resource.data.familyId != null)
      );
      
      allow write: if request.auth != null && (
        // User can write their own reminders
        resource.data.userId == request.auth.uid ||
        // User can write reminders assigned to them
        (resource.data.assignedTo != null && request.auth.uid in resource.data.assignedTo) ||
        // User can create new reminders
        resource == null
      );
    }
    
    // Users can read and write their own countdowns
    match /countdowns/{countdownId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
    
    // Task types - users can read all, but only create/update/delete their own
    match /taskTypes/{taskTypeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.createdBy == request.auth.uid);
    }
    
    // Family collections - allow authenticated users to create and manage families
    match /families/{familyId} {
      allow read, write: if request.auth != null;
    }
    
    // Family members - allow authenticated users to read/write (simplified for development)
    match /familyMembers/{memberId} {
      allow read, write: if request.auth != null;
    }
    
    // Family activities - allow authenticated users to read/write (simplified for development)
    match /familyActivities/{activityId} {
      allow read, write: if request.auth != null;
    }
    
    // Family invitations - allow authenticated users to send and manage invitations
    match /familyInvitations/{invitationId} {
      allow read, write: if request.auth != null;
    }
    
    // Lists - allow authenticated users to create and manage lists
    match /lists/{listId} {
      allow read, write: if request.auth != null;
    }
    
    // Deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Simple Development Rules (Fallback - Allows All Authenticated Access)

If you're still having issues, use this simpler version for development:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read/write all documents
    // This is for development only - NOT for production!
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to Apply These Rules

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Go to Firestore Database** → **Rules** tab
4. **Replace the existing rules** with the updated rules above
5. **Click "Publish"**

## Key Changes Made

### Reminders Collection Rules:
- **Read Access:** Users can read:
  - Their own reminders (`resource.data.userId == request.auth.uid`)
  - Reminders assigned to them (`request.auth.uid in resource.data.assignedTo`)
  - Family reminders that are shared (`resource.data.sharedWithFamily == true`)
- **Write Access:** Users can write:
  - Their own reminders
  - Reminders assigned to them
  - Create new reminders

### Why This Fixes the Permission Errors:
1. **Array Contains Queries:** Now supports `assignedTo` array queries
2. **Family Sharing:** Allows reading shared family reminders
3. **Flexible Permissions:** Supports the complex family sharing scenarios

## Testing the Rules

After updating the rules, test with these scenarios:

1. **User's Own Reminders:** Should work ✅
2. **Assigned Reminders:** Should work ✅
3. **Family Shared Reminders:** Should work ✅
4. **Family Member Queries:** Should work ✅

## Production Rules (Use Later)

Once everything is working, you can switch to these more secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reminders with proper family permissions
    match /reminders/{reminderId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        (resource.data.assignedTo != null && request.auth.uid in resource.data.assignedTo) ||
        (resource.data.sharedWithFamily == true && 
         exists(/databases/$(database)/documents/familyMembers/$(request.auth.uid + '_' + resource.data.familyId)))
      );
      
      allow write: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        (resource.data.assignedTo != null && request.auth.uid in resource.data.assignedTo) ||
        resource == null
      );
    }
    
    // Family collections with proper membership checks
    match /families/{familyId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/familyMembers/$(request.auth.uid + '_' + familyId));
      allow write: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Family members with proper checks
    match /familyMembers/{memberId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.createdBy == request.auth.uid);
    }
    
    // Deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

**Note:** The updated rules should resolve the permission denied errors you're seeing in the logs. The key change is allowing users to read reminders that are assigned to them or shared with their family. 
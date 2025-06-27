# Firebase Security Rules for ClearCue - Development Version

## Enhanced Development Rules (Recommended - Proper Security + Development Friendly)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own reminders
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
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

If you're still having issues, use this simpler version:

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
    
    // Users can read and write their own reminders
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Users can read and write their own countdowns
    match /countdowns/{countdownId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Task types - users can read all, but only create/update/delete their own
    match /taskTypes/{taskTypeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Family collections - family owners have full access, members have read access
    match /families/{familyId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/familyMembers/{memberId}) &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.userId == request.auth.uid &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.familyId == familyId;
      allow write: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Family members - users can read/write if they are a member of that family
    match /familyMembers/{memberId} {
      allow read: if request.auth != null && 
        resource.data.familyId == familyId &&
        exists(/databases/$(database)/documents/familyMembers/{memberId}) &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.createdBy == request.auth.uid);
    }
    
    // Family activities - users can read/write if they are a member of that family
    match /familyActivities/{activityId} {
      allow read: if request.auth != null && 
        resource.data.familyId == familyId &&
        exists(/databases/$(database)/documents/familyMembers/{memberId}) &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        resource.data.memberId == request.auth.uid;
    }
    
    // Lists - users can read and write their own lists, and read shared family lists
    match /lists/{listId} {
      allow read: if request.auth != null &&
        (
          resource.data.createdBy == request.auth.uid ||
          (
            resource.data.isPrivate != true &&
            resource.data.familyId != null &&
            exists(/databases/$(database)/documents/familyMembers/$(request.auth.uid + '_' + resource.data.familyId)) &&
            get(/databases/$(database)/documents/familyMembers/$(request.auth.uid + '_' + resource.data.familyId)).data.userId == request.auth.uid
          )
        );
      allow write: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
    
    // Deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Apply These Rules

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Go to Firestore Database** → **Rules** tab
4. **Replace the existing rules** with the enhanced development rules above
5. **Click "Publish"**

## Why These Rules Work

- ✅ **Proper Security**: Each collection has specific rules
- ✅ **Development Friendly**: Allows all authenticated users to access family and list features
- ✅ **User Isolation**: Users can only access their own reminders and countdowns
- ✅ **Family Sharing**: Allows family creation and management
- ✅ **Family Membership**: Users can access their current family regardless of ownership
- ✅ **List Management**: Allows list creation and sharing within families
- ✅ **Task Type Sharing**: Users can read all task types but only modify their own

## Automatic Family Creation

The app now automatically creates a family for new users with the following features:

- **Default Family Name**: "{UserName}'s Family"
- **Owner**: The authenticated user
- **Settings**: All family features enabled by default
- **Initial Activity**: Records the family creation
- **Member Count**: Starts at 1 (the owner)

## Manual Task Types Addition

If you want to manually add task types to Firebase, here's the structure:

### Task Type Document Structure

```json
{
  "name": "task",
  "label": "Task", 
  "color": "#3B82F6",
  "icon": "CheckSquare",
  "description": "General tasks and to-dos",
  "isDefault": true,
  "isActive": true,
  "sortOrder": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": "YOUR_USER_ID"
}
```

### Default Task Types to Add

1. **Task**
   ```json
   {
     "name": "task",
     "label": "Task",
     "color": "#3B82F6", 
     "icon": "CheckSquare",
     "description": "General tasks and to-dos",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 1,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

2. **Bill**
   ```json
   {
     "name": "bill",
     "label": "Bill",
     "color": "#EF4444",
     "icon": "CreditCard",
     "description": "Bills and payments",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 2,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

3. **Medication**
   ```json
   {
     "name": "med",
     "label": "Medication",
     "color": "#10B981",
     "icon": "Pill",
     "description": "Medication reminders",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 3,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

4. **Event**
   ```json
   {
     "name": "event",
     "label": "Event",
     "color": "#8B5CF6",
     "icon": "Calendar",
     "description": "Events and appointments",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 4,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

5. **Note**
   ```json
   {
     "name": "note",
     "label": "Note",
     "color": "#F59E0B",
     "icon": "FileText",
     "description": "Notes and memos",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 5,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

## Quick Fix for Permission Issues

If you're getting permission errors, use this **simple development rule**:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read and write to any collection. **Use this for development only!** 
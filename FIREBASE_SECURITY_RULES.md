# Firebase Security Rules for ClearCue - Development Version

## Simple Development Rules (Allows All Authenticated Access)

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

## Enhanced Development Rules (With Family Creation Support)

If you want more specific rules while still being development-friendly:

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
    
    match /familyMembers/{memberId} {
      allow read, write: if request.auth != null;
    }
    
    match /familyActivities/{activityId} {
      allow read, write: if request.auth != null;
    }
    
    // Family invitations - allow authenticated users to send and manage invitations
    match /familyInvitations/{invitationId} {
      allow read, write: if request.auth != null;
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
4. **Replace the existing rules** with one of the above code blocks
5. **Click "Publish"**

## Why This Works

- ✅ **No Complex Logic**: Simple rule that allows all authenticated users
- ✅ **Immediate Access**: No permission errors for any collection
- ✅ **Easy Testing**: You can test all features without rule issues
- ✅ **Development Friendly**: Perfect for development and testing
- ✅ **Family Creation**: Allows users to create families automatically
- ✅ **Owner Management**: Supports family ownership and member management

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
    
    match /familyMembers/{memberId} {
      allow read: if request.auth != null && 
        resource.data.familyId == familyId &&
        exists(/databases/$(database)/documents/familyMembers/{memberId}) &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.createdBy == request.auth.uid);
    }
    
    match /familyActivities/{activityId} {
      allow read: if request.auth != null && 
        resource.data.familyId == familyId &&
        exists(/databases/$(database)/documents/familyMembers/{memberId}) &&
        get(/databases/$(database)/documents/familyMembers/{memberId}).data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        resource.data.memberId == request.auth.uid;
    }
    
    // Deny all other operations
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

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
     "description": "Bills and payments due",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 2,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

3. **Medicine**
   ```json
   {
     "name": "med",
     "label": "Medicine",
     "color": "#10B981",
     "icon": "Pill",
     "description": "Medications and health reminders", 
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
     "description": "Meetings and appointments",
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
     "description": "Important notes and ideas",
     "isDefault": true,
     "isActive": true,
     "sortOrder": 5,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z",
     "createdBy": "YOUR_USER_ID"
   }
   ```

## How to Manually Add Task Types

1. **Get your User ID**: 
   - Sign in to your app
   - Check the console logs for your Firebase user ID
   - Or go to Firebase Console → Authentication → Users

2. **Go to Firestore Console**:
   - Firebase Console → Firestore Database → Data tab
   - Create a new collection called `taskTypes`
   - Add each task type as a document with the structure above
   - Replace `YOUR_USER_ID` with your actual Firebase user ID

## Testing the Family Creation

1. **Sign in to your app**
2. **Navigate to the Family tab**
3. **The app should automatically create a family if none exists**
4. **You should see yourself as the owner**
5. **Check the console logs for family creation messages**

## Troubleshooting

If you encounter permission errors:

1. **Check Firebase Rules**: Make sure you've applied the development rules
2. **Verify Authentication**: Ensure the user is properly authenticated
3. **Check Console Logs**: Look for Firebase error messages
4. **Test with Simple Rules**: Use the most permissive rules for development

The automatic family creation should work seamlessly with the current development rules! 
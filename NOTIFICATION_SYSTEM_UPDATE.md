# Notification System Update - Cloud Functions for Assigned Users

## Overview
Updated the notification system to use Cloud Functions for **all priority levels** but **only for assigned users**, while keeping creator notifications client-side. This provides the best balance of reliability and cost efficiency.

## System Architecture

### Creator Notifications (Client-Side)
- **All priority levels**: Low, Medium, High
- **All timing types**: Exact, 15min, 30min, 1hour, 1day
- **Recurring reminders**: Handled client-side
- **Reasoning**: Creator is using the app anyway, so client-side notifications are sufficient

### Assigned User Notifications (Cloud Functions)
- **All priority levels**: Low, Medium, High
- **All timing types**: Exact, 15min, 30min, 1hour, 1day
- **Cross-device delivery**: Reliable delivery even when app is closed
- **Reasoning**: Assigned users may not have the app open, need reliable delivery

## Implementation Details

### Client-Side Changes (`src/services/notificationService.ts`)

#### New Method: `scheduleAssignedUserCloudNotifications`
```typescript
private async scheduleAssignedUserCloudNotifications(
  reminder: ReminderData, 
  notificationTimings: NotificationTiming[]
): Promise<void>
```

**Features:**
- Filters out the creator from assigned users
- Creates scheduled notifications for each assigned user
- Includes `isAssignedUser: true` flag for Cloud Functions
- Includes `assignedBy` field for context
- Handles all priority levels

#### Updated Scheduling Logic
```typescript
// Schedule notifications for the reminder creator (always client-side)
if (reminder.recurring) {
  await this.scheduleRecurringReminderNotifications(reminder, notificationTimings);
} else {
  notificationTimings.forEach((timing: NotificationTiming) => {
    this.scheduleLocalNotification(reminder, timing);
  });
}

// Schedule Cloud Function notifications for assigned users (all priority levels)
if (reminder.assignedTo && reminder.assignedTo.length > 0) {
  await this.scheduleAssignedUserCloudNotifications(reminder, notificationTimings);
}
```

### Cloud Functions Changes (`functions/index.js`)

#### Updated Priority Logic
```javascript
// Process all priority levels for assigned users, but only high priority for creators
const isAssignedUser = scheduledNotification.isAssignedUser || false;

if (!isAssignedUser && priority !== 'high') {
  console.log(`Skipping ${priority} priority notification for creator - should be handled client-side`);
  await snap.ref.update({
    status: 'skipped',
    reason: 'Low priority creator notification - handled client-side',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return;
}
```

#### Enhanced Context for Assigned Users
```javascript
// Get assigned by user info for assigned user notifications
let assignedByUser = null;
if (scheduledNotification.isAssignedUser && scheduledNotification.assignedBy) {
  try {
    const assignedByDoc = await admin.firestore().collection('users').doc(scheduledNotification.assignedBy).get();
    if (assignedByDoc.exists) {
      assignedByUser = assignedByDoc.data();
    }
  } catch (error) {
    console.log(`Could not fetch assigned by user: ${error.message}`);
  }
}

// Create translated notification message based on type
const notificationParams = {
  title: reminder.title,
  description: reminder.description || '',
  assignedBy: assignedByUser?.displayName || 'Someone'
};
```

### Internationalization Updates

#### Translation Files Updated
- **English**: `functions/translations/en.json`
- **Spanish**: `functions/translations/es.json`
- **French**: `functions/translations/fr.json`

#### Enhanced i18n Logic (`functions/i18n.js`)
```javascript
case 'due':
  return {
    title: params.assignedBy 
      ? t('notifications.taskAssigned', lang)
      : t('notifications.reminderDue', lang),
    body: params.assignedBy 
      ? t('notifications.taskAssignedBy', lang, params)
      : t('notifications.dueNow', lang, params)
  };
```

## Notification Flow

### For Creator
1. User creates reminder with assignments
2. Client-side schedules local notifications for creator
3. Cloud Functions schedule notifications for assigned users
4. Creator receives local notifications when app is open

### For Assigned Users
1. Cloud Functions create scheduled notifications in Firestore
2. Cron job (`sendScheduledReminders`) processes due notifications
3. `processScheduledNotification` function sends FCM notifications
4. Assigned users receive push notifications on all devices

## Benefits

### Cost Efficiency
- **Reduced Cloud Function calls**: Only for assigned users, not creators
- **Client-side processing**: Leverages user's device for creator notifications
- **Optimized scheduling**: Cloud Functions only when necessary

### Reliability
- **Cross-device delivery**: Assigned users get notifications even when app is closed
- **Fallback handling**: Cloud Functions ensure delivery
- **Language support**: Full i18n for all notification types

### User Experience
- **Contextual notifications**: Assigned users see who assigned the task
- **Immediate feedback**: Creators get instant local notifications
- **Consistent experience**: Same notification types for all users

## Data Structure

### Scheduled Notification Document
```javascript
{
  reminderId: string,
  userId: string,           // Assigned user ID
  scheduledTime: Timestamp,
  notificationType: string, // 'due', '15min', '30min', etc.
  priority: string,         // 'low', 'medium', 'high'
  status: string,           // 'pending', 'processing', 'sent', 'failed'
  createdAt: Timestamp,
  familyId: string,
  assignedBy: string,       // Creator's user ID
  isAssignedUser: boolean   // true for assigned user notifications
}
```

## Testing

### Test Scenarios
1. **Creator creates reminder with assignments**
   - Creator gets local notifications
   - Assigned users get Cloud Function notifications

2. **Different priority levels**
   - All priorities work for assigned users
   - Only high priority for creators via Cloud Functions

3. **Multiple assigned users**
   - Each assigned user gets separate notifications
   - Creator excluded from assigned user notifications

4. **Language support**
   - Notifications in user's preferred language
   - Proper context for assigned vs creator notifications

## Deployment Status
✅ **Deployed**: All Cloud Functions updated and deployed
✅ **Translation Files**: Updated for English, Spanish, French
✅ **Client-Side Logic**: Updated notification service
✅ **Testing**: Ready for testing with real users

## Next Steps
1. **Test with real users**: Verify assigned user notifications work correctly
2. **Monitor costs**: Track Cloud Function usage and costs
3. **Performance optimization**: Monitor notification delivery times
4. **User feedback**: Gather feedback on notification experience 
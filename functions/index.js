const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getUserLanguage, getNotificationText } = require('./i18n');

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function to send FCM notifications
 * Triggered when a document is added to the 'fcmNotifications' collection
 * Optimized with memory limits and cold start handling
 */
exports.sendFCMNotification = functions
  .runWith({
    memory: '256MB', // Reduced from default 512MB
    timeoutSeconds: 30, // Reduced timeout for faster execution
    minInstances: 0, // Use cold starts to save costs
    maxInstances: 50, // Increased from 10 to handle higher load
  })
  .firestore
  .document('fcmNotifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();

    try {
      // Extract notification data
      const { fcmToken, notification, data, type, userId } = notificationData;

      if (!fcmToken) {
        await snap.ref.update({ 
          status: 'failed', 
          error: 'No FCM token provided',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      // Get user's language preference if userId is provided
      let userLanguage = 'en'; // Default to English
      if (userId) {
        try {
          const userDoc = await admin.firestore().collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userLanguage = getUserLanguage(userData);
            console.log(`User ${userId} language preference: ${userLanguage}`);
          }
        } catch (error) {
          console.warn(`Failed to get user language for ${userId}:`, error);
        }
      }

      // Prepare the FCM message
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          type: type || 'general',
          timestamp: Date.now().toString(),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'reminders',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
              category: 'reminder',
            },
          },
        },
      };

      // Send the FCM notification
      const response = await admin.messaging().send(message);

      // Update the notification request status
      await snap.ref.update({
        status: 'sent',
        messageId: response,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`FCM notification sent successfully: ${response}`);

    } catch (error) {
      console.error(`Failed to send FCM notification: ${error}`);

      // Update the notification request with error details
      await snap.ref.update({
        status: 'failed',
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If we haven't exceeded max attempts, we could retry
      const attempts = (notificationData.attempts || 0) + 1;
      if (attempts < (notificationData.maxAttempts || 3)) {
        console.log(`Retrying notification (attempt ${attempts})`);
        // In a real implementation, you might want to retry with exponential backoff
      }
    }
  });

/**
 * Cloud Function to send task assignment notifications
 * This is the ONLY Cloud Function used for task assignments
 * All other notifications use client-side scheduling
 */
exports.sendTaskAssignmentNotification = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 20, // Higher limit for assignment notifications
  })
  .firestore
  .document('taskAssignments/{assignmentId}')
  .onCreate(async (snap, context) => {
    const assignmentData = snap.data();

    try {
      const { 
        reminderId, 
        assignedByUserId, 
        assignedToUserId, 
        reminderTitle, 
        assignedByDisplayName,
        familyId 
      } = assignmentData;

      if (!assignedToUserId || !reminderId) {
        console.log('Missing required assignment data');
        return;
      }

      // Get assigned user's data
      const assignedUserDoc = await admin.firestore().collection('users').doc(assignedToUserId).get();
      if (!assignedUserDoc.exists) {
        console.log(`Assigned user ${assignedToUserId} not found`);
        return;
      }

      const assignedUserData = assignedUserDoc.data();
      const fcmTokens = assignedUserData?.fcmTokens || [];
      
      // Support both old fcmToken (singular) and new fcmTokens (array) for backward compatibility
      let fcmToken = assignedUserData?.fcmToken;
      if (!fcmToken && fcmTokens.length > 0) {
        fcmToken = fcmTokens[0]; // Use the first token in the array
      }

      if (!fcmToken) {
        console.log(`No FCM token for assigned user ${assignedToUserId}`);
        return;
      }

      // Get assigned user's language preference
      const userLanguage = getUserLanguage(assignedUserData);
      console.log(`Assigned user ${assignedToUserId} language preference: ${userLanguage}`);

      // Create translated notification for task assignment
      const notificationParams = {
        assignedBy: assignedByDisplayName || 'Someone',
        title: reminderTitle || 'New Task'
      };

      const { title, body } = getNotificationText('taskAssigned', userLanguage, notificationParams);
      console.log(`Generated assignment notification for ${userLanguage}: "${title}" - "${body}"`);

      // Send the assignment notification via Cloud Function
      await admin.firestore().collection('fcmNotifications').add({
        fcmToken: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'task_assigned',
          reminderId: reminderId,
          assignedByUserId: assignedByUserId,
          assignedToUserId: assignedToUserId,
          familyId: familyId,
        },
        userId: assignedToUserId, // Include userId for language detection
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });

      // Mark assignment notification as sent
      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Task assignment notification sent to user ${assignedToUserId}`);

    } catch (error) {
      console.error(`Failed to send task assignment notification: ${error}`);
      await snap.ref.update({
        notificationError: error.message,
        notificationErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Cloud Function to process scheduled notifications (for critical reminders only)
 * This is used only for high-priority or critical notifications
 * Most notifications are handled client-side
 */
exports.processScheduledNotification = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 10, // Moderate limit for scheduled notifications
  })
  .firestore
  .document('scheduledNotifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const scheduledNotification = snap.data();

    try {
      const { reminderId, userId, scheduledTime, notificationType, priority } = scheduledNotification;

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

      // Check if it's time to send the notification
      const now = admin.firestore.Timestamp.now();
      const scheduledTimestamp = scheduledNotification.scheduledTime;

      if (scheduledTimestamp.toMillis() > now.toMillis()) {
        console.log(`Notification ${context.params.notificationId} is scheduled for future: ${scheduledTimestamp.toDate()}`);
        return;
      }

      // Get the reminder data
      const reminderDoc = await admin.firestore().collection('reminders').doc(reminderId).get();
      if (!reminderDoc.exists) {
        console.log(`Reminder ${reminderId} not found`);
        await snap.ref.update({ 
          status: 'failed', 
          error: 'Reminder not found',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const reminder = reminderDoc.data();

      // Get user's FCM token and language preference
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        await snap.ref.update({ 
          status: 'failed', 
          error: 'User not found',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];
      
      // Support both old fcmToken (singular) and new fcmTokens (array) for backward compatibility
      let fcmToken = userData?.fcmToken;
      if (!fcmToken && fcmTokens.length > 0) {
        fcmToken = fcmTokens[0]; // Use the first token in the array
      }

      if (!fcmToken) {
        console.log(`No FCM token for user ${userId}`);
        await snap.ref.update({ 
          status: 'failed', 
          error: 'No FCM token',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      // Get user's language preference
      const userLanguage = getUserLanguage(userData);
      console.log(`User ${userId} language preference: ${userLanguage}`);

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

      const { title, body } = getNotificationText(notificationType, userLanguage, notificationParams);
      console.log(`Generated notification for ${userLanguage}: "${title}" - "${body}"`);

      // Create FCM notification request
      await admin.firestore().collection('fcmNotifications').add({
        fcmToken: fcmToken,
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'reminder',
          reminderId: reminderId,
          userId: userId,
          notificationType: notificationType,
          priority: priority,
        },
        userId: userId, // Include userId for language detection
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });

      // Mark scheduled notification as processed
      await snap.ref.update({
        status: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`High-priority scheduled notification processed for reminder: ${reminder.title}`);

    } catch (error) {
      console.error(`Failed to process scheduled notification: ${error}`);
      await snap.ref.update({
        status: 'failed',
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Cloud Function to send scheduled reminder notifications
 * Optimized cron job with batch processing and memory limits
 * Only processes high-priority notifications
 */
exports.sendScheduledReminders = functions
  .runWith({
    memory: '512MB', // Slightly more memory for batch processing
    timeoutSeconds: 300, // 5 minutes for batch operations
    minInstances: 0, // Use cold starts to save costs
    maxInstances: 1, // Only one instance needed for cron job
  })
  .pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Checking for high-priority scheduled reminders...');

    try {
      const now = admin.firestore.Timestamp.now();
      const firestore = admin.firestore();

      // Get only high-priority pending scheduled notifications that are due
      const scheduledNotificationsSnapshot = await firestore
        .collection('scheduledNotifications')
        .where('status', '==', 'pending')
        .where('priority', '==', 'high')
        .where('scheduledTime', '<=', now)
        .limit(100) // Increased limit to match app's 100 reminder limit
        .get();

      console.log(`Found ${scheduledNotificationsSnapshot.size} due high-priority scheduled notifications`);

      // Process notifications in parallel with concurrency limit
      const batchSize = 20; // Increased batch size
      const notifications = scheduledNotificationsSnapshot.docs;
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        // Process batch in parallel
        await Promise.all(batch.map(async (doc) => {
          try {
            // Trigger the processing function by updating the document
            await doc.ref.update({
              status: 'processing',
              lastChecked: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Triggered processing for high-priority scheduled notification: ${doc.id}`);
          } catch (error) {
            console.error(`Failed to process scheduled notification ${doc.id}:`, error);
          }
        }));

        // Small delay between batches to prevent rate limiting
        if (i + batchSize < notifications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      console.error('Failed to process scheduled reminders:', error);
    }
  });

/**
 * HTTP endpoint to send test notifications (for development)
 * Optimized with memory limits and cold start handling
 */
exports.sendTestNotification = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 5,
  })
  .https.onRequest(async (req, res) => {
    try {
      const { fcmToken, title, body } = req.body;

      if (!fcmToken) {
        res.status(400).json({ error: 'FCM token is required' });
        return;
      }

      const message = {
        token: fcmToken,
        notification: {
          title: title || 'Test Notification',
          body: body || 'This is a test notification from Firebase Cloud Functions',
        },
        data: {
          type: 'test',
          timestamp: Date.now().toString(),
        },
      };

      const response = await admin.messaging().send(message);

      res.json({
        success: true,
        messageId: response,
        message: 'Test notification sent successfully',
      });

    } catch (error) {
      console.error('Failed to send test notification:', error);
      res.status(500).json({
        error: 'Failed to send test notification',
        details: error.message,
      });
    }
  });

/**
 * HTTP endpoint to schedule a notification (for testing)
 * Optimized with memory limits and cold start handling
 */
exports.scheduleTestNotification = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 5,
  })
  .https.onRequest(async (req, res) => {
    try {
      const { reminderId, userId, scheduledTime, notificationType, priority } = req.body;

      if (!reminderId || !userId || !scheduledTime || !notificationType) {
        res.status(400).json({ 
          error: 'reminderId, userId, scheduledTime, and notificationType are required' 
        });
        return;
      }

      const firestore = admin.firestore();
      
      // Create scheduled notification
      const scheduledNotificationRef = await firestore.collection('scheduledNotifications').add({
        reminderId: reminderId,
        userId: userId,
        scheduledTime: admin.firestore.Timestamp.fromDate(new Date(scheduledTime)),
        notificationType: notificationType,
        priority: priority || 'medium',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        success: true,
        scheduledNotificationId: scheduledNotificationRef.id,
        message: 'Notification scheduled successfully',
      });

    } catch (error) {
      console.error('Failed to schedule test notification:', error);
      res.status(500).json({
        error: 'Failed to schedule test notification',
        details: error.message,
      });
    }
  }); 
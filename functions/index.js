const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');
const { getUserLanguage, getNotificationText } = require('./i18n');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
admin.initializeApp();

// APNs configuration from Firebase config
const apnsConfig = {
  keyId: functions.config().apns?.key_id || '454ZN6QHTD',
  teamId: functions.config().apns?.team_id || 'M657G6YVPW',
  privateKey: fs.readFileSync(path.join(__dirname, 'AuthKey_454ZN6QHTD.p8'), 'utf8'),
  bundleId: functions.config().apns?.bundle_id || 'org.reactjs.native.example.clueme2',
};

/**
 * Send FCM notification using legacy API
 * This uses a different approach that might work better with iOS
 */
async function sendFCMViaLegacy(fcmToken, notification, data = {}) {
  try {
    // Use the legacy FCM API which might have better iOS support
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      // iOS-only app - no Android configuration needed
      apns: {
        headers: {
          'apns-priority': '10',
          'apns-push-type': 'alert',
          'apns-topic': apnsConfig.bundleId,
        },
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: 'default',
            badge: 1,
            category: 'reminder',
            'content-available': 1,
          },
        },
      },
    };

    // Use the legacy send method
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    throw error;
  }
}

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
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        // iOS-only app - no Android configuration needed
        apns: {
          headers: {
            'apns-topic': apnsConfig.bundleId,
          },
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

      // Try sending via legacy API first, then fall back to standard Admin SDK
      let response;
      let methodUsed = 'admin_sdk';

      try {
        // First try legacy API with better iOS support
        response = await sendFCMViaLegacy(fcmToken, notification, data);
        methodUsed = 'legacy_api';
        console.log(`FCM notification sent successfully via legacy API: ${response}`);
      } catch (legacyError) {
        console.log(`Legacy API failed, trying standard Admin SDK: ${legacyError.message}`);

        try {
          // Fall back to standard Admin SDK
          response = await admin.messaging().send(message);
          methodUsed = 'admin_sdk';
          console.log(`FCM notification sent successfully via Admin SDK: ${response}`);
        } catch (fcmError) {
          console.error(`FCM send error: ${fcmError.message}`);

                  // If it's an auth error, mark as failed but don't retry
        if (fcmError.message.includes('Auth error from APNS')) {
          console.log('APNS auth error - creating local notification fallback');

          // Instead of failing, create a local notification record
          // The client will pick this up and show a local notification
          await snap.ref.update({
            status: 'local_fallback',
            error: fcmError.message,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'apns_auth_error',
            note: 'Using local notification fallback due to APNs configuration issue',
          });

          // Create a local notification record for the client to process
          await admin.firestore().collection('localNotifications').add({
            userId: notificationData.userId,
            title: notification.title,
            body: notification.body,
            data: notificationData.data || {},
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            fcmToken: fcmToken,
            originalNotificationId: snap.id,
          });

          console.log('Local notification fallback created for user');
          return;
        }

          // For other errors, throw to trigger retry
          throw fcmError;
        }
      }

      // Update the notification request status
      await snap.ref.update({
        status: 'sent',
        messageId: response,
        methodUsed: methodUsed,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

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
        familyId,
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
      let fcmToken = null;

      // Prefer fcmTokens array (new format) over fcmToken (old format)
      if (fcmTokens.length > 0) {
        fcmToken = fcmTokens[0]; // Use the first token in the array
      } else if (assignedUserData?.fcmToken) {
        fcmToken = assignedUserData.fcmToken; // Fallback to old format
      }

      // Debug logging to see what tokens we have
      console.log(`Debug - User ${assignedToUserId} tokens:`, {
        fcmToken: fcmToken,
        fcmTokens: fcmTokens,
        fcmTokenLength: fcmToken?.length,
        fcmTokensLength: fcmTokens.length,
      });

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
        title: reminderTitle || 'New Task',
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
          ...(familyId && { familyId: familyId }),
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
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        assignedBy: assignedByUser?.displayName || 'Someone',
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
          error: 'reminderId, userId, scheduledTime, and notificationType are required',
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

/**
 * Test function to verify APNs configuration
 */
exports.testAPNsConfig = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Testing APNs configuration...');

    // Log the APNs config (without sensitive data)
    console.log('APNs Config:', {
      keyId: apnsConfig.keyId,
      teamId: apnsConfig.teamId,
      bundleId: apnsConfig.bundleId,
      privateKeyLength: apnsConfig.privateKey.length,
    });

    res.json({
      success: true,
      message: 'APNs configuration loaded successfully',
      config: {
        keyId: apnsConfig.keyId,
        teamId: apnsConfig.teamId,
        bundleId: apnsConfig.bundleId,
        privateKeyLoaded: !!apnsConfig.privateKey,
      },
    });
  } catch (error) {
    console.error('APNs config test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Cloud Function to clean up orphaned assignment records and scheduled notifications
 * This function removes assignment records and scheduled notifications for deleted reminders
 * Run this manually to clean up old test data
 */
exports.cleanupOrphanedNotifications = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 300, // 5 minutes for cleanup
    minInstances: 0,
    maxInstances: 1, // Only one instance for cleanup
  })
  .https
  .onRequest(async (req, res) => {
    try {
      console.log('Starting cleanup of orphaned notifications...');

      const batchSize = 500;
      let totalCleaned = 0;

      // 1. Clean up orphaned task assignments (where reminder no longer exists)
      console.log('Cleaning up orphaned task assignments...');
      const assignmentsQuery = await admin.firestore()
        .collection('taskAssignments')
        .get();

      const orphanedAssignments = [];
      for (const doc of assignmentsQuery.docs) {
        const assignmentData = doc.data();
        const reminderId = assignmentData.reminderId;

        if (reminderId) {
          const reminderDoc = await admin.firestore()
            .collection('reminders')
            .doc(reminderId)
            .get();

          if (!reminderDoc.exists) {
            orphanedAssignments.push(doc.id);
          }
        }
      }

      // Delete orphaned assignments in batches
      for (let i = 0; i < orphanedAssignments.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchIds = orphanedAssignments.slice(i, i + batchSize);

        batchIds.forEach(id => {
          batch.delete(admin.firestore().collection('taskAssignments').doc(id));
        });

        await batch.commit();
        console.log(`Deleted ${batchIds.length} orphaned task assignments`);
        totalCleaned += batchIds.length;
      }

      // 2. Clean up orphaned scheduled notifications (where reminder no longer exists)
      console.log('Cleaning up orphaned scheduled notifications...');
      const scheduledQuery = await admin.firestore()
        .collection('scheduledNotifications')
        .get();

      const orphanedScheduled = [];
      for (const doc of scheduledQuery.docs) {
        const scheduledData = doc.data();
        const reminderId = scheduledData.reminderId;

        if (reminderId) {
          const reminderDoc = await admin.firestore()
            .collection('reminders')
            .doc(reminderId)
            .get();

          if (!reminderDoc.exists) {
            orphanedScheduled.push(doc.id);
          }
        }
      }

      // Delete orphaned scheduled notifications in batches
      for (let i = 0; i < orphanedScheduled.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchIds = orphanedScheduled.slice(i, i + batchSize);

        batchIds.forEach(id => {
          batch.delete(admin.firestore().collection('scheduledNotifications').doc(id));
        });

        await batch.commit();
        console.log(`Deleted ${batchIds.length} orphaned scheduled notifications`);
        totalCleaned += batchIds.length;
      }

      // 3. Clean up orphaned FCM notifications (where reminder no longer exists)
      console.log('Cleaning up orphaned FCM notifications...');
      const fcmQuery = await admin.firestore()
        .collection('fcmNotifications')
        .get();

      const orphanedFCM = [];
      for (const doc of fcmQuery.docs) {
        const fcmData = doc.data();
        const reminderId = fcmData.data?.reminderId;

        if (reminderId) {
          const reminderDoc = await admin.firestore()
            .collection('reminders')
            .doc(reminderId)
            .get();

          if (!reminderDoc.exists) {
            orphanedFCM.push(doc.id);
          }
        }
      }

      // Delete orphaned FCM notifications in batches
      for (let i = 0; i < orphanedFCM.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchIds = orphanedFCM.slice(i, i + batchSize);

        batchIds.forEach(id => {
          batch.delete(admin.firestore().collection('fcmNotifications').doc(id));
        });

        await batch.commit();
        console.log(`Deleted ${batchIds.length} orphaned FCM notifications`);
        totalCleaned += batchIds.length;
      }

      // 4. Clean up old completed/processed notifications (older than 30 days)
      console.log('Cleaning up old completed notifications...');
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      // Clean up old FCM notifications (simplified query)
      const oldFCMQuery = await admin.firestore()
        .collection('fcmNotifications')
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

      const oldFCMIds = oldFCMQuery.docs
        .filter(doc => ['sent', 'failed', 'processed'].includes(doc.data().status))
        .map(doc => doc.id);

      for (let i = 0; i < oldFCMIds.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchIds = oldFCMIds.slice(i, i + batchSize);

        batchIds.forEach(id => {
          batch.delete(admin.firestore().collection('fcmNotifications').doc(id));
        });

        await batch.commit();
        console.log(`Deleted ${batchIds.length} old FCM notifications`);
        totalCleaned += batchIds.length;
      }

      // Clean up old scheduled notifications (simplified query)
      const oldScheduledQuery = await admin.firestore()
        .collection('scheduledNotifications')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();

      const oldScheduledIds = oldScheduledQuery.docs
        .filter(doc => ['processed', 'failed', 'skipped'].includes(doc.data().status))
        .map(doc => doc.id);

      for (let i = 0; i < oldScheduledIds.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const batchIds = oldScheduledIds.slice(i, i + batchSize);

        batchIds.forEach(id => {
          batch.delete(admin.firestore().collection('scheduledNotifications').doc(id));
        });

        await batch.commit();
        console.log(`Deleted ${batchIds.length} old scheduled notifications`);
        totalCleaned += batchIds.length;
      }

      console.log(`Cleanup completed! Total records cleaned: ${totalCleaned}`);

      res.status(200).json({
        success: true,
        message: `Cleanup completed successfully! Total records cleaned: ${totalCleaned}`,
        details: {
          orphanedAssignments: orphanedAssignments.length,
          orphanedScheduled: orphanedScheduled.length,
          orphanedFCM: orphanedFCM.length,
          oldFCM: oldFCMIds.length,
          oldScheduled: oldScheduledIds.length,
          totalCleaned,
        },
      });

    } catch (error) {
      console.error('Error during cleanup:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

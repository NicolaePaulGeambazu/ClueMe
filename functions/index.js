const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function to send FCM notifications
 * Triggered when a document is added to the 'fcmNotifications' collection
 */
exports.sendFCMNotification = functions.firestore
  .document('fcmNotifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    const notificationId = context.params.notificationId;

    console.log(`Processing FCM notification request: ${notificationId}`);

    try {
      // Extract notification data
      const { fcmToken, notification, data, type } = notificationData;

      if (!fcmToken) {
        console.error('No FCM token provided');
        await snap.ref.update({ 
          status: 'failed', 
          error: 'No FCM token provided',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
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

      console.log(`Sending FCM message to token: ${fcmToken.substring(0, 20)}...`);

      // Send the FCM notification
      const response = await admin.messaging().send(message);

      console.log(`FCM notification sent successfully: ${response}`);

      // Update the notification request status
      await snap.ref.update({
        status: 'sent',
        messageId: response,
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
 * Cloud Function to send scheduled reminder notifications
 * This can be triggered by a cron job or Cloud Scheduler
 */
exports.sendScheduledReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Checking for scheduled reminders...');

    try {
      const now = admin.firestore.Timestamp.now();
      const firestore = admin.firestore();

      // Get all pending reminders that are due
      const remindersSnapshot = await firestore
        .collection('reminders')
        .where('status', '==', 'pending')
        .where('dueDate', '<=', now)
        .where('hasNotification', '==', true)
        .get();

      console.log(`Found ${remindersSnapshot.size} due reminders`);

      for (const doc of remindersSnapshot.docs) {
        const reminder = doc.data();
        
        try {
          // Get user's FCM token
          const userDoc = await firestore.collection('users').doc(reminder.userId).get();
          const userData = userDoc.data();
          const fcmToken = userData?.fcmToken;

          if (!fcmToken) {
            console.log(`No FCM token for user ${reminder.userId}`);
            continue;
          }

          // Create FCM notification request
          await firestore.collection('fcmNotifications').add({
            fcmToken: fcmToken,
            notification: {
              title: 'Reminder Due',
              body: `"${reminder.title}" is due now!`,
            },
            data: {
              type: 'reminder',
              reminderId: doc.id,
              userId: reminder.userId,
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
          });

          console.log(`Scheduled notification for reminder: ${reminder.title}`);

        } catch (error) {
          console.error(`Failed to process reminder ${doc.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to process scheduled reminders:', error);
    }
  });

/**
 * HTTP endpoint to send test notifications (for development)
 */
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
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
import notificationService from '../services/notificationService';
import { getFirestoreInstance } from '../services/firebaseService';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';

export interface TestAssignmentData {
  reminderId: string;
  reminderTitle: string;
  assignedByUserId: string;
  assignedByDisplayName: string;
  assignedToUserIds: string[];
}

/**
 * Test assignment notification by sending it to a specific user
 */
export const testAssignmentNotification = async (
  assignedUserId: string,
  reminderTitle: string = 'Test Task Assignment',
  assignedByName: string = 'Test User'
): Promise<void> => {
  try {
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return;
    }

    const testData: TestAssignmentData = {
      reminderId: `test-${Date.now()}`,
      reminderTitle,
      assignedByUserId: currentUser.uid,
      assignedByDisplayName: assignedByName,
      assignedToUserIds: [assignedUserId],
    };


    // Send the assignment notification
    await notificationService.sendAssignmentNotification(
      testData.reminderId,
      testData.reminderTitle,
      testData.assignedByUserId,
      testData.assignedByDisplayName,
      testData.assignedToUserIds
    );

  } catch (error) {
  }
};

/**
 * Test assignment notification to yourself (for simulator testing)
 */
export const testSelfAssignmentNotification = async (): Promise<void> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return;
    }

    
    await testAssignmentNotification(
      currentUser.uid,
      'Self-Assigned Test Task',
      'Your App'
    );
  } catch (error) {
  }
};

/**
 * Test assignment notification to a family member
 */
export const testFamilyAssignmentNotification = async (familyMemberUserId: string): Promise<void> => {
  try {
    
    await testAssignmentNotification(
      familyMemberUserId,
      'Family Task Assignment',
      'Family Member'
    );
  } catch (error) {
  }
};

/**
 * Check if a user has FCM tokens stored
 */
export const checkUserFCMTokens = async (userId: string): Promise<string[]> => {
  try {
    const firestoreInstance = getFirestoreInstance();
    const userDoc = await firestoreInstance.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const fcmTokens = userData?.fcmTokens || (userData?.fcmToken ? [userData.fcmToken] : []);
    
    return fcmTokens;
  } catch (error) {
    return [];
  }
};

/**
 * Test immediate local notification (for simulator testing)
 */
export const testImmediateLocalNotification = (): void => {
  try {
    
    notificationService.sendTestNotification(true);
    
  } catch (error) {
  }
};

/**
 * Test scheduled local notification (for simulator testing)
 */
export const testScheduledLocalNotification = (secondsFromNow: number = 5): void => {
  try {
    
    notificationService.sendTestNotification30Seconds();
    
  } catch (error) {
  }
};

/**
 * Comprehensive test for assignment notifications that works on simulator
 * This function tests the entire flow from reminder creation to notification delivery
 */
export const runComprehensiveNotificationTest = async (): Promise<void> => {
  try {
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Step 1: Test local notifications first
    testImmediateLocalNotification();
    testScheduledLocalNotification(3);
    
    // Step 2: Test FCM token retrieval
    const tokens = await checkUserFCMTokens(currentUser.uid);
    
    // Step 3: Test self-assignment notification
    await testSelfAssignmentNotification();
    
    // Step 4: Test family assignment notification (if we have family members)
    try {
      const firestoreInstance = getFirestoreInstance();
      const userFamily = await firestoreInstance
        .collection('families')
        .where('ownerId', '==', currentUser.uid)
        .limit(1)
        .get();
      
      if (!userFamily.empty) {
        const familyId = userFamily.docs[0].id;
        const familyMembers = await firestoreInstance
          .collection('familyMembers')
          .where('familyId', '==', familyId)
          .get();
        
        if (familyMembers.size > 1) {
          // Find a family member that's not the current user
          const otherMember = familyMembers.docs.find(doc => 
            doc.data().userId !== currentUser.uid
          );
          
          if (otherMember) {
            await testFamilyAssignmentNotification(otherMember.data().userId);
          } else {
          }
        } else {
        }
      } else {
      }
    } catch (error) {
    }
    
    // Step 5: Test notification service directly
    try {
      const notificationService = require('../services/notificationService').notificationService;
      await notificationService.sendTestNotification();
    } catch (error) {
    }
    
    
  } catch (error) {
    throw error;
  }
};

/**
 * Test assignment notification by creating a real reminder and assigning it
 * This simulates the actual user flow
 */
export const testRealAssignmentFlow = async (assignedUserId: string): Promise<void> => {
  try {
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    // Create a test reminder with assignment
    const reminderData = {
      title: 'Test Assignment Reminder',
      description: 'This is a test reminder to verify assignment notifications',
      type: 'task' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      dueTime: '14:00',
      assignedTo: [assignedUserId],
      assignedBy: currentUser.uid,
      hasNotification: true,
      notificationTimings: [
        { type: 'before' as const, value: 30, label: '30 minutes before' }
      ],
      sharedWithFamily: true,
      familyId: 'test-family-id', // This will be set by the service
      userId: currentUser.uid,
      status: 'pending' as const,
    };

    // Use the reminder service to create the reminder
    const reminderService = require('../services/firebaseService').reminderService;
    const reminderId = await reminderService.createReminder(reminderData);
    
    
    // Clean up: Delete the test reminder after a delay
    setTimeout(async () => {
      try {
        await reminderService.deleteReminder(reminderId);
      } catch (error) {
      }
    }, 30000); // Clean up after 30 seconds
    
  } catch (error) {
    throw error;
  }
};

/**
 * Force refresh FCM token and save to user document
 */
export const forceRefreshFCMToken = async (userId: string): Promise<string | null> => {
  try {
    
    // Import messaging here to avoid circular dependencies
    const messaging = require('@react-native-firebase/messaging').default;
    
    // Force unregister and re-register for remote messages (iOS)
    if (Platform.OS === 'ios') {
      try {
        await messaging().unregisterDeviceForRemoteMessages();
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await messaging().registerDeviceForRemoteMessages();
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const isRegistered = await messaging().isDeviceRegisteredForRemoteMessages;
      } catch (registrationError) {
      }
    }
    
    // Get fresh token
    const token = await messaging().getToken();
    
    if (token) {
      // Save to user document
      const firestoreInstance = getFirestoreInstance();
      await firestoreInstance.collection('users').doc(userId).update({
        fcmTokens: firestore.FieldValue.arrayUnion(token),
        lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return token;
  } catch (error) {
    return null;
  }
};

/**
 * Diagnose FCM token issues
 */
export const diagnoseFCMTokenIssues = async (userId: string): Promise<{
  hasTokens: boolean;
  tokenCount: number;
  lastUpdate: string | null;
  registrationStatus: boolean;
  error: string | null;
}> => {
  try {
    
    // Check user's stored tokens
    const firestoreInstance = getFirestoreInstance();
    const userDoc = await firestoreInstance.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const fcmTokens = userData?.fcmTokens || [];
    const lastUpdate = userData?.lastTokenUpdate;
    
    // Check device registration status
    let registrationStatus = false;
    try {
      const messaging = require('@react-native-firebase/messaging').default;
      registrationStatus = await messaging().isDeviceRegisteredForRemoteMessages;
    } catch (error) {
    }
    
    const result = {
      hasTokens: fcmTokens.length > 0,
      tokenCount: fcmTokens.length,
      lastUpdate: lastUpdate ? new Date(lastUpdate.toDate()).toISOString() : null,
      registrationStatus,
      error: null
    };
    
    return result;
  } catch (error) {
    return {
      hasTokens: false,
      tokenCount: 0,
      lastUpdate: null,
      registrationStatus: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Comprehensive debugging function for notification issues
 * This will help identify where the notification flow is failing
 */
export const debugNotificationSystem = async (): Promise<{
  currentUser: string | null;
  fcmToken: string | null;
  tokensInFirestore: string[];
  notificationPermissions: boolean;
  familyMembers: any[];
  testResults: any;
}> => {
  try {
    console.log('=== NOTIFICATION SYSTEM DEBUG ===');
    
    const currentUser = auth().currentUser;
    console.log('Current user:', currentUser?.uid || 'null');
    
    // Test FCM token generation
    console.log('Testing FCM token generation...');
    const fcmToken = await notificationService.getFCMToken();
    console.log('FCM token:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
    
    // Check tokens in Firestore
    console.log('Checking tokens in Firestore...');
    const tokensInFirestore = await checkUserFCMTokens(currentUser?.uid || '');
    console.log('Tokens in Firestore:', tokensInFirestore.length);
    
    // Check notification permissions
    console.log('Checking notification permissions...');
    const notificationPermissions = await notificationService.areNotificationsEnabled();
    console.log('Notification permissions:', notificationPermissions);
    
    // Check family members
    console.log('Checking family members...');
    let familyMembers: any[] = [];
    if (currentUser) {
      try {
        const firestoreInstance = getFirestoreInstance();
        const userFamily = await firestoreInstance
          .collection('families')
          .where('ownerId', '==', currentUser.uid)
          .limit(1)
          .get();
        
        if (!userFamily.empty) {
          const familyId = userFamily.docs[0].id;
          const membersQuery = await firestoreInstance
            .collection('familyMembers')
            .where('familyId', '==', familyId)
            .get();
          
          familyMembers = membersQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      } catch (error) {
        console.error('Error getting family members:', error);
      }
    }
    console.log('Family members:', familyMembers.length);
    
    // Test notification sending
    console.log('Testing notification sending...');
    const testResults = {
      localNotification: false,
      selfAssignment: false,
      familyAssignment: false,
    };
    
    try {
      // Test local notification
      notificationService.sendTestNotification(true);
      testResults.localNotification = true;
      console.log('Local notification test: SUCCESS');
    } catch (error) {
      console.error('Local notification test: FAILED', error);
    }
    
    try {
      // Test self assignment
      if (currentUser) {
        await testSelfAssignmentNotification();
        testResults.selfAssignment = true;
        console.log('Self assignment test: SUCCESS');
      }
    } catch (error) {
      console.error('Self assignment test: FAILED', error);
    }
    
    try {
      // Test family assignment
      if (familyMembers.length > 1) {
        const otherMember = familyMembers.find(m => m.userId !== currentUser?.uid);
        if (otherMember) {
          await testFamilyAssignmentNotification(otherMember.userId);
          testResults.familyAssignment = true;
          console.log('Family assignment test: SUCCESS');
        }
      }
    } catch (error) {
      console.error('Family assignment test: FAILED', error);
    }
    
    console.log('=== DEBUG COMPLETE ===');
    
    return {
      currentUser: currentUser?.uid || null,
      fcmToken: fcmToken,
      tokensInFirestore,
      notificationPermissions,
      familyMembers,
      testResults,
    };
    
  } catch (error) {
    console.error('Error in debugNotificationSystem:', error);
    throw error;
  }
};

/**
 * Force refresh FCM token and test notification
 */
export const forceRefreshAndTest = async (): Promise<void> => {
  try {
    console.log('=== FORCE REFRESH AND TEST ===');
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.log('No authenticated user found');
      return;
    }
    
    // Force refresh FCM token
    console.log('Force refreshing FCM token...');
    const newToken = await notificationService.forceRefreshFCMToken();
    console.log('New FCM token:', newToken ? newToken.substring(0, 20) + '...' : 'null');
    
    // Wait a moment for token to be saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test notification
    console.log('Testing notification with new token...');
    await testSelfAssignmentNotification();
    
    console.log('=== FORCE REFRESH AND TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error in forceRefreshAndTest:', error);
  }
};

/**
 * Test assignment notification specifically for simulator environment
 * This bypasses FCM and uses local notifications
 */
export const testAssignmentNotificationSimulator = async (
  reminderTitle: string = 'Simulator Test Task',
  assignedByName: string = 'Test User'
): Promise<void> => {
  try {
    console.log('[NotificationTestUtils] Testing assignment notification in simulator mode');
    
    notificationService.testAssignmentNotificationSimulator(reminderTitle, assignedByName);
    
  } catch (error) {
    console.error('[NotificationTestUtils] Error in testAssignmentNotificationSimulator:', error);
  }
};

/**
 * Run comprehensive simulator notification tests
 * This tests all notification types that should work in simulator
 */
export const runSimulatorNotificationTests = (): void => {
  try {
    console.log('[NotificationTestUtils] Running comprehensive simulator notification tests');
    
    notificationService.runSimulatorNotificationTests();
    
  } catch (error) {
    console.error('[NotificationTestUtils] Error in runSimulatorNotificationTests:', error);
  }
};

/**
 * Test the complete assignment flow in simulator mode
 * This creates a real reminder and tests the assignment notification
 */
export const testCompleteAssignmentFlowSimulator = async (): Promise<void> => {
  try {
    console.log('[NotificationTestUtils] Testing complete assignment flow in simulator mode');
    
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.log('[NotificationTestUtils] No authenticated user found');
      return;
    }

    // Create a test reminder with assignment to current user (for simulator testing)
    const reminderData = {
      title: 'Simulator Test Assignment',
      description: 'This is a test reminder to verify assignment notifications in simulator',
      type: 'task' as const,
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      dueTime: '14:00',
      assignedTo: [currentUser.uid], // Assign to current user for simulator testing
      assignedBy: currentUser.uid,
      hasNotification: true,
      notificationTimings: [
        { type: 'before' as const, value: 30, label: '30 minutes before' }
      ],
      sharedWithFamily: true,
      familyId: 'simulator-test-family',
      userId: currentUser.uid,
      status: 'pending' as const,
    };

    // Use the reminder service to create the reminder
    const reminderService = require('../services/firebaseService').reminderService;
    const reminderId = await reminderService.createReminder(reminderData);
    
    console.log(`[NotificationTestUtils] Created test reminder with ID: ${reminderId}`);
    
    // Clean up: Delete the test reminder after a delay
    setTimeout(async () => {
      try {
        await reminderService.deleteReminder(reminderId);
        console.log(`[NotificationTestUtils] Cleaned up test reminder: ${reminderId}`);
      } catch (error) {
        console.error(`[NotificationTestUtils] Error cleaning up test reminder:`, error);
      }
    }, 30000); // Clean up after 30 seconds
    
  } catch (error) {
    console.error('[NotificationTestUtils] Error in testCompleteAssignmentFlowSimulator:', error);
  }
}; 
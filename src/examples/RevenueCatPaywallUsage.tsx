import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRevenueCatPaywall } from '../hooks/useRevenueCatPaywall';
import RevenueCatPaywall from '../components/premium/RevenueCatPaywall';

// Example component showing how to use RevenueCat paywall
export const RevenueCatPaywallExample: React.FC = () => {
  const {
    showSmallPaywall,
    showFullScreenPaywall,
    paywallMessage,
    paywallTrigger,
    showPaywall,
    hidePaywall,
    checkReminderCreation,
    checkFeatureUsage,
  } = useRevenueCatPaywall();

  const handleCreateReminder = async () => {
    // This will automatically show paywall if user hits limits
    const canProceed = await checkReminderCreation();
    if (canProceed) {
      // Proceed with creating reminder
      console.log('Creating reminder...');
    }
  };

  const handleUseRecurringFeature = async () => {
    // This will show paywall if recurring is a premium feature
    const canProceed = await checkFeatureUsage('recurring');
    if (canProceed) {
      // Proceed with recurring feature
      console.log('Using recurring feature...');
    }
  };

  const handleUseCustomNotifications = async () => {
    // This will show paywall if custom notifications is a premium feature
    const canProceed = await checkFeatureUsage('customNotifications');
    if (canProceed) {
      // Proceed with custom notifications
      console.log('Using custom notifications...');
    }
  };

  const handleManualPaywallShow = () => {
    // Manually show paywall with custom message
    showPaywall(
      'small',
      'Upgrade to Pro to unlock unlimited reminders and advanced features!',
      'manual_trigger'
    );
  };

  const handleShowFullScreenPaywall = () => {
    // Manually show full screen paywall
    showPaywall(
      'fullscreen',
      'Unlock the full potential of ClearCue with Pro!',
      'fullscreen_trigger'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RevenueCat Paywall Examples</Text>

      <TouchableOpacity style={styles.button} onPress={handleCreateReminder}>
        <Text style={styles.buttonText}>Create Reminder (Auto Check)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleUseRecurringFeature}>
        <Text style={styles.buttonText}>Use Recurring Feature</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleUseCustomNotifications}>
        <Text style={styles.buttonText}>Use Custom Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleManualPaywallShow}>
        <Text style={styles.buttonText}>Show Small Paywall</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleShowFullScreenPaywall}>
        <Text style={styles.buttonText}>Show Full Screen Paywall</Text>
      </TouchableOpacity>

      {/* RevenueCat Paywall Components */}
      <RevenueCatPaywall
        visible={showSmallPaywall}
        onClose={hidePaywall}
        onUpgrade={() => {
          console.log('User upgraded!');
          hidePaywall();
        }}
        variant="small"
        message={paywallMessage}
        triggerFeature={paywallTrigger || undefined}
      />

      <RevenueCatPaywall
        visible={showFullScreenPaywall}
        onClose={hidePaywall}
        onUpgrade={() => {
          console.log('User upgraded!');
          hidePaywall();
        }}
        variant="fullscreen"
        triggerFeature={paywallTrigger || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Example usage in a reminder creation flow
export const ReminderCreationExample: React.FC = () => {
  const { checkReminderCreation, checkFeatureUsage } = useRevenueCatPaywall();

  const createReminder = async (reminderData: any) => {
    // Check if user can create more reminders
    const canCreate = await checkReminderCreation();
    if (!canCreate) {
      return; // Paywall will be shown automatically
    }

    // Check if user can use recurring feature
    if (reminderData.isRecurring) {
      const canUseRecurring = await checkFeatureUsage('recurring');
      if (!canUseRecurring) {
        return; // Paywall will be shown automatically
      }
    }

    // Check if user can use custom notifications
    if (reminderData.customNotifications) {
      const canUseCustomNotifications = await checkFeatureUsage('customNotifications');
      if (!canUseCustomNotifications) {
        return; // Paywall will be shown automatically
      }
    }

    // Proceed with creating the reminder
    console.log('Creating reminder:', reminderData);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => createReminder({ isRecurring: true })}>
        <Text>Create Recurring Reminder</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example usage in a settings screen
export const SettingsExample: React.FC = () => {
  const { showPaywall } = useRevenueCatPaywall();

  const handleUpgradePress = () => {
    showPaywall('fullscreen', 'Upgrade to unlock all features!', 'settings_upgrade');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleUpgradePress}>
        <Text>Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
};

# ClearCue Technical Implementation Plan

## Executive Summary
This document provides a detailed technical roadmap for implementing ClearCue's monetization system and premium features. It breaks down the current state, identifies gaps, and provides specific implementation steps.

## Current Technical State

### ✅ **Solid Foundation**
- **React Native 0.75** with TypeScript
- **Firebase Integration**: Auth, Firestore, Analytics
- **Progressive Add Reminder UI**: Modern step-by-step interface
- **Recurring Logic**: RRULE + luxon for complex patterns
- **Family Management**: Complete family system with real-time sync
- **Local Notifications**: Permission handling and scheduling
- **Performance Optimization**: Caching, error handling, monitoring

### 🔧 **Needs Enhancement**
- **Error Handling**: Basic error messages, need better UX
- **Loading States**: Inconsistent loading indicators
- **Search & Filter**: Basic functionality, need advanced options
- **Categories**: Limited to 10 tags, need better organization
- **Analytics**: Backend tracking exists, need user-facing insights

### ❌ **Critical Missing Components**
- **Payment System**: No Stripe/Apple Pay/Google Pay integration
- **Subscription Management**: No billing cycles or plan management
- **Usage Limits**: No enforcement or upgrade prompts
- **Premium Features**: Advanced recurring, location reminders, calendar sync

## Phase 1: Payment System Implementation

### Week 1: Core Payment Infrastructure

#### Day 1-2: Stripe Integration Setup

**1. Install Dependencies**
```bash
yarn add @stripe/stripe-react-native
yarn add @stripe/stripe-react-native-paymentsheet
```

**2. Create Payment Service**
```typescript
// src/services/paymentService.ts
import { initStripe, createToken, confirmPayment } from '@stripe/stripe-react-native';

export interface PaymentService {
  initialize(): Promise<void>;
  createPaymentIntent(amount: number, currency: string): Promise<string>;
  confirmPayment(paymentIntentId: string, paymentMethod: any): Promise<boolean>;
  createSubscription(planId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getSubscriptionStatus(): Promise<SubscriptionStatus>;
}

export class StripePaymentService implements PaymentService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await initStripe({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
      merchantIdentifier: 'merchant.com.clearcue.app',
    });
    
    this.isInitialized = true;
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<string> {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    });
    
    const { clientSecret } = await response.json();
    return clientSecret;
  }

  async confirmPayment(paymentIntentId: string, paymentMethod: any): Promise<boolean> {
    const { error } = await confirmPayment(paymentIntentId, {
      paymentMethodType: paymentMethod.type,
      paymentMethodData: paymentMethod.data,
    });
    
    return !error;
  }
}
```

**3. Create Subscription Models**
```typescript
// src/types/subscription.ts
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    reminders: number;
    familyMembers: number;
    storage: number;
  };
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan?: SubscriptionPlan;
  trialDaysLeft?: number;
  nextBillingDate?: Date;
}
```

#### Day 3-4: Subscription Management

**1. Create Subscription Service**
```typescript
// src/services/subscriptionService.ts
export class SubscriptionService {
  async createSubscription(planId: string): Promise<Subscription> {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    
    return response.json();
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    
    return response.ok;
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await fetch('/api/subscriptions/status');
    return response.json();
  }
}
```

**2. Create Subscription Context**
```typescript
// src/contexts/SubscriptionContext.tsx
interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  upgrade: (planId: string) => Promise<void>;
  cancel: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionService = new SubscriptionService();

  const upgrade = async (planId: string) => {
    try {
      const newSubscription = await subscriptionService.createSubscription(planId);
      setSubscription(newSubscription);
    } catch (error) {
      console.error('Upgrade failed:', error);
      throw error;
    }
  };

  const cancel = async () => {
    if (!subscription) return;
    
    try {
      await subscriptionService.cancelSubscription(subscription.id);
      setSubscription({ ...subscription, status: 'canceled' });
    } catch (error) {
      console.error('Cancel failed:', error);
      throw error;
    }
  };

  const refresh = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscription(status.subscription || null);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ subscription, isLoading, upgrade, cancel, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
```

#### Day 5-7: Apple Pay & Google Pay Integration

**1. Configure Apple Pay**
```typescript
// src/services/applePayService.ts
import { ApplePay } from '@stripe/stripe-react-native';

export class ApplePayService {
  async isApplePaySupported(): Promise<boolean> {
    return ApplePay.isApplePaySupported();
  }

  async createApplePayPayment(amount: number): Promise<boolean> {
    const { error } = await ApplePay.presentApplePay({
      cartItems: [{ label: 'ClearCue Pro', amount: amount.toString() }],
      country: 'US',
      currency: 'USD',
    });
    
    return !error;
  }
}
```

**2. Configure Google Pay**
```typescript
// src/services/googlePayService.ts
import { GooglePay } from '@stripe/stripe-react-native';

export class GooglePayService {
  async isGooglePaySupported(): Promise<boolean> {
    return GooglePay.isGooglePaySupported();
  }

  async createGooglePayPayment(amount: number): Promise<boolean> {
    const { error } = await GooglePay.presentGooglePay({
      amount: amount,
      currency: 'USD',
      country: 'US',
    });
    
    return !error;
  }
}
```

### Week 2: Usage Limits & Upgrade Flow

#### Day 1-2: Usage Tracking System

**1. Create Usage Service**
```typescript
// src/services/usageService.ts
export interface UsageLimits {
  reminders: { current: number; limit: number; resetDate: Date };
  familyMembers: { current: number; limit: number };
  storage: { current: number; limit: number };
  emailNotifications: { current: number; limit: number };
}

export class UsageService {
  async trackReminderCreation(): Promise<void> {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const userRef = firestore().collection('users').doc(userId);
    await userRef.update({
      'usage.reminders.current': firestore.FieldValue.increment(1),
      'usage.reminders.lastUpdated': firestore.FieldValue.serverTimestamp(),
    });
  }

  async trackFamilyMemberAddition(): Promise<void> {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const userRef = firestore().collection('users').doc(userId);
    await userRef.update({
      'usage.familyMembers.current': firestore.FieldValue.increment(1),
    });
  }

  async checkLimits(): Promise<UsageLimits> {
    const userId = auth().currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const userDoc = await firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    return {
      reminders: {
        current: userData?.usage?.reminders?.current || 0,
        limit: userData?.subscription?.plan?.limits?.reminders || 50,
        resetDate: userData?.usage?.reminders?.resetDate?.toDate() || new Date(),
      },
      familyMembers: {
        current: userData?.usage?.familyMembers?.current || 0,
        limit: userData?.subscription?.plan?.limits?.familyMembers || 3,
      },
      storage: {
        current: userData?.usage?.storage?.current || 0,
        limit: userData?.subscription?.plan?.limits?.storage || 100 * 1024 * 1024, // 100MB
      },
      emailNotifications: {
        current: userData?.usage?.emailNotifications?.current || 0,
        limit: userData?.subscription?.plan?.limits?.emailNotifications || 10,
      },
    };
  }

  async enforceLimits(): Promise<boolean> {
    const limits = await this.checkLimits();
    
    // Check if any limits are exceeded
    const isExceeded = 
      limits.reminders.current >= limits.reminders.limit ||
      limits.familyMembers.current >= limits.familyMembers.limit ||
      limits.storage.current >= limits.storage.limit ||
      limits.emailNotifications.current >= limits.emailNotifications.limit;
    
    return isExceeded;
  }
}
```

**2. Create Usage Context**
```typescript
// src/contexts/UsageContext.tsx
interface UsageContextType {
  limits: UsageLimits | null;
  isLoading: boolean;
  isExceeded: boolean;
  refresh: () => Promise<void>;
  showUpgradePrompt: (limitType: string) => void;
}

export const UsageContext = createContext<UsageContextType | null>(null);

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExceeded, setIsExceeded] = useState(false);
  const usageService = new UsageService();

  const refresh = async () => {
    try {
      const newLimits = await usageService.checkLimits();
      const exceeded = await usageService.enforceLimits();
      
      setLimits(newLimits);
      setIsExceeded(exceeded);
    } catch (error) {
      console.error('Usage refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showUpgradePrompt = (limitType: string) => {
    // Show upgrade modal based on limit type
    // This will be implemented in the upgrade flow
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <UsageContext.Provider value={{ limits, isLoading, isExceeded, refresh, showUpgradePrompt }}>
      {children}
    </UsageContext.Provider>
  );
};
```

#### Day 3-4: Upgrade UI & Prompts

**1. Create Upgrade Modal Component**
```typescript
// src/components/upgrade/UpgradeModal.tsx
interface UpgradeModalProps {
  isVisible: boolean;
  onClose: () => void;
  limitType?: string;
  currentPlan?: SubscriptionPlan;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isVisible,
  onClose,
  limitType,
  currentPlan,
}) => {
  const { subscription, upgrade } = useContext(SubscriptionContext)!;
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      await upgrade(planId);
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLimitMessage = () => {
    switch (limitType) {
      case 'reminders':
        return 'You\'ve reached your monthly reminder limit. Upgrade to create unlimited reminders!';
      case 'familyMembers':
        return 'You\'ve reached your family member limit. Upgrade to add unlimited family members!';
      case 'storage':
        return 'You\'ve reached your storage limit. Upgrade for unlimited storage!';
      default:
        return 'Unlock premium features to get the most out of ClearCue!';
    }
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Upgrade to ClearCue Pro</Text>
        <Text style={styles.message}>{getLimitMessage()}</Text>
        
        <View style={styles.features}>
          <FeatureItem icon="infinity" title="Unlimited Reminders" />
          <FeatureItem icon="users" title="Unlimited Family Members" />
          <FeatureItem icon="calendar" title="Advanced Recurring Patterns" />
          <FeatureItem icon="map-pin" title="Location-based Reminders" />
          <FeatureItem icon="bar-chart" title="Family Analytics" />
          <FeatureItem icon="calendar" title="Calendar Integration" />
        </View>

        <View style={styles.pricing}>
          <PricingCard
            title="Monthly"
            price="$4.99"
            period="month"
            onPress={() => handleUpgrade('monthly')}
            isLoading={isLoading}
          />
          <PricingCard
            title="Annual"
            price="$49.99"
            period="year"
            savings="Save 17%"
            onPress={() => handleUpgrade('annual')}
            isLoading={isLoading}
          />
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
```

**2. Create Upgrade Prompts**
```typescript
// src/hooks/useUpgradePrompts.ts
export const useUpgradePrompts = () => {
  const { limits, isExceeded } = useContext(UsageContext)!;
  const { subscription } = useContext(SubscriptionContext)!;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitType, setLimitType] = useState<string>();

  const checkAndShowUpgradePrompt = useCallback((action: string) => {
    if (subscription?.status === 'active') return;

    switch (action) {
      case 'create_reminder':
        if (limits?.reminders.current && limits.reminders.current >= limits.reminders.limit - 5) {
          setLimitType('reminders');
          setShowUpgradeModal(true);
        }
        break;
      case 'add_family_member':
        if (limits?.familyMembers.current && limits.familyMembers.current >= limits.familyMembers.limit) {
          setLimitType('familyMembers');
          setShowUpgradeModal(true);
        }
        break;
      case 'use_advanced_feature':
        setLimitType('premium');
        setShowUpgradeModal(true);
        break;
    }
  }, [limits, subscription]);

  return {
    showUpgradeModal,
    limitType,
    setShowUpgradeModal,
    checkAndShowUpgradePrompt,
  };
};
```

## Phase 2: Premium Features Implementation

### Week 3: Advanced Recurring System

#### Day 1-2: Visual Recurring Builder

**1. Create Recurring Pattern Builder**
```typescript
// src/components/recurring/RecurringPatternBuilder.tsx
interface RecurringPatternBuilderProps {
  onPatternChange: (pattern: ComplexPattern) => void;
  initialPattern?: ComplexPattern;
}

export const RecurringPatternBuilder: React.FC<RecurringPatternBuilderProps> = ({
  onPatternChange,
  initialPattern,
}) => {
  const [pattern, setPattern] = useState<ComplexPattern>(initialPattern || {
    frequency: 'daily',
    interval: 1,
    daysOfWeek: [],
    endDate: null,
    skipDates: [],
  });

  const updatePattern = (updates: Partial<ComplexPattern>) => {
    const newPattern = { ...pattern, ...updates };
    setPattern(newPattern);
    onPatternChange(newPattern);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recurring Pattern</Text>
      
      <View style={styles.frequencySection}>
        <Text style={styles.sectionTitle}>Frequency</Text>
        <View style={styles.frequencyOptions}>
          {['daily', 'weekly', 'monthly', 'yearly'].map(freq => (
            <TouchableOpacity
              key={freq}
              style={[styles.frequencyOption, pattern.frequency === freq && styles.selected]}
              onPress={() => updatePattern({ frequency: freq as any })}
            >
              <Text style={styles.frequencyText}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {pattern.frequency === 'weekly' && (
        <View style={styles.daysSection}>
          <Text style={styles.sectionTitle}>Days of Week</Text>
          <View style={styles.daysGrid}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayOption, pattern.daysOfWeek.includes(index) && styles.selected]}
                onPress={() => {
                  const newDays = pattern.daysOfWeek.includes(index)
                    ? pattern.daysOfWeek.filter(d => d !== index)
                    : [...pattern.daysOfWeek, index];
                  updatePattern({ daysOfWeek: newDays });
                }}
              >
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.intervalSection}>
        <Text style={styles.sectionTitle}>Interval</Text>
        <View style={styles.intervalInput}>
          <Text>Every</Text>
          <TextInput
            style={styles.intervalTextInput}
            value={pattern.interval.toString()}
            onChangeText={(text) => updatePattern({ interval: parseInt(text) || 1 })}
            keyboardType="numeric"
          />
          <Text>{pattern.frequency === 'daily' ? 'day(s)' : 
                 pattern.frequency === 'weekly' ? 'week(s)' :
                 pattern.frequency === 'monthly' ? 'month(s)' : 'year(s)'}</Text>
        </View>
      </View>

      <View style={styles.endDateSection}>
        <Text style={styles.sectionTitle}>End Date (Optional)</Text>
        <DatePicker
          value={pattern.endDate || new Date()}
          onChange={(date) => updatePattern({ endDate: date })}
          mode="date"
        />
      </View>
    </View>
  );
};
```

#### Day 3-4: Enhanced Notifications

**1. Create Notification Preferences**
```typescript
// src/components/notifications/NotificationPreferences.tsx
interface NotificationPreferencesProps {
  reminder: Reminder;
  onPreferencesChange: (preferences: NotificationPreferences) => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  reminder,
  onPreferencesChange,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    reminder.notificationPreferences || {
      enabled: true,
      sound: 'default',
      times: [0], // minutes before
      repeat: false,
      repeatInterval: 15, // minutes
    }
  );

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.enableSection}>
        <Text>Enable Notifications</Text>
        <Switch
          value={preferences.enabled}
          onValueChange={(enabled) => updatePreferences({ enabled })}
        />
      </View>

      {preferences.enabled && (
        <>
          <View style={styles.soundSection}>
            <Text style={styles.sectionTitle}>Notification Sound</Text>
            <Picker
              selectedValue={preferences.sound}
              onValueChange={(sound) => updatePreferences({ sound })}
            >
              <Picker.Item label="Default" value="default" />
              <Picker.Item label="Gentle" value="gentle" />
              <Picker.Item label="Urgent" value="urgent" />
              <Picker.Item label="Custom" value="custom" />
            </Picker>
          </View>

          <View style={styles.timesSection}>
            <Text style={styles.sectionTitle}>Reminder Times</Text>
            {preferences.times.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <Text>{time} minutes before</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newTimes = preferences.times.filter((_, i) => i !== index);
                    updatePreferences({ times: newTimes });
                  }}
                >
                  <Icon name="trash-2" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addTimeButton}
              onPress={() => {
                const newTimes = [...preferences.times, 0];
                updatePreferences({ times: newTimes });
              }}
            >
              <Text>Add Reminder Time</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};
```

## Phase 3: Advanced Features Implementation

### Week 5: Calendar Integration

#### Day 1-2: Google Calendar Sync

**1. Create Calendar Service**
```typescript
// src/services/calendarService.ts
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
}

export class CalendarService {
  async requestPermissions(): Promise<boolean> {
    // Request calendar permissions
    const { status } = await Permissions.request('calendar');
    return status === 'granted';
  }

  async syncReminderToCalendar(reminder: Reminder): Promise<string> {
    // Create calendar event from reminder
    const event: CalendarEvent = {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      startDate: new Date(reminder.datetime),
      endDate: new Date(reminder.datetime.getTime() + 30 * 60 * 1000), // 30 minutes
      location: reminder.location,
    };

    // Sync to Google Calendar
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    const { eventId } = await response.json();
    return eventId;
  }

  async syncCalendarToReminders(): Promise<Reminder[]> {
    // Fetch calendar events and convert to reminders
    const response = await fetch('/api/calendar/events');
    const events: CalendarEvent[] = await response.json();

    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      datetime: event.startDate,
      location: event.location,
      isFromCalendar: true,
    }));
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/services/__tests__/paymentService.test.ts
describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new StripePaymentService();
  });

  test('should initialize Stripe successfully', async () => {
    await expect(paymentService.initialize()).resolves.not.toThrow();
  });

  test('should create payment intent', async () => {
    const clientSecret = await paymentService.createPaymentIntent(499, 'usd');
    expect(clientSecret).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// src/integration/__tests__/subscriptionFlow.test.ts
describe('Subscription Flow', () => {
  test('should complete full subscription flow', async () => {
    // 1. Create user
    const user = await createTestUser();
    
    // 2. Create payment intent
    const clientSecret = await paymentService.createPaymentIntent(499);
    
    // 3. Confirm payment
    const paymentSuccess = await paymentService.confirmPayment(clientSecret, mockPaymentMethod);
    expect(paymentSuccess).toBe(true);
    
    // 4. Create subscription
    const subscription = await subscriptionService.createSubscription('monthly');
    expect(subscription.status).toBe('active');
    
    // 5. Verify usage limits updated
    const limits = await usageService.checkLimits();
    expect(limits.reminders.limit).toBe(999999); // Unlimited
  });
});
```

## Deployment Checklist

### Pre-Launch
- [ ] Payment system tested in sandbox
- [ ] Usage limits enforced correctly
- [ ] Upgrade flow working smoothly
- [ ] Premium features functional
- [ ] Analytics tracking implemented
- [ ] Error handling comprehensive
- [ ] Performance optimized
- [ ] Security audit completed

### Launch Day
- [ ] Switch to production Stripe keys
- [ ] Monitor payment processing
- [ ] Watch conversion metrics
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Ready support team

### Post-Launch
- [ ] Analyze conversion data
- [ ] Optimize upgrade prompts
- [ ] A/B test pricing
- [ ] Gather user feedback
- [ ] Plan feature improvements
- [ ] Scale infrastructure

This technical implementation plan provides a clear roadmap for building a robust monetization system that will drive revenue while maintaining excellent user experience. 
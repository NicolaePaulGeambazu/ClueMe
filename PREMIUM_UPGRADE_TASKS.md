# Premium Upgrade Implementation Tasks

## 🎯 Overview
Implement tiered feature access with free users seeing disabled premium features and upgrade prompts.

---

## 📋 Phase 1: Foundation & Data Model (Priority: High)

### 1.1 Data Model Updates
- [ ] **Update Reminder Type Definition**
  - [ ] Add `notificationTimes: number[]` (array of minutes before due)
  - [ ] Add `isPremiumFeature: boolean` flag
  - [ ] Migrate existing `notificationTime` to `notificationTimes[0]`
  - [ ] Update TypeScript interfaces in `src/types/index.ts`

- [ ] **Database Migration**
  - [ ] Create migration script for existing reminders
  - [ ] Convert single `notificationTime` to `notificationTimes` array
  - [ ] Test migration with existing data

### 1.2 Feature Flag System
- [ ] **Create Feature Management**
  - [ ] Create `src/services/featureFlags.ts`
  - [ ] Define premium feature constants
  - [ ] Implement `isPremiumFeature(feature: string)` function
  - [ ] Add user subscription status checking

### 1.3 Past Date Validation
- [ ] **Implement Validation Logic**
  - [ ] Create `src/utils/validationUtils.ts` (if not exists)
  - [ ] Add `validateReminderDate(date: Date): boolean`
  - [ ] Add `validateNotificationTimes(times: number[], dueDate: Date): boolean`
  - [ ] Prevent notifications after due date

---

## 📋 Phase 2: UI Components (Priority: High)

### 2.1 Premium Feature Components
- [ ] **Create DisabledFeature Component**
  - [ ] Create `src/components/premium/DisabledFeature.tsx`
  - [ ] Show lock icon and "Premium" label
  - [ ] Handle tap to show promo modal
  - [ ] Apply consistent styling

- [ ] **Create PromoModal Component**
  - [ ] Create `src/components/premium/PromoModal.tsx`
  - [ ] Show premium features list
  - [ ] Display pricing and trial info
  - [ ] Handle upgrade flow
  - [ ] Add "Maybe Later" option

### 2.2 Notification Timing UI
- [ ] **Update NotificationTimingSelector**
  - [ ] Modify `src/components/ReminderForm/NotificationTimingSelector.tsx`
  - [ ] Show basic options for free users
  - [ ] Show disabled premium options
  - [ ] Add "Add Another Time" button (disabled for free)
  - [ ] Display notification preview

- [ ] **Create Custom Timing Input**
  - [ ] Create `src/components/ReminderForm/CustomTimingInput.tsx`
  - [ ] Allow custom minutes/hours/days input
  - [ ] Validate against due date
  - [ ] Show preview of notification time

### 2.3 Recurring Pattern UI
- [ ] **Update RepeatOptions Component**
  - [ ] Modify `src/components/ReminderForm/RepeatOptions.tsx`
  - [ ] Show basic patterns for free users
  - [ ] Show disabled advanced patterns
  - [ ] Add custom interval input (premium)
  - [ ] Add multiple days selection (premium)

---

## 📋 Phase 3: Notification Service Updates (Priority: High)

### 3.1 Multiple Notification Scheduling
- [ ] **Update Notification Service**
  - [ ] Modify `src/services/notificationService.ts`
  - [ ] Update `scheduleReminderNotification()` to handle arrays
  - [ ] Add `scheduleMultipleNotifications(reminder: Reminder)`
  - [ ] Handle notification cancellation for updates

- [ ] **Notification Management**
  - [ ] Add `cancelReminderNotifications(reminderId: string)`
  - [ ] Add `rescheduleReminderNotifications(reminder: Reminder)`
  - [ ] Handle notification limits (OS constraints)
  - [ ] Add notification deduplication

### 3.2 Background Processing
- [ ] **Update Background Checker**
  - [ ] Modify `src/services/notificationService.ts` background logic
  - [ ] Handle multiple notifications per reminder
  - [ ] Add notification status tracking
  - [ ] Implement smart notification spacing

### 3.3 Notification Preview
- [ ] **Add Preview Functionality**
  - [ ] Create `src/utils/notificationPreview.ts`
  - [ ] Generate human-readable notification schedule
  - [ ] Show "You'll be notified: 1 day, 1 hour, and 10 min before"
  - [ ] Handle edge cases (same times, invalid times)

---

## 📋 Phase 4: Recurring Reminder Updates (Priority: Medium)

### 4.1 Advanced Recurring Patterns
- [ ] **Update Recurring Utils**
  - [ ] Modify `src/utils/recurringReminderUtils.ts`
  - [ ] Add custom interval support (every 3 days, every 2 weeks)
  - [ ] Add multiple days support (Mon, Wed, Fri)
  - [ ] Add end condition support (until date, after X occurrences)

### 4.2 Occurrence Generation
- [ ] **Enhance Occurrence Logic**
  - [ ] Update `generateOccurrences()` function
  - [ ] Handle custom intervals
  - [ ] Handle multiple days per week
  - [ ] Handle end conditions
  - [ ] Add occurrence validation

### 4.3 Recurring Pattern Description
- [ ] **Update Pattern Descriptions**
  - [ ] Modify `getRecurringPatternDescription()` function
  - [ ] Add custom interval descriptions
  - [ ] Add multiple days descriptions
  - [ ] Add end condition descriptions

---

## 📋 Phase 5: Calendar Integration (Priority: Medium)

### 5.1 Calendar Display Updates
- [ ] **Update Calendar Components**
  - [ ] Review `src/components/calendar/` files
  - [ ] Ensure recurring reminders show correctly
  - [ ] Handle multiple notifications per reminder
  - [ ] Show notification indicators

### 5.2 Calendar Event Creation
- [ ] **Calendar Event Logic**
  - [ ] Update calendar event creation for recurring reminders
  - [ ] Handle custom intervals in calendar
  - [ ] Handle multiple days in calendar
  - [ ] Add notification times to calendar events

### 5.3 Calendar Sync
- [ ] **Sync Validation**
  - [ ] Test calendar sync with new recurring patterns
  - [ ] Verify notification times are preserved
  - [ ] Test calendar event updates
  - [ ] Handle calendar permission issues

---

## 📋 Phase 6: Testing & Validation (Priority: High)

### 6.1 Unit Tests
- [ ] **Test Data Model**
  - [ ] Test notification time validation
  - [ ] Test recurring pattern generation
  - [ ] Test migration scripts
  - [ ] Test feature flag system

### 6.2 Integration Tests
- [ ] **Test Notification Service**
  - [ ] Test multiple notification scheduling
  - [ ] Test notification cancellation
  - [ ] Test background processing
  - [ ] Test notification limits

### 6.3 User Acceptance Tests
- [ ] **Test User Flows**
  - [ ] Test free user experience
  - [ ] Test premium feature discovery
  - [ ] Test upgrade flow
  - [ ] Test notification preview

---

## 📋 Phase 7: Analytics & Optimization (Priority: Low)

### 7.1 Analytics Implementation
- [ ] **Track Feature Usage**
  - [ ] Track premium feature clicks
  - [ ] Track upgrade conversions
  - [ ] Track notification usage patterns
  - [ ] Track recurring pattern usage

### 7.2 Performance Optimization
- [ ] **Optimize Performance**
  - [ ] Optimize notification scheduling
  - [ ] Optimize recurring pattern generation
  - [ ] Add caching for feature flags
  - [ ] Optimize calendar sync

---

## 🚀 Implementation Order

### Week 1: Foundation
1. Data model updates
2. Feature flag system
3. Past date validation
4. Basic UI components

### Week 2: Core Features
1. Notification service updates
2. Multiple notification scheduling
3. Basic premium UI
4. Promo modal

### Week 3: Advanced Features
1. Advanced recurring patterns
2. Custom timing inputs
3. Calendar integration
4. Testing

### Week 4: Polish & Launch
1. Analytics implementation
2. Performance optimization
3. User acceptance testing
4. Launch preparation

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Zero crashes related to new features
- [ ] Notification delivery rate > 95%
- [ ] Calendar sync accuracy > 99%
- [ ] App performance maintained

### Business Metrics
- [ ] Premium feature discovery rate
- [ ] Upgrade conversion rate
- [ ] User retention improvement
- [ ] Support ticket reduction

---

## 🔧 Technical Debt & Considerations

### Performance
- [ ] Monitor notification scheduling performance
- [ ] Optimize recurring pattern calculations
- [ ] Handle large numbers of notifications
- [ ] Implement notification batching

### Security
- [ ] Validate all user inputs
- [ ] Prevent notification spam
- [ ] Secure premium feature access
- [ ] Handle subscription validation

### Accessibility
- [ ] Ensure premium features are accessible
- [ ] Add screen reader support
- [ ] Test with accessibility tools
- [ ] Follow WCAG guidelines

---

## 📝 Notes

- **Priority**: Focus on Phase 1-3 first (Foundation, UI, Notifications)
- **Testing**: Test thoroughly on both iOS and Android
- **Backward Compatibility**: Ensure existing reminders continue to work
- **User Experience**: Make upgrade path clear and frictionless
- **Performance**: Monitor app performance throughout implementation 
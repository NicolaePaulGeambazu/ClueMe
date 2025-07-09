# Recurring Reminder Test Checklist

This document provides a comprehensive checklist for testing all recurring reminder configurations. For each test case, check the fields used, notification creation, and reminder creation process.

## Test Case Format
- **Test Case**: [Test Name]
- **Fields Used**: [List of fields that will be set]
- **Notification Creation**: [How notifications will be created]
- **Reminder Creation**: [How the reminder will be created]
- **Code Analysis**: [✅/❌] (Based on code review)
- **Manual Test**: [ ] (Check when completed)

---

## 1. DAILY PATTERNS

### 1.1 Daily - No End Date
- **Test Case**: Daily Task - No End
- **Fields Used**: 
  - `title`: "Daily Task - No End"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: undefined
  - `recurringEndAfter`: undefined
- **Notification Creation**: 
  - Local notifications scheduled for next 14 days (max limit)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 14 notifications
- **Reminder Creation**: Single reminder with recurring pattern, occurrences generated on-demand
- **Code Analysis**: ✅ (All fields supported, notification scheduling implemented, hardcoded 10 limit fixed)
- **Manual Test**: [✅ ] (Fixed: Hardcoded 10 occurrence limit removed)

### 1.2 Daily - End After X Occurrences
- **Test Case**: Daily Task - 5 Times
- **Fields Used**:
  - `title`: "Daily Task - 5 Times"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 5
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 5 occurrences
  - Each occurrence gets 1 notification (15 min before)
  - Total: 5 notifications
- **Reminder Creation**: Single reminder with recurring pattern, stops after 5 occurrences
- **Code Analysis**: ✅ (recurringEndAfter field supported, occurrence counting implemented)
- **Manual Test**: [ ✅]

### 1.3 Daily - End On Specific Date
- **Test Case**: Daily Task - Until 10/07
- **Fields Used**:
  - `title`: "Daily Task - Until 10/07"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2025-10-07
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 10/07
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of days until 10/07] notifications
- **Reminder Creation**: Single reminder with recurring pattern, stops on 10/07
- **Code Analysis**: ✅ (recurringEndDate field supported, date-based termination implemented)
- **Manual Test**: [ ✅]

### 1.4 Daily - Custom Interval (Every 2 Days)
- **Test Case**: Every 2 Days Task
- **Fields Used**:
  - `title`: "Every 2 Days Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 2
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 3 occurrences (every 2 days)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with custom interval, stops after 3 occurrences
- **Code Analysis**: ✅ (customInterval field supported, interval calculation implemented)
- **Manual Test**: [ ]

### 1.5 Daily - Custom Interval (Every 3 Days)
- **Test Case**: Every 3 Days Task
- **Fields Used**:
  - `title`: "Every 3 Days Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 3
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2025-08-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 8/1 (every 3 days)
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of occurrences until 8/1] notifications
- **Reminder Creation**: Single reminder with custom interval, stops on 8/1
- **Code Analysis**: ✅ (Combination of customInterval and recurringEndDate supported)
- **Manual Test**: [ ]

---

## 2. WEEKLY PATTERNS

### 2.1 Weekly - No End Date
- **Test Case**: Weekly Task - No End
- **Fields Used**:
  - `title`: "Weekly Task - No End"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: undefined
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled for next 14 weeks (max limit)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 14 notifications
- **Reminder Creation**: Single reminder with weekly pattern, occurrences generated on-demand
- **Code Analysis**: ✅ (Weekly pattern fully supported with max limit)
- **Manual Test**: [ ]

### 2.2 Weekly - End After X Occurrences
- **Test Case**: Weekly Task - 4 Times
- **Fields Used**:
  - `title`: "Weekly Task - 4 Times"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 4
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 4 occurrences
  - Each occurrence gets 1 notification (15 min before)
  - Total: 4 notifications
- **Reminder Creation**: Single reminder with weekly pattern, stops after 4 occurrences
- **Code Analysis**: ✅ (Weekly with occurrence limit supported)
- **Manual Test**: [ ]

### 2.3 Weekly - End On Specific Date
- **Test Case**: Weekly Task - Until 12/31
- **Fields Used**:
  - `title`: "Weekly Task - Until 12/31"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2025-12-31
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 12/31
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of weeks until 12/31] notifications
- **Reminder Creation**: Single reminder with weekly pattern, stops on 12/31
- **Code Analysis**: ✅ (Weekly with end date supported)
- **Manual Test**: [ ]

### 2.4 Weekly - Custom Interval (Every 2 Weeks)
- **Test Case**: Every 2 Weeks Task
- **Fields Used**:
  - `title`: "Every 2 Weeks Task"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 2
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 3 occurrences (every 2 weeks)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with custom interval, stops after 3 occurrences
- **Code Analysis**: ✅ (Weekly with custom interval supported)
- **Manual Test**: [ ]

### 2.5 Weekly - Custom Interval (Every 3 Weeks)
- **Test Case**: Every 3 Weeks Task
- **Fields Used**:
  - `title`: "Every 3 Weeks Task"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 3
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2025-11-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 11/1 (every 3 weeks)
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of occurrences until 11/1] notifications
- **Reminder Creation**: Single reminder with custom interval, stops on 11/1
- **Code Analysis**: ✅ (Weekly with custom interval and end date supported)
- **Manual Test**: [ ]

---

## 3. MONTHLY PATTERNS

### 3.1 Monthly - No End Date
- **Test Case**: Monthly Task - No End
- **Fields Used**:
  - `title`: "Monthly Task - No End"
  - `isRecurring`: true
  - `repeatPattern`: "monthly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: undefined
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled for next 14 months (max limit)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 14 notifications
- **Reminder Creation**: Single reminder with monthly pattern, occurrences generated on-demand
- **Code Analysis**: ✅ (Monthly pattern fully supported with max limit)
- **Manual Test**: [ ]

### 3.2 Monthly - End After X Occurrences
- **Test Case**: Monthly Task - 6 Times
- **Fields Used**:
  - `title`: "Monthly Task - 6 Times"
  - `isRecurring`: true
  - `repeatPattern`: "monthly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 6
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 6 occurrences
  - Each occurrence gets 1 notification (15 min before)
  - Total: 6 notifications
- **Reminder Creation**: Single reminder with monthly pattern, stops after 6 occurrences
- **Code Analysis**: ✅ (Monthly with occurrence limit supported)
- **Manual Test**: [ ]

### 3.3 Monthly - End On Specific Date
- **Test Case**: Monthly Task - Until 2026-06-01
- **Fields Used**:
  - `title`: "Monthly Task - Until 2026-06-01"
  - `isRecurring`: true
  - `repeatPattern`: "monthly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2026-06-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 6/1/2026
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of months until 6/1/2026] notifications
- **Reminder Creation**: Single reminder with monthly pattern, stops on 6/1/2026
- **Code Analysis**: ✅ (Monthly with end date supported)
- **Manual Test**: [ ]

### 3.4 Monthly - Custom Interval (Every 2 Months)
- **Test Case**: Every 2 Months Task
- **Fields Used**:
  - `title`: "Every 2 Months Task"
  - `isRecurring`: true
  - `repeatPattern`: "monthly"
  - `customInterval`: 2
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 4
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 4 occurrences (every 2 months)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 4 notifications
- **Reminder Creation**: Single reminder with custom interval, stops after 4 occurrences
- **Code Analysis**: ✅ (Monthly with custom interval supported)
- **Manual Test**: [ ]

### 3.5 Monthly - Custom Interval (Every 3 Months)
- **Test Case**: Every 3 Months Task
- **Fields Used**:
  - `title`: "Every 3 Months Task"
  - `isRecurring`: true
  - `repeatPattern`: "monthly"
  - `customInterval`: 3
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2026-12-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 12/1/2026 (every 3 months)
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of occurrences until 12/1/2026] notifications
- **Reminder Creation**: Single reminder with custom interval, stops on 12/1/2026
- **Code Analysis**: ✅ (Monthly with custom interval and end date supported)
- **Manual Test**: [ ]

---

## 4. YEARLY PATTERNS

### 4.1 Yearly - No End Date
- **Test Case**: Yearly Task - No End
- **Fields Used**:
  - `title`: "Yearly Task - No End"
  - `isRecurring`: true
  - `repeatPattern`: "yearly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: undefined
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled for next 14 years (max limit)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 14 notifications
- **Reminder Creation**: Single reminder with yearly pattern, occurrences generated on-demand
- **Code Analysis**: ✅ (Yearly pattern fully supported with max limit)
- **Manual Test**: [ ]

### 4.2 Yearly - End After X Occurrences
- **Test Case**: Yearly Task - 3 Times
- **Fields Used**:
  - `title`: "Yearly Task - 3 Times"
  - `isRecurring`: true
  - `repeatPattern`: "yearly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 3 occurrences
  - Each occurrence gets 1 notification (15 min before)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with yearly pattern, stops after 3 occurrences
- **Code Analysis**: ✅ (Yearly with occurrence limit supported)
- **Manual Test**: [ ]

### 4.3 Yearly - End On Specific Date
- **Test Case**: Yearly Task - Until 2030-01-01
- **Fields Used**:
  - `title`: "Yearly Task - Until 2030-01-01"
  - `isRecurring`: true
  - `repeatPattern`: "yearly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2030-01-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 1/1/2030
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of years until 1/1/2030] notifications
- **Reminder Creation**: Single reminder with yearly pattern, stops on 1/1/2030
- **Code Analysis**: ✅ (Yearly with end date supported)
- **Manual Test**: [ ]

### 4.4 Yearly - Custom Interval (Every 2 Years)
- **Test Case**: Every 2 Years Task
- **Fields Used**:
  - `title`: "Every 2 Years Task"
  - `isRecurring`: true
  - `repeatPattern`: "yearly"
  - `customInterval`: 2
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 3 occurrences (every 2 years)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with custom interval, stops after 3 occurrences
- **Code Analysis**: ✅ (Yearly with custom interval supported)
- **Manual Test**: [ ]

---

## 5. CUSTOM PATTERNS

### 5.1 Custom - Specific Days of Week
- **Test Case**: Weekdays Only Task
- **Fields Used**:
  - `title`: "Weekdays Only Task"
  - `isRecurring`: true
  - `repeatPattern`: "custom"
  - `customFrequencyType`: "weekly"
  - `customInterval`: 1
  - `repeatDays`: [1, 2, 3, 4, 5] (Mon-Fri)
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 10
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 10 weekdays only
  - Each occurrence gets 1 notification (15 min before)
  - Total: 10 notifications (only on weekdays)
- **Reminder Creation**: Single reminder with custom pattern, stops after 10 weekdays
- **Code Analysis**: ✅ (Custom patterns with repeatDays fully implemented with timezone support)
- **Manual Test**: [ ]

### 5.2 Custom - Weekend Only
- **Test Case**: Weekend Only Task
- **Fields Used**:
  - `title`: "Weekend Only Task"
  - `isRecurring`: true
  - `repeatPattern`: "custom"
  - `customFrequencyType`: "weekly"
  - `customInterval`: 1
  - `repeatDays`: [0, 6] (Sun, Sat)
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2025-12-31
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 12/31 (weekends only)
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of weekends until 12/31] notifications
- **Reminder Creation**: Single reminder with custom pattern, stops on 12/31
- **Code Analysis**: ✅ (Custom patterns with repeatDays fully implemented with timezone support)
- **Manual Test**: [ ]

### 5.3 Custom - Specific Days
- **Test Case**: Mon/Wed/Fri Task
- **Fields Used**:
  - `title`: "Mon/Wed/Fri Task"
  - `isRecurring`: true
  - `repeatPattern`: "custom"
  - `customFrequencyType`: "weekly"
  - `customInterval`: 1
  - `repeatDays`: [1, 3, 5] (Mon, Wed, Fri)
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 12
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 12 occurrences (Mon/Wed/Fri only)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 12 notifications
- **Reminder Creation**: Single reminder with custom pattern, stops after 12 occurrences
- **Code Analysis**: ✅ (Custom patterns with repeatDays fully implemented with timezone support)
- **Manual Test**: [ ]

---

## 6. EDGE CASES

### 6.1 Past Start Date
- **Test Case**: Past Start Date Task
- **Fields Used**:
  - `title`: "Past Start Date Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [yesterday's date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 5
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled starting from today (skips past dates)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 5 notifications
- **Reminder Creation**: Single reminder with daily pattern, starts from today
- **Code Analysis**: ✅ (Past date handling implemented, starts from current date)
- **Manual Test**: [ ]

### 6.2 Very Long Interval
- **Test Case**: Every 100 Days Task
- **Fields Used**:
  - `title`: "Every 100 Days Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 100
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 3 occurrences (every 100 days)
  - Each occurrence gets 1 notification (15 min before)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with custom interval, stops after 3 occurrences
- **Code Analysis**: ✅ (Large intervals supported, no upper limit)
- **Manual Test**: [ ]

### 6.3 End Date Before Start Date
- **Test Case**: Invalid End Date Task
- **Fields Used**:
  - `title`: "Invalid End Date Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: [yesterday's date]
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Should show validation error
  - No notifications scheduled
- **Reminder Creation**: Should fail validation, reminder not created
- **Code Analysis**: ✅ (Validation for end date before start date fully implemented)
- **Manual Test**: [ ]

---

## 7. FAMILY ASSIGNMENT TESTS

### 7.1 Family Assignment - Daily
- **Test Case**: Family Daily Task
- **Fields Used**:
  - `title`: "Family Daily Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `assignedTo`: ["family-member-1", "family-member-2"]
  - `sharedWithFamily`: true
  - `familyId`: "test-family-id"
  - `recurringEndAfter`: 7
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications for creator (7 notifications)
  - Push notifications for assigned family members (7 notifications each)
  - Assignment notifications sent immediately
  - Total: 21 notifications (7 + 7 + 7)
- **Reminder Creation**: Single reminder with family assignment, stops after 7 occurrences
- **Code Analysis**: ✅ (Family assignment with recurring reminders fully supported)
- **Manual Test**: [ ]

### 7.2 Family Assignment - Weekly
- **Test Case**: Family Weekly Task
- **Fields Used**:
  - `title`: "Family Weekly Task"
  - `isRecurring`: true
  - `repeatPattern`: "weekly"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `assignedTo`: ["family-member-1"]
  - `sharedWithFamily`: true
  - `familyId`: "test-family-id"
  - `recurringEndDate`: 2025-12-31
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications for creator (until 12/31)
  - Push notifications for assigned family member (until 12/31)
  - Assignment notifications sent immediately
  - Total: [number of weeks until 12/31] * 2 notifications
- **Reminder Creation**: Single reminder with family assignment, stops on 12/31
- **Code Analysis**: ✅ (Family assignment with recurring reminders fully supported)
- **Manual Test**: [ ]

---

## 8. NOTIFICATION TIMING TESTS

### 8.1 Multiple Notification Timings
- **Test Case**: Multiple Notifications Task
- **Fields Used**:
  - `title`: "Multiple Notifications Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [
      {type: "before", value: 60, label: "1 hour before"},
      {type: "before", value: 15, label: "15 minutes before"},
      {type: "exact", value: 0, label: "At due time"}
    ]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications for creator (3 occurrences × 3 timings = 9 notifications)
  - Each occurrence gets 3 notifications
  - Total: 9 notifications
- **Reminder Creation**: Single reminder with multiple notification timings, stops after 3 occurrences
- **Code Analysis**: ✅ (Multiple notification timings supported)
- **Manual Test**: [ ]

### 8.2 No Notifications
- **Test Case**: No Notifications Task
- **Fields Used**:
  - `title`: "No Notifications Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: false
  - `notificationTimings`: []
  - `recurringEndAfter`: 5
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - No notifications scheduled
  - Total: 0 notifications
- **Reminder Creation**: Single reminder without notifications, stops after 5 occurrences
- **Code Analysis**: ✅ (Recurring reminders without notifications supported)
- **Manual Test**: [ ]

---

## 9. TIMEZONE TESTS

### 9.1 Different Timezone
- **Test Case**: Timezone Task
- **Fields Used**:
  - `title`: "Timezone Task"
  - `isRecurring`: true
  - `repeatPattern`: "daily"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `timezone`: "America/Los_Angeles"
  - `timezoneOffset`: -480 (PST)
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 3
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled in PST timezone
  - Each occurrence gets 1 notification (15 min before in PST)
  - Total: 3 notifications
- **Reminder Creation**: Single reminder with timezone, stops after 3 occurrences
- **Code Analysis**: ✅ (Timezone support fully implemented with timezone-aware notifications)
- **Manual Test**: [ ]

---

## 10. COMPLEX PATTERNS

### 10.1 First Monday of Month
- **Test Case**: First Monday Task
- **Fields Used**:
  - `title`: "First Monday Task"
  - `isRecurring`: true
  - `repeatPattern`: "first_monday"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndAfter`: 6
  - `recurringEndDate`: undefined
- **Notification Creation**:
  - Local notifications scheduled for 6 first Mondays
  - Each occurrence gets 1 notification (15 min before)
  - Total: 6 notifications
- **Reminder Creation**: Single reminder with first Monday pattern, stops after 6 occurrences
- **Code Analysis**: ✅ (Complex patterns like "first_monday" fully implemented)
- **Manual Test**: [ ]

### 10.2 Last Friday of Month
- **Test Case**: Last Friday Task
- **Fields Used**:
  - `title`: "Last Friday Task"
  - `isRecurring`: true
  - `repeatPattern`: "last_friday"
  - `customInterval`: 1
  - `dueDate`: [current date]
  - `dueTime`: [current time]
  - `hasNotification`: true
  - `notificationTimings`: [{type: "before", value: 15, label: "15 minutes before"}]
  - `recurringEndDate`: 2026-06-01
  - `recurringEndAfter`: undefined
- **Notification Creation**:
  - Local notifications scheduled until 6/1/2026 (last Fridays)
  - Each occurrence gets 1 notification (15 min before)
  - Total: [number of last Fridays until 6/1/2026] notifications
- **Reminder Creation**: Single reminder with last Friday pattern, stops on 6/1/2026
- **Code Analysis**: ✅ (Complex patterns like "last_friday" fully implemented)
- **Manual Test**: [ ]

---

## Testing Instructions

### For Each Test Case:
1. **Create the reminder** using the specified fields
2. **Verify calendar display** shows correct number of occurrences
3. **Check notification scheduling** in device settings
4. **Test family assignment** if applicable (requires multiple devices)
5. **Verify end conditions** are respected
6. **Check data integrity** in Firebase
7. **Test timezone handling** if applicable

### Key Verification Points:
- ✅ Reminder appears in calendar with correct occurrences
- ✅ Notifications are scheduled for each occurrence
- ✅ Family members receive push notifications (if assigned)
- ✅ End conditions (date/count) are respected
- ✅ Recurring fields are saved correctly in Firebase
- ✅ Timezone conversions work properly
- ✅ No duplicate notifications
- ✅ Performance is acceptable (no infinite loops)

### Common Issues to Watch For:
- ❌ Notifications not scheduled for recurring reminders
- ❌ Calendar shows wrong number of occurrences
- ❌ End conditions not respected
- ❌ Timezone conversion errors
- ❌ Family assignment notifications not sent
- ❌ Performance issues with long intervals
- ❌ Validation errors for invalid configurations 
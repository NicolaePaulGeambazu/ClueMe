# Recurring Reminder Test Cases

This document contains all possible recurring reminder configurations for manual testing. Each test case should be created and verified for:
1. **Calendar Display**: Shows correct number of occurrences
2. **Push Notifications**: Sends notifications for each occurrence
3. **End Conditions**: Respects the specified end date/count
4. **Data Integrity**: Saves correct recurrence fields

---

## 1. DAILY PATTERNS

### 1.1 Daily - No End Date
- **Title**: "Daily Task - No End"
- **Pattern**: Daily
- **Interval**: Every 1 day
- **End**: Never
- **Expected**: 50 occurrences (max limit)
- **Test**: Verify it shows 50 days in calendar

### 1.2 Daily - End After X Occurrences
- **Title**: "Daily Task - 5 Times"
- **Pattern**: Daily
- **Interval**: Every 1 day
- **End**: After 5 occurrences
- **Expected**: 5 occurrences
- **Test**: Verify it shows exactly 5 days

### 1.3 Daily - End On Specific Date
- **Title**: "Daily Task - Until 10/07"
- **Pattern**: Daily
- **Interval**: Every 1 day
- **End**: Until 2025-10-07
- **Expected**: Occurrences from today until 10/07
- **Test**: Verify it stops on 10/07

### 1.4 Daily - Custom Interval (Every 2 Days)
- **Title**: "Every 2 Days Task"
- **Pattern**: Daily
- **Interval**: Every 2 days
- **End**: After 3 occurrences
- **Expected**: 3 occurrences, every 2 days
- **Test**: Verify spacing is 2 days apart

### 1.5 Daily - Custom Interval (Every 3 Days)
- **Title**: "Every 3 Days Task"
- **Pattern**: Daily
- **Interval**: Every 3 days
- **End**: Until 2025-08-01
- **Expected**: Occurrences every 3 days until 8/1
- **Test**: Verify spacing and end date

---

## 2. WEEKLY PATTERNS

### 2.1 Weekly - No End Date
- **Title**: "Weekly Task - No End"
- **Pattern**: Weekly
- **Interval**: Every 1 week
- **End**: Never
- **Expected**: 50 occurrences (max limit)
- **Test**: Verify it shows 50 weeks

### 2.2 Weekly - End After X Occurrences
- **Title**: "Weekly Task - 4 Times"
- **Pattern**: Weekly
- **Interval**: Every 1 week
- **End**: After 4 occurrences
- **Expected**: 4 occurrences
- **Test**: Verify it shows exactly 4 weeks

### 2.3 Weekly - End On Specific Date
- **Title**: "Weekly Task - Until 12/31"
- **Pattern**: Weekly
- **Interval**: Every 1 week
- **End**: Until 2025-12-31
- **Expected**: Occurrences every week until 12/31
- **Test**: Verify it stops on 12/31

### 2.4 Weekly - Custom Interval (Every 2 Weeks)
- **Title**: "Every 2 Weeks Task"
- **Pattern**: Weekly
- **Interval**: Every 2 weeks
- **End**: After 3 occurrences
- **Expected**: 3 occurrences, every 2 weeks
- **Test**: Verify spacing is 2 weeks apart

### 2.5 Weekly - Custom Interval (Every 3 Weeks)
- **Title**: "Every 3 Weeks Task"
- **Pattern**: Weekly
- **Interval**: Every 3 weeks
- **End**: Until 2025-11-01
- **Expected**: Occurrences every 3 weeks until 11/1
- **Test**: Verify spacing and end date

---

## 3. MONTHLY PATTERNS

### 3.1 Monthly - No End Date
- **Title**: "Monthly Task - No End"
- **Pattern**: Monthly
- **Interval**: Every 1 month
- **End**: Never
- **Expected**: 50 occurrences (max limit)
- **Test**: Verify it shows 50 months

### 3.2 Monthly - End After X Occurrences
- **Title**: "Monthly Task - 6 Times"
- **Pattern**: Monthly
- **Interval**: Every 1 month
- **End**: After 6 occurrences
- **Expected**: 6 occurrences
- **Test**: Verify it shows exactly 6 months

### 3.3 Monthly - End On Specific Date
- **Title**: "Monthly Task - Until 2026-06-01"
- **Pattern**: Monthly
- **Interval**: Every 1 month
- **End**: Until 2026-06-01
- **Expected**: Occurrences every month until 6/1/2026
- **Test**: Verify it stops on 6/1/2026

### 3.4 Monthly - Custom Interval (Every 2 Months)
- **Title**: "Every 2 Months Task"
- **Pattern**: Monthly
- **Interval**: Every 2 months
- **End**: After 4 occurrences
- **Expected**: 4 occurrences, every 2 months
- **Test**: Verify spacing is 2 months apart

### 3.5 Monthly - Custom Interval (Every 3 Months)
- **Title**: "Every 3 Months Task"
- **Pattern**: Monthly
- **Interval**: Every 3 months
- **End**: Until 2026-12-01
- **Expected**: Occurrences every 3 months until 12/1/2026
- **Test**: Verify spacing and end date

---

## 4. YEARLY PATTERNS

### 4.1 Yearly - No End Date
- **Title**: "Yearly Task - No End"
- **Pattern**: Yearly
- **Interval**: Every 1 year
- **End**: Never
- **Expected**: 50 occurrences (max limit)
- **Test**: Verify it shows 50 years

### 4.2 Yearly - End After X Occurrences
- **Title**: "Yearly Task - 3 Times"
- **Pattern**: Yearly
- **Interval**: Every 1 year
- **End**: After 3 occurrences
- **Expected**: 3 occurrences
- **Test**: Verify it shows exactly 3 years

### 4.3 Yearly - End On Specific Date
- **Title**: "Yearly Task - Until 2030-01-01"
- **Pattern**: Yearly
- **Interval**: Every 1 year
- **End**: Until 2030-01-01
- **Expected**: Occurrences every year until 1/1/2030
- **Test**: Verify it stops on 1/1/2030

### 4.4 Yearly - Custom Interval (Every 2 Years)
- **Title**: "Every 2 Years Task"
- **Pattern**: Yearly
- **Interval**: Every 2 years
- **End**: After 3 occurrences
- **Expected**: 3 occurrences, every 2 years
- **Test**: Verify spacing is 2 years apart

---

## 5. CUSTOM PATTERNS

### 5.1 Custom - Specific Days of Week
- **Title**: "Weekdays Only Task"
- **Pattern**: Custom
- **Days**: Monday, Tuesday, Wednesday, Thursday, Friday
- **End**: After 10 occurrences
- **Expected**: 10 occurrences, only on weekdays
- **Test**: Verify only weekdays are shown

### 5.2 Custom - Weekend Only
- **Title**: "Weekend Only Task"
- **Pattern**: Custom
- **Days**: Saturday, Sunday
- **End**: Until 2025-12-31
- **Expected**: Occurrences only on weekends until 12/31
- **Test**: Verify only weekends are shown

### 5.3 Custom - Specific Days
- **Title**: "Mon/Wed/Fri Task"
- **Pattern**: Custom
- **Days**: Monday, Wednesday, Friday
- **End**: After 6 occurrences
- **Expected**: 6 occurrences on Mon/Wed/Fri only
- **Test**: Verify correct days are shown

### 5.4 Custom - Single Day
- **Title**: "Every Monday Task"
- **Pattern**: Custom
- **Days**: Monday only
- **End**: After 5 occurrences
- **Expected**: 5 occurrences, all on Mondays
- **Test**: Verify all occurrences are on Mondays

---

## 6. EDGE CASES

### 6.1 Leap Year Test
- **Title**: "Leap Year Task"
- **Pattern**: Yearly
- **Start Date**: 2024-02-29
- **End**: After 4 occurrences
- **Expected**: 4 occurrences (2024, 2028, 2032, 2036)
- **Test**: Verify leap year handling

### 6.2 Month End Date Test
- **Title**: "Month End Task"
- **Pattern**: Monthly
- **Start Date**: 2025-01-31
- **End**: After 3 occurrences
- **Expected**: 3 occurrences (Jan 31, Feb 28, Mar 31)
- **Test**: Verify month end date handling

### 6.3 Time Zone Test
- **Title**: "Time Zone Task"
- **Pattern**: Daily
- **Start Time**: 23:30 (near midnight)
- **End**: After 3 occurrences
- **Expected**: 3 occurrences at 23:30
- **Test**: Verify time zone handling

### 6.4 Very Long Interval
- **Title**: "Long Interval Task"
- **Pattern**: Daily
- **Interval**: Every 30 days
- **End**: After 2 occurrences
- **Expected**: 2 occurrences, 30 days apart
- **Test**: Verify long interval handling

---

## 7. FAMILY ASSIGNMENT TESTS

### 7.1 Family Assignment - Daily
- **Title**: "Family Daily Task"
- **Pattern**: Daily
- **Assigned To**: Family Member
- **End**: After 3 occurrences
- **Expected**: 3 occurrences, push notifications to family member
- **Test**: Verify family member gets notifications

### 7.2 Family Assignment - Weekly
- **Title**: "Family Weekly Task"
- **Pattern**: Weekly
- **Assigned To**: Multiple Family Members
- **End**: Until 2025-12-31
- **Expected**: Weekly occurrences, notifications to all assigned
- **Test**: Verify all family members get notifications

### 7.3 Family Assignment - Custom Pattern
- **Title**: "Family Custom Task"
- **Pattern**: Custom (Weekdays)
- **Assigned To**: Family Member
- **End**: After 5 occurrences
- **Expected**: 5 weekday occurrences, notifications to family
- **Test**: Verify weekday notifications to family

---

## 8. NOTIFICATION TIMING TESTS

### 8.1 Multiple Notification Times
- **Title**: "Multi-Notify Task"
- **Pattern**: Daily
- **Notifications**: 1 hour before, 15 minutes before, at due time
- **End**: After 2 occurrences
- **Expected**: 2 occurrences with 3 notifications each
- **Test**: Verify all notification timings work

### 8.2 Custom Notification Timing
- **Title**: "Custom Notify Task"
- **Pattern**: Weekly
- **Notifications**: 2 hours before, 30 minutes before
- **End**: After 3 occurrences
- **Expected**: 3 occurrences with 2 notifications each
- **Test**: Verify custom notification timings

---

## TESTING CHECKLIST

For each test case, verify:

### ✅ Calendar Display
- [ ] Correct number of occurrences shown
- [ ] Correct dates displayed
- [ ] Proper spacing between occurrences
- [ ] Respects end conditions

### ✅ Push Notifications
- [ ] Notifications sent for each occurrence
- [ ] Correct notification timing
- [ ] Family assignments receive notifications
- [ ] No duplicate notifications

### ✅ Data Integrity
- [ ] `isRecurring: true`
- [ ] `repeatPattern` set correctly
- [ ] `recurringEndDate` or `recurringEndAfter` set correctly
- [ ] `customInterval` set correctly
- [ ] `repeatDays` set correctly (for custom patterns)

### ✅ End Conditions
- [ ] Stops at correct date/count
- [ ] No occurrences beyond end condition
- [ ] Calendar respects end condition

### ✅ Performance
- [ ] No infinite loops
- [ ] Reasonable generation time
- [ ] Memory usage is acceptable

---

## DEBUGGING NOTES

If a test fails, check:
1. **Console logs** for `DEBUG recurring reminder:` output
2. **Reminder object** in database for correct fields
3. **Calendar generation** logs for occurrence count
4. **Notification service** logs for push notification attempts
5. **Family assignment** logs for user IDs and FCM tokens

Common issues to watch for:
- Missing `recurringEndDate` or `recurringEndAfter`
- Incorrect `repeatPattern` values
- Timezone conversion issues
- FCM token not available for family members
- Cloud Functions not deployed or failing 
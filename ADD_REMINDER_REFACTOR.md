# Add Reminder Screen Refactor

## Overview

The Add Reminder screen has been completely refactored from a long form to a clean, progressive, step-by-step experience. This new design provides a more intuitive and modern user experience.

## Key Features

### 🎯 Progressive UI
- **Step 1**: Title input only ("What should I remind you about?")
- **Step 2**: DateTime selection with quick options (Today, Tomorrow, Pick date/time)
- **Step 3**: Repeat options (Never, Daily, Weekly, Custom)
- **Step 4**: Push notification toggle
- **Save Button**: Appears only when all steps are visible

### 🎨 Modern Design
- Clean, card-based layout
- Minimal padding and large touch targets
- System fonts (San Francisco / Roboto)
- Accent color: `#5A67D8` (primary blue)
- Feather icons from `lucide-react-native`
- Light and dark mode support

### 🔄 Recurring Logic
- Uses `rrule` library for robust recurrence handling
- Supports daily, weekly, monthly, and yearly patterns
- Custom recurrence builder (placeholder for future implementation)
- RRULE string generation and parsing

### 🔔 Push Notifications
- Local notifications using `react-native-push-notification`
- Permission handling with `react-native-permissions`
- Support for recurring notifications (daily/weekly)
- Background notification scheduling

## Technical Implementation

### Dependencies Added
```json
{
  "rrule": "^2.8.1",
  "luxon": "^3.6.1", 
  "react-native-date-picker": "^5.0.13",
  "react-native-permissions": "^5.4.1",
  "@types/luxon": "^3.6.2"
}
```

### Key Files

#### `src/app/(tabs)/add.tsx`
- Main Add Reminder screen with progressive UI
- Step-by-step form validation
- Integration with existing Firebase services

#### `src/utils/recurringUtils.ts`
- RRULE string generation and parsing
- Next occurrence calculation
- Human-readable recurrence descriptions
- Validation utilities

#### `src/utils/notificationUtils.ts`
- Local notification scheduling
- Permission handling
- Notification management utilities

### Data Flow

1. **User Input**: Progressive form collects data step by step
2. **Validation**: Each step validates before revealing the next
3. **Data Transformation**: Converts to Firebase reminder format
4. **Storage**: Saves to Firestore via existing `createReminder` function
5. **Notification**: Schedules local notification if enabled

### Reminder Object Format

```typescript
interface ReminderData {
  title: string;
  datetime: string; // ISO 8601
  repeatRRule?: string; // optional recurrence
  pushNotification: boolean;
}
```

## Usage

### Basic Flow
1. User taps "Add" button
2. Enters reminder title
3. Selects date/time (Today, Tomorrow, or custom picker)
4. Chooses repeat pattern
5. Toggles notifications
6. Saves reminder

### Custom Recurrence
- Currently shows placeholder modal
- Future implementation will include:
  - Weekly day selection (Mon, Wed, Fri)
  - Monthly day selection (1st, 15th)
  - Custom intervals
  - End date selection

## Future Enhancements

### 🔧 Custom Recurrence Builder
- Weekly day picker with checkboxes
- Monthly day/nth day selector
- Custom interval inputs
- End date picker

### 🌐 Firebase Cloud Functions
- Remote push notifications via FCM
- Background reminder processing
- Timezone handling
- Cross-device sync

### 📱 Advanced Features
- Location-based reminders
- Priority levels
- Categories/tags
- Family sharing
- Voice input

## Migration Notes

### Breaking Changes
- Complete UI redesign
- New progressive form flow
- Different data structure for recurring reminders

### Backward Compatibility
- Existing reminders continue to work
- Firebase data structure unchanged
- Existing notification system preserved

## Testing

### Manual Testing Checklist
- [ ] Title input validation
- [ ] Date/time picker functionality
- [ ] Quick date options (Today, Tomorrow)
- [ ] Repeat pattern selection
- [ ] Custom recurrence modal
- [ ] Notification permission handling
- [ ] Save functionality
- [ ] Form reset on navigation
- [ ] Light/dark mode support

### Automated Testing
- Unit tests for recurring utilities
- Integration tests for notification scheduling
- E2E tests for complete user flow

## Performance Considerations

- Lazy loading of date picker modal
- Efficient RRULE parsing
- Minimal re-renders with proper state management
- Optimized notification scheduling

## Accessibility

- Large touch targets (44pt minimum)
- Clear visual hierarchy
- Proper contrast ratios
- Screen reader support
- Keyboard navigation support

## Troubleshooting

### Common Issues

1. **Date Picker Not Working**
   - Ensure `react-native-date-picker` is properly linked
   - Check iOS/Android specific setup

2. **Notifications Not Showing**
   - Verify notification permissions
   - Check notification channel setup (Android)
   - Ensure app is not in background restrictions

3. **RRULE Parsing Errors**
   - Validate RRULE string format
   - Check for unsupported recurrence patterns

### Debug Commands
```bash
# Check notification permissions
adb shell dumpsys notification | grep reminders

# View scheduled notifications
adb shell dumpsys alarm | grep reminder

# Test notification
npx react-native run-android --variant=debug
```

## Contributing

When contributing to the Add Reminder screen:

1. Follow the progressive UI pattern
2. Maintain step-by-step validation
3. Use existing utility functions
4. Test on both iOS and Android
5. Update documentation for new features 
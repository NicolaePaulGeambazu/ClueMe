# Reminder System Design Plan - Modal & Wizard Hybrid

## Design Philosophy
- **Modal for Simple**: Quick tasks use single modals
- **Wizard for Complex**: Multi-step flows for advanced features
- **Progressive Complexity**: Start simple, reveal options as needed
- **Clean & Focused**: Each screen shows only what's necessary

## 🎨 Design System

### Visual Hierarchy
```
Modal Types:
1. Quick Modal - Single action, auto-close
2. Standard Modal - 2-3 fields max
3. Wizard Modal - Step-by-step for complex tasks

Colors:
- Primary: #4F46E5 (Indigo)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)
- Surface: #F9FAFB (Light) / #1F2937 (Dark)
```

## 📱 User Flows

### 1. Quick Add Modal (Simple Reminders)

```
Trigger: Floating + Button
┌─────────────────────────────────┐
│         New Reminder            │
│ ─────────────────────────────── │
│                                 │
│ What do you need to remember?   │
│ ┌─────────────────────────────┐ │
│ │ Buy milk                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ When?                           │
│ ┌─────────────┬───────────────┐ │
│ │ Today ▼     │ 5:00 PM ▼     │ │
│ └─────────────┴───────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      Create Reminder        │ │
│ └─────────────────────────────┘ │
│                                 │
│ Need more options? [Advanced]   │
└─────────────────────────────────┘

Quick Date Options (Dropdown):
- Today
- Tomorrow  
- This Weekend
- Next Week
- Pick Date...

Quick Time Options (Dropdown):
- Morning (9 AM)
- Noon (12 PM)
- Afternoon (3 PM)
- Evening (6 PM)
- Night (9 PM)
- Pick Time...
```

### 2. Advanced Reminder Wizard (Complex Features)

```
Step 1/4: Basic Details
┌─────────────────────────────────┐
│ Create Reminder      [1]→2→3→4  │
│ ─────────────────────────────── │
│                                 │
│ Title *                         │
│ ┌─────────────────────────────┐ │
│ │ Team meeting preparation    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Description (optional)          │
│ ┌─────────────────────────────┐ │
│ │ Review Q4 reports and       │ │
│ │ prepare slides              │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]              [Next →]  │
└─────────────────────────────────┘
            │
            ▼
Step 2/4: Schedule
┌─────────────────────────────────┐
│ Schedule             1→[2]→3→4  │
│ ─────────────────────────────── │
│                                 │
│ Date                            │
│ ┌─────────────────────────────┐ │
│ │ Fri, Jan 12, 2025      📅   │ │
│ └─────────────────────────────┘ │
│                                 │
│ Time                            │
│ ┌──────────────┬──────────────┐ │
│ │ 2:00        ▼│ PM         ▼ │ │
│ └──────────────┴──────────────┘ │
│                                 │
│ □ This is an all-day event     │
│                                 │
│ [← Back]              [Next →]  │
└─────────────────────────────────┘
            │
            ▼
Step 3/4: Repeat & Assign
┌─────────────────────────────────┐
│ Details              1→2→[3]→4  │
│ ─────────────────────────────── │
│                                 │
│ Repeat                          │
│ ┌─────────────────────────────┐ │
│ │ Never                    ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Assign to                       │
│ ┌─────────────────────────────┐ │
│ │ 👤 Me                    ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ □ Send notification to assignee │
│                                 │
│ [← Back]              [Next →]  │
└─────────────────────────────────┘
            │
            ▼
Step 4/4: Category & Priority
┌─────────────────────────────────┐
│ Organize             1→2→3→[4]  │
│ ─────────────────────────────── │
│                                 │
│ Category                        │
│ ┌─────────────────────────────┐ │
│ │ 💼 Work                  ▼  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Priority                        │
│ ○ Low  ● Normal  ○ High        │
│                                 │
│ Reminder Alert                  │
│ ☑ 15 minutes before            │
│ □ 1 hour before                │
│ □ 1 day before                 │
│                                 │
│ [← Back]            [Create ✓]  │
└─────────────────────────────────┘
```

### 3. Repeat Configuration Modal

```
When "Repeat" is changed to anything but "Never":
┌─────────────────────────────────┐
│ Repeat Settings         [Close] │
│ ─────────────────────────────── │
│                                 │
│ Repeat every                    │
│ ┌───┐ ┌─────────────────────┐  │
│ │ 1 │ │ week(s)           ▼ │  │
│ └───┘ └─────────────────────┘  │
│                                 │
│ On these days                   │
│ ┌───┬───┬───┬───┬───┬───┬───┐ │
│ │ S │ M │ T │ W │ T │ F │ S │ │
│ ├───┼───┼───┼───┼───┼───┼───┤ │
│ │   │ ✓ │   │ ✓ │   │ ✓ │   │ │
│ └───┴───┴───┴───┴───┴───┴───┘ │
│                                 │
│ End repeat                      │
│ ○ Never                         │
│ ○ On ___________               │
│ ● After [10] occurrences       │
│                                 │
│ [Cancel]              [Save ✓]  │
└─────────────────────────────────┘
```

### 4. Assignment Modal

```
When "Assign to" is clicked:
┌─────────────────────────────────┐
│ Assign Task             [Close] │
│ ─────────────────────────────── │
│                                 │
│ Select people                   │
│ ┌─────────────────────────────┐ │
│ │ ☑ Paul (Me)                │ │
│ │ □ Sarah                    │ │
│ │ □ Mike                     │ │
│ │ □ Emma                     │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick groups                    │
│ [Everyone] [Kids] [Parents]     │
│                                 │
│ Notification                    │
│ ☑ Notify when assigned         │
│ ☑ Remind before due date       │
│                                 │
│ [Cancel]             [Assign ✓] │
└─────────────────────────────────┘
```

### 5. Category Selection Modal

```
Compact Category Picker:
┌─────────────────────────────────┐
│ Select Category         [Close] │
│ ─────────────────────────────── │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ │
│ │  💼   │ │  🏠   │ │  🏥   │ │
│ │ Work  │ │ Home  │ │Health │ │
│ └───────┘ └───────┘ └───────┘ │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ │
│ │  🛒   │ │  📚   │ │  💰   │ │
│ │ Shop  │ │ Study │ │Finance│ │
│ └───────┘ └───────┘ └───────┘ │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ │
│ │  🎯   │ │  🚗   │ │   +   │ │
│ │ Goals │ │Travel │ │  New  │ │
│ └───────┘ └───────┘ └───────┘ │
│                                 │
└─────────────────────────────────┘
```

### 6. Edit Reminder Modal

```
For existing reminders:
┌─────────────────────────────────┐
│ Edit Reminder           [Close] │
│ ─────────────────────────────── │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Doctor appointment          │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📅 Tomorrow, 2:00 PM     [Edit] │
│ 🔁 Does not repeat       [Edit] │
│ 👤 Assigned to me        [Edit] │
│ 🏷️ Health                [Edit] │
│ ⚡ Normal priority       [Edit] │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ [Delete]          [Save Changes]│
└─────────────────────────────────┘
```

## 🎯 Interaction Patterns

### Modal Behaviors
1. **Quick Modal**
   - Opens with keyboard focus on first field
   - Enter key creates reminder
   - Escape key cancels
   - Auto-closes on success

2. **Wizard Modal**
   - Progress indicator at top
   - Back/Next navigation
   - Validates before proceeding
   - Saves draft automatically

3. **Edit Modals**
   - Inline editing where possible
   - Changes save immediately
   - Undo option for 5 seconds

### Smart Defaults
```
Time Defaults:
- Morning tasks: 9:00 AM
- Afternoon tasks: 2:00 PM
- Evening tasks: 6:00 PM
- Based on user's past behavior

Category Auto-Select:
- "Meeting" → Work
- "Buy" → Shopping
- "Doctor" → Health
- "Pay" → Finance
```

### Validation & Feedback
```
┌─────────────────────────────────┐
│ ✓ Reminder created              │
│   "Team meeting" set for        │
│   tomorrow at 2:00 PM           │
│                                 │
│ [View] [Undo]                   │
└─────────────────────────────────┘
```

## 📊 Complex Features Integration

### Recurring Patterns
```
Simple Patterns (Dropdown):
- Daily
- Weekdays
- Weekends
- Weekly
- Bi-weekly
- Monthly
- Custom...

Custom Pattern Builder:
- Visual calendar preview
- Exception dates
- Holiday awareness
- Conflict detection
```

### Priority System
```
Visual Priority Indicators:
🔴 Urgent - Red banner, top of list
🟠 High - Orange dot, bold text
🟡 Normal - Default styling
⚪ Low - Gray text, bottom of list
```

### Notification Strategy
```
Smart Notifications:
- Time-based: X minutes/hours before
- Location-based: When arriving/leaving
- Dependency-based: When related task completes
- Quiet hours: Respect DND settings
```

## 🔧 Technical Implementation

### State Management
```javascript
// Modal State
const modalState = {
  quickAdd: { isOpen: false, data: {} },
  wizard: { 
    isOpen: false, 
    currentStep: 1,
    data: {},
    isDirty: false
  },
  editModals: {
    repeat: { isOpen: false },
    assign: { isOpen: false },
    category: { isOpen: false }
  }
};

// Reminder Schema
interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  dueTime?: Time;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  assignees: User[];
  category: Category;
  priority: Priority;
  notifications: Notification[];
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### Modal Components Structure
```
components/
├── modals/
│   ├── QuickAddModal.tsx
│   ├── ReminderWizard/
│   │   ├── index.tsx
│   │   ├── StepBasicDetails.tsx
│   │   ├── StepSchedule.tsx
│   │   ├── StepRepeatAssign.tsx
│   │   └── StepCategoryPriority.tsx
│   ├── RepeatModal.tsx
│   ├── AssignModal.tsx
│   ├── CategoryModal.tsx
│   └── EditReminderModal.tsx
└── shared/
    ├── ModalHeader.tsx
    ├── ModalFooter.tsx
    └── StepIndicator.tsx
```

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44x44px touch areas
- 8px spacing between interactive elements
- Large buttons for primary actions

### Responsive Modals
```
Mobile (< 768px):
- Full-screen modals
- Bottom sheet for quick actions
- Swipe down to close

Tablet/Desktop (>= 768px):
- Centered modals with overlay
- Max width: 500px
- Keyboard navigation support
```

## 🚀 Implementation Phases

### Phase 1: Core Modals (Week 1-2)
- Quick Add Modal
- Basic validation
- Simple date/time pickers
- Create/Read operations

### Phase 2: Wizard Flow (Week 3-4)
- Multi-step wizard
- Progress tracking
- Draft saving
- Advanced scheduling

### Phase 3: Edit Modals (Week 5-6)
- Repeat configuration
- Assignment system
- Category management
- Priority settings

### Phase 4: Polish (Week 7-8)
- Animations & transitions
- Keyboard shortcuts
- Accessibility
- Performance optimization

## 📈 Success Metrics

- Quick reminder creation: < 5 seconds
- Wizard completion rate: > 80%
- Error rate: < 5%
- User satisfaction: > 4.5/5

## 🎨 Design Principles Summary

1. **Clarity**: Each modal has one clear purpose
2. **Efficiency**: Common tasks require minimal taps
3. **Flexibility**: Power features available when needed
4. **Consistency**: Similar patterns across all modals
5. **Feedback**: Clear confirmation and error states

This hybrid approach balances simplicity with power, allowing users to create basic reminders quickly while providing advanced features through a clean wizard interface when needed.
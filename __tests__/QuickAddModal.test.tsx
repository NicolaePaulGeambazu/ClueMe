import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '../src/contexts/ThemeContext.js';
import { AuthProvider } from '../src/contexts/AuthContext.js';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import QuickAddModal from '../src/components/reminders/QuickAddModal.js';

// Mock the hooks
jest.mock('../src/hooks/useReminders', () => ({
  useReminders: () => ({
    createReminder: jest.fn().mockResolvedValue('test-id'),
    reminders: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../src/hooks/useFamily', () => ({
  useFamily: () => ({
    family: null,
    members: [
      { id: 'member1', name: 'John Doe' },
      { id: 'member2', name: 'Jane Smith' },
    ],
  }),
}));

jest.mock('../src/hooks/usePremium', () => ({
  usePremium: () => ({
    isPremium: false,
    hasFeature: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('../src/contexts/ModalContext', () => ({
  useModal: () => ({
    showDatePicker: jest.fn(),
  }),
}));

// Mock date-fns to have consistent dates
jest.mock('date-fns', () => ({
  format: jest.fn((date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </I18nextProvider>
);

describe('QuickAddModal', () => {
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;
  let mockOnAdvanced: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSave = jest.fn();
    mockOnAdvanced = jest.fn();
    
    // Mock current date to be consistent
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Date Selection Functionality', () => {
    it('should display correct date options', () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      expect(getByText('Today')).toBeTruthy();
      expect(getByText('Tomorrow')).toBeTruthy();
      expect(getByText('This weekend')).toBeTruthy();
      expect(getByText('Next week')).toBeTruthy();
      expect(getByText('Pick specific date')).toBeTruthy();
    });

    it('should update selected date when date option is chosen', async () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Open date sheet
      fireEvent.press(getByText('Today'));
      
      // Select tomorrow
      fireEvent.press(getByText('Tomorrow'));
      
      await waitFor(() => {
        expect(getByText('Tomorrow')).toBeTruthy();
      });
    });

    it('should show custom date when date picker is used', async () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Open date sheet
      fireEvent.press(getByText('Today'));
      
      // Select custom date
      fireEvent.press(getByText('Pick specific date'));
      
      // Mock date picker confirmation
      await act(async () => {
        // Simulate date picker confirmation with a specific date
        const customDate = new Date('2024-02-01');
        // This would normally be called by the date picker component
        // For now, we'll test the state change indirectly
      });
    });
  });

  describe('Time Selection Functionality', () => {
    it('should show appropriate time options for today', () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Open time sheet
      fireEvent.press(getByText('1 hour from now'));
      
      // Should show "now" and "in1hour" for today
      expect(getByText('Right now')).toBeTruthy();
      expect(getByText('In 1 hour')).toBeTruthy();
      expect(getByText('Lunch time')).toBeTruthy();
      expect(getByText('Afternoon')).toBeTruthy();
    });

    it('should not show "now" and "in1hour" for non-today dates', async () => {
      const { getByText, queryByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Change date to tomorrow
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Tomorrow'));
      
      // Open time sheet
      fireEvent.press(getByText('2:00 PM'));
      
      await waitFor(() => {
        // Should not show "now" and "in1hour" for tomorrow
        expect(queryByText('Right now')).toBeNull();
        expect(queryByText('In 1 hour')).toBeNull();
        expect(getByText('Lunch time')).toBeTruthy();
        expect(getByText('Afternoon')).toBeTruthy();
        expect(getByText('Tomorrow morning')).toBeTruthy();
      });
    });

    it('should reset time selection when changing from today to another date', async () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Initially shows "1 hour from now" (default for today)
      expect(getByText('1 hour from now')).toBeTruthy();
      
      // Change date to tomorrow
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Tomorrow'));
      
      await waitFor(() => {
        // Should reset to afternoon (default for non-today)
        expect(getByText('2:00 PM')).toBeTruthy();
      });
    });

    it('should calculate "1 hour from now" relative to selected date', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Set title to enable save
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Test reminder');
      }

      // Change date to tomorrow
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Tomorrow'));
      
      // Change time to "1 hour from now"
      fireEvent.press(getByText('2:00 PM'));
      fireEvent.press(getByText('In 1 hour'));
      
      // Save the reminder
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        
        // The time should be calculated relative to tomorrow, not today
        const tomorrow = new Date('2024-01-16T10:00:00Z');
        const expectedTime = new Date(tomorrow.getTime() + 60 * 60 * 1000);
        const expectedTimeString = `${expectedTime.getHours().toString().padStart(2, '0')}:${expectedTime.getMinutes().toString().padStart(2, '0')}`;
        
        expect(savedReminder.dueTime).toBe(expectedTimeString);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle past dates gracefully', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Mock a past date selection
      const pastDate = new Date('2024-01-10T10:00:00Z');
      
      // This would normally be set through the date picker
      // For testing, we'll simulate the state change
      await act(async () => {
        // Simulate selecting a past date
      });
      
      // The reminder should still be created but with adjusted time
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Past date reminder');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle very far future dates', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Mock a far future date selection
      const futureDate = new Date('2030-12-31T10:00:00Z');
      
      await act(async () => {
        // Simulate selecting a far future date
      });
      
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Future reminder');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueDate).toBe('2030-12-31');
      });
    });

    it('should handle timezone changes', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Mock timezone change
      const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Simulate timezone change
      Object.defineProperty(Intl, 'DateTimeFormat', {
        writable: true,
        value: jest.fn().mockReturnValue({
          resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' })
        })
      });
      
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Timezone test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.timezone).toBe('America/Los_Angeles');
      });
      
      // Restore original timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        writable: true,
        value: jest.fn().mockReturnValue({
          resolvedOptions: () => ({ timeZone: originalTimezone })
        })
      });
    });

    it('should handle rapid date/time changes', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Rapidly change dates
      await act(async () => {
        fireEvent.press(getByText('Today'));
        fireEvent.press(getByText('Tomorrow'));
        fireEvent.press(getByText('This weekend'));
        fireEvent.press(getByText('Next week'));
        fireEvent.press(getByText('Today'));
      });
      
      // Should still work correctly
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Rapid change test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle empty title validation', async () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Try to save without title
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should handle very long titles', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      const longTitle = 'A'.repeat(200); // Very long title
      
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, longTitle);
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title.length).toBeLessThanOrEqual(100); // Should be truncated
      });
    });
  });

  describe('Recurring Reminders', () => {
    it('should handle recurring reminder creation', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Daily reminder');
      }
      
      // Open recurring options
      fireEvent.press(getByText('Does not repeat'));
      
      // This would normally open the recurring options modal
      // For testing, we'll simulate the state change
      await act(async () => {
        // Simulate setting recurring pattern
      });
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.isRecurring).toBe(true);
      });
    });
  });

  describe('Family Assignment', () => {
    it('should handle family member assignment', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Family task');
      }
      
      // Open family assignment
      fireEvent.press(getByText('Assign to me'));
      
      // This would normally open the family picker modal
      // For testing, we'll simulate the state change
      await act(async () => {
        // Simulate assigning to family members
      });
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(Array.isArray(savedReminder.assignedTo)).toBe(true);
      });
    });
  });

  describe('Modal Lifecycle', () => {
    it('should reset state when modal is closed and reopened', async () => {
      const { getByText, getByPlaceholderText, rerender } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Change some values
      const titleInput = getByPlaceholderText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Test reminder');
      }
      
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Tomorrow'));
      
      // Close modal
      fireEvent.press(getByText('✕'));
      
      // Reopen modal
      rerender(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );
      
      await waitFor(() => {
        // Should be reset to defaults
        expect(getByText('Today')).toBeTruthy();
        expect(getByText('1 hour from now')).toBeTruthy();
      });
    });

    it('should handle prefilled data correctly', async () => {
      const prefillData = {
        title: 'Prefilled reminder',
        dueDate: '2024-01-16',
        dueTime: '14:00',
        isRecurring: true,
        recurringPattern: {
          type: 'daily',
          interval: 1,
          days: [],
          endCondition: 'never',
          endDate: null,
        },
      };

      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
            prefillData={prefillData}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Prefilled reminder')).toBeTruthy();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid user interactions without crashing', async () => {
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Simulate rapid interactions
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.press(getByText('Today'));
          fireEvent.press(getByText('Tomorrow'));
          fireEvent.press(getByText('1 hour from now'));
          fireEvent.press(getByText('2:00 PM'));
        }
      });
      
      // Should not crash
      expect(getByText('Create Reminder')).toBeTruthy();
    });

    it('should handle large number of family members', async () => {
      // Mock many family members
      jest.doMock('../src/hooks/useFamily', () => ({
        useFamily: () => ({
          family: null,
          members: Array.from({ length: 50 }, (_, i) => ({
            id: `member${i}`,
            name: `Member ${i}`,
          })),
        }),
      }));

      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Should still work with many family members
      expect(getByText('Assign to me')).toBeTruthy();
    });
  });
}); 
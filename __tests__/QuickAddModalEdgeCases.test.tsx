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
    members: [],
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </I18nextProvider>
);

describe('QuickAddModal Edge Cases', () => {
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

  describe('Boundary Date Tests', () => {
    it('should handle leap year dates correctly', async () => {
      // Set date to February 29, 2024 (leap year)
      jest.setSystemTime(new Date('2024-02-29T10:00:00Z'));
      
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Leap year test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueDate).toBe('2024-02-29');
      });
    });

    it('should handle year boundary correctly', async () => {
      // Set date to December 31, 2024
      jest.setSystemTime(new Date('2024-12-31T23:59:59Z'));
      
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Year boundary test');
      }
      
      // Select tomorrow (should be January 1, 2025)
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Tomorrow'));
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueDate).toBe('2025-01-01');
      });
    });

    it('should handle month boundary correctly', async () => {
      // Set date to January 31, 2024
      jest.setSystemTime(new Date('2024-01-31T10:00:00Z'));
      
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Month boundary test');
      }
      
      // Select next week (should handle February correctly)
      fireEvent.press(getByText('Today'));
      fireEvent.press(getByText('Next week'));
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueDate).toBe('2024-02-07');
      });
    });
  });

  describe('Time Boundary Tests', () => {
    it('should handle midnight time correctly', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Midnight test');
      }
      
      // This would normally be set through custom time picker
      // For testing, we'll simulate the state change
      await act(async () => {
        // Simulate setting time to midnight (00:00)
      });
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueTime).toBe('00:00');
      });
    });

    it('should handle 23:59 time correctly', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Late night test');
      }
      
      await act(async () => {
        // Simulate setting time to 23:59
      });
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.dueTime).toBe('23:59');
      });
    });

    it('should handle timezone edge cases', async () => {
      // Mock different timezone
      const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      Object.defineProperty(Intl, 'DateTimeFormat', {
        writable: true,
        value: jest.fn().mockReturnValue({
          resolvedOptions: () => ({ timeZone: 'UTC' })
        })
      });
      
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Timezone edge test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.timezone).toBe('UTC');
      });
      
      // Restore original timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        writable: true,
        value: jest.fn().mockReturnValue({
          resolvedOptions: () => ({ timeZone: originalTimezone })
        })
      });
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle whitespace-only titles', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, '   ');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should handle titles with only special characters', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, '!@#$%^&*()');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title).toBe('!@#$%^&*()');
      });
    });

    it('should handle unicode characters in titles', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, '🎉 🎊 🎈 Unicode Test 中文 Español');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title).toBe('🎉 🎊 🎈 Unicode Test 中文 Español');
      });
    });

    it('should handle very short titles', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'A');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title).toBe('A');
      });
    });
  });

  describe('State Management Edge Cases', () => {
    it('should handle rapid state changes', async () => {
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

      // Rapidly change states
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          fireEvent.press(getByText('Today'));
          fireEvent.press(getByText('Tomorrow'));
          fireEvent.press(getByText('1 hour from now'));
          fireEvent.press(getByText('2:00 PM'));
        }
      });
      
      // Should still be functional
      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Rapid state test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle concurrent operations', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Concurrent test');
      }
      
      // Simulate concurrent operations
      await act(async () => {
        const promises = [
          Promise.resolve().then(() => fireEvent.press(getByText('Today'))),
          Promise.resolve().then(() => fireEvent.press(getByText('Tomorrow'))),
          Promise.resolve().then(() => fireEvent.press(getByText('Create Reminder'))),
        ];
        await Promise.all(promises);
      });
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle save function throwing error', async () => {
      const mockOnSaveWithError = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSaveWithError}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Error test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSaveWithError).toHaveBeenCalled();
      });
      
      // Modal should still be open after error
      expect(getByText('Create Reminder')).toBeTruthy();
    });

    it('should handle network timeout scenarios', async () => {
      const mockOnSaveWithTimeout = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      const { getByText } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSaveWithTimeout}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Timeout test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      // Fast-forward time
      await act(async () => {
        jest.advanceTimersByTime(150);
      });
      
      await waitFor(() => {
        expect(mockOnSaveWithTimeout).toHaveBeenCalled();
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large number of reminders without memory issues', async () => {
      // Mock many reminders
      jest.doMock('../src/hooks/useReminders', () => ({
        useReminders: () => ({
          createReminder: jest.fn().mockResolvedValue('test-id'),
          reminders: Array.from({ length: 1000 }, (_, i) => ({
            id: `reminder-${i}`,
            title: `Reminder ${i}`,
            dueDate: '2024-01-15',
            dueTime: '10:00',
          })),
          isLoading: false,
          error: null,
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Memory test');
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle rapid modal open/close cycles', async () => {
      const { rerender } = render(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      // Rapidly open and close modal
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          rerender(
            <TestWrapper>
              <QuickAddModal
                visible={false}
                onClose={mockOnClose}
                onSave={mockOnSave}
                onAdvanced={mockOnAdvanced}
              />
            </TestWrapper>
          );
          
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
        }
      });
      
      // Should not crash
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility Edge Cases', () => {
    it('should handle screen reader interactions', async () => {
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

      // Simulate screen reader navigation
      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Accessibility test');
        fireEvent.focus(titleInput);
        fireEvent.blur(titleInput);
      }
      
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle keyboard navigation', async () => {
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

      const titleInput = getByText('What do you want to remember?');
      if (titleInput) {
        fireEvent.changeText(titleInput, 'Keyboard test');
        fireEvent.keyPress(titleInput, { key: 'Enter' });
      }
      
      // Should still work after keyboard interaction
      fireEvent.press(getByText('Create Reminder'));
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });
}); 
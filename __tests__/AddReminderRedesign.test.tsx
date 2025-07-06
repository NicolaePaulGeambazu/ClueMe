import React from 'react';
import renderer from 'react-test-renderer';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import AddReminderContainer from '../src/components/reminders/AddReminderContainer';
import QuickAddModal from '../src/components/reminders/QuickAddModal';
import ReminderWizard from '../src/components/reminders/ReminderWizard';

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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </I18nextProvider>
);

describe('Add Reminder Redesign', () => {
  describe('QuickAddModal', () => {
    it('renders without crashing', () => {
      const mockOnClose = jest.fn();
      const mockOnSave = jest.fn();
      const mockOnAdvanced = jest.fn();

      const tree = renderer.create(
        <TestWrapper>
          <QuickAddModal
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
            onAdvanced={mockOnAdvanced}
          />
        </TestWrapper>
      );

      expect(tree).toBeTruthy();
    });
  });

  describe('ReminderWizard', () => {
    it('renders without crashing', () => {
      const mockOnClose = jest.fn();
      const mockOnSave = jest.fn();

      const tree = renderer.create(
        <TestWrapper>
          <ReminderWizard
            visible={true}
            onClose={mockOnClose}
            onSave={mockOnSave}
          />
        </TestWrapper>
      );

      expect(tree).toBeTruthy();
    });
  });

  describe('AddReminderContainer', () => {
    it('renders without crashing', () => {
      const mockOnClose = jest.fn();

      const tree = renderer.create(
        <TestWrapper>
          <AddReminderContainer
            visible={true}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(tree).toBeTruthy();
    });
  });
}); 
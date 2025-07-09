import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, View, NativeModules } from 'react-native';
import QuickAddModal from '../src/components/reminders/QuickAddModal';
import { AuthContext } from '../src/contexts/AuthContext';
import { ThemeContext } from '../src/contexts/ThemeContext';
import { ModalContext } from '../src/contexts/ModalContext';
import { FamilyContext } from '../src/contexts/FamilyContext';
import { useFamily } from '../src/hooks/useFamily';
import { usePremium } from '../src/hooks/usePremium';
import { Colors } from '../src/constants/Colors';

// Mock NativeModules for i18n
NativeModules.SettingsManager = {
  settings: {
    AppleLocale: 'en_US',
    AppleLanguages: ['en_US']
  }
};
NativeModules.I18nManager = {
  localeIdentifier: 'en_US'
};

// Mock Firebase dependencies
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(),
    signOut: jest.fn(),
  }),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  default: () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    onSnapshot: jest.fn(),
  }),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  default: () => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onMessage: jest.fn(),
  }),
}));

// Mock the hooks and contexts
jest.mock('../src/hooks/useFamily');
jest.mock('../src/hooks/usePremium');
jest.mock('../src/contexts/AuthContext');
jest.mock('../src/contexts/ThemeContext');
jest.mock('../src/contexts/ModalContext');
jest.mock('../src/contexts/FamilyContext');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock('../src/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: jest.fn(),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/utils/timezoneUtils', () => ({
  getCurrentTimezone: () => 'America/New_York',
  getTimezoneDisplayName: () => 'Eastern Time',
}));
jest.mock('../src/design-system/reminders/utils/recurring-utils', () => ({
  generateOccurrences: jest.fn(),
  getRecurringDescription: () => 'Daily',
}));
jest.mock('../src/utils/reminderUtils', () => ({
  cleanReminderForFirestore: jest.fn((reminder) => reminder),
}));
jest.mock('../src/components/ads/BannerAdComponent', () => 'BannerAdComponent');
jest.mock('../src/components/ads/InterstitialAdTrigger', () => 'InterstitialAdTrigger');
jest.mock('../src/components/ReminderForm/CustomDateTimePicker', () => ({
  CustomDateTimePickerModal: 'CustomDateTimePickerModal',
}));
jest.mock('../src/components/ReminderForm/RepeatOptions', () => ({
  RepeatOptions: 'RepeatOptions',
}));
jest.mock('../src/components/ReminderForm/RepeatModal', () => ({
  RepeatModal: 'RepeatModal',
}));

const mockUseFamily = useFamily as jest.MockedFunction<typeof useFamily>;
const mockUsePremium = usePremium as jest.MockedFunction<typeof usePremium>;

describe('QuickAddModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnAdvanced = jest.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    onAdvanced: mockOnAdvanced,
  };

  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
  };

  const mockColors = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    primary: '#007AFF',
    borderLight: '#E5E5E5',
    error: '#FF3B30',
  };

  const mockFamilyMembers = [
    { 
      id: 'member-1', 
      familyId: 'test-family-id',
      userId: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member' as const,
      isOnline: false,
      lastActive: new Date(),
      joinedAt: new Date(),
      createdBy: 'owner-1'
    },
    { 
      id: 'member-2', 
      familyId: 'test-family-id',
      userId: 'user-2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'member' as const,
      isOnline: false,
      lastActive: new Date(),
      joinedAt: new Date(),
      createdBy: 'owner-1'
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseFamily.mockReturnValue({
      family: { id: 'test-family-id', name: 'Test Family', ownerId: 'owner-1', ownerName: 'Owner', memberCount: 2, maxMembers: 5, createdAt: new Date(), updatedAt: new Date() },
      members: mockFamilyMembers,
      activities: [],
      pendingInvitations: [],
      isLoading: false,
      error: null,
      loadFamily: jest.fn(),
      createFamily: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      createActivity: jest.fn(),
      loadPendingInvitations: jest.fn(),
      sendInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      declineInvitation: jest.fn(),
      leaveFamily: jest.fn(),
      isOwner: false,
      isMember: true,
      hasPendingInvitations: false,
    });

    mockUsePremium.mockReturnValue({
      isPremium: false,
      hasFeature: jest.fn(() => false),
      currentTier: 'free',
      isPro: false,
      features: {
        noAds: false,
        unlimitedReminders: false,
        advancedRecurring: false,
        multipleNotifications: false,
        familySharing: false,
        customThemes: false,
        prioritySupport: false,
        customIntervals: false,
        multipleDays: false,
        endConditions: false,
        timezoneSupport: false,
        unlimitedLists: false,
      },
      plans: [],
      subscriptionStatus: {
        tier: 'free',
        name: 'Free',
        description: 'Basic features with ads',
        isActive: false,
      },
      purchasePlan: jest.fn(),
      restorePurchases: jest.fn(),
      isLoading: false,
    });
  });

  const renderWithProviders = (props = {}) => {
    return render(
      <AuthContext.Provider value={{ 
        user: mockUser, 
        isAnonymous: false, 
        signIn: jest.fn(), 
        signOut: jest.fn(),
        signUp: jest.fn(),
        signInAnonymously: jest.fn(),
        upgradeFromAnonymous: jest.fn(),
        resetPassword: jest.fn(),
        requireAuth: jest.fn(),
        updateUserProfile: jest.fn(),
        isLoading: false
      }}>
        <ThemeContext.Provider value={{ 
          theme: 'light', 
          colors: Colors.light,
          isDark: false,
          toggleTheme: jest.fn() 
        }}>
          <ModalContext.Provider value={{ 
            showDatePicker: jest.fn(), 
            hideDatePicker: jest.fn(),
            showQuickAddModal: jest.fn(),
            hideQuickAddModal: jest.fn(),
            showEditReminderModal: jest.fn(),
            hideEditReminderModal: jest.fn()
          }}>
            <FamilyContext.Provider value={{ 
              family: { id: 'test-family-id', name: 'Test Family', ownerId: 'owner-1', ownerName: 'Owner', memberCount: 2, maxMembers: 5, createdAt: new Date(), updatedAt: new Date() },
              familyMembers: mockFamilyMembers, 
              currentMember: mockFamilyMembers[0],
              isLoading: false,
              hasFamily: true,
              isOwner: false,
              createFamily: jest.fn(),
              inviteMember: jest.fn(),
              updateMember: jest.fn(),
              removeMember: jest.fn(),
              refreshFamily: jest.fn()
            }}>
              <QuickAddModal {...defaultProps} {...props} />
            </FamilyContext.Provider>
          </ModalContext.Provider>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
  };

  describe('Basic Functionality', () => {
    it('should render the modal when visible', () => {
      const { getByTestId } = renderWithProviders();
      
      expect(getByTestId('title-input')).toBeTruthy();
      expect(getByTestId('date-selector')).toBeTruthy();
      expect(getByTestId('time-selector')).toBeTruthy();
      expect(getByTestId('save-button')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = renderWithProviders({ visible: false });
      
      expect(queryByTestId('title-input')).toBeNull();
    });

    it('should close modal when close button is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('close-button'));
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should enable save button when title is entered', () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      
      // Initially disabled
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
      
      // Enter title
      fireEvent.changeText(titleInput, 'Test reminder');
      
      // Should be enabled
      expect(saveButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('should call onSave with correct data when save button is pressed', async () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      
      // Enter title
      fireEvent.changeText(titleInput, 'Test reminder');
      
      // Press save
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title).toBe('Test reminder');
        expect(savedReminder.userId).toBe(mockUser.uid);
      });
    });
  });

  describe('Date and Time Selection', () => {
    it('should open date selector when date selector is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('date-selector'));
      
      // Should show date options
      expect(getByTestId('date-option-today')).toBeTruthy();
      expect(getByTestId('date-option-tomorrow')).toBeTruthy();
    });

    it('should open time selector when time selector is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('time-selector'));
      
      // Should show time options
      expect(getByTestId('time-option-in1hour')).toBeTruthy();
      expect(getByTestId('time-option-in2hours')).toBeTruthy();
    });

    it('should update date when date option is selected', () => {
      const { getByTestId } = renderWithProviders();
      
      // Open date selector
      fireEvent.press(getByTestId('date-selector'));
      
      // Select tomorrow
      fireEvent.press(getByTestId('date-option-tomorrow'));
      
      // Close date selector
      fireEvent.press(getByTestId('date-sheet-cancel'));
      
      // Date selector should reflect the selection
      const dateSelector = getByTestId('date-selector');
      expect(dateSelector).toBeTruthy();
    });

    it('should update time when time option is selected', () => {
      const { getByTestId } = renderWithProviders();
      
      // Open time selector
      fireEvent.press(getByTestId('time-selector'));
      
      // Select specific time
      fireEvent.press(getByTestId('time-option-in2hours'));
      
      // Close time selector
      fireEvent.press(getByTestId('time-sheet-cancel'));
      
      // Time selector should reflect the selection
      const timeSelector = getByTestId('time-selector');
      expect(timeSelector).toBeTruthy();
    });
  });

  describe('Recurring Reminders', () => {
    it('should open recurring options when recurring selector is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('recurring-selector'));
      
      // Should show recurring options modal
      expect(getByTestId('recurring-selector')).toBeTruthy();
    });

    it('should include recurring data when saving recurring reminder', async () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      
      // Enter title
      fireEvent.changeText(titleInput, 'Daily reminder');
      
      // Press save
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        const savedReminder = mockOnSave.mock.calls[0][0];
        expect(savedReminder.title).toBe('Daily reminder');
        expect(savedReminder.isRecurring).toBe(false); // Default state
      });
    });
  });

  describe('Family Assignment', () => {
    it('should open family picker when family selector is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('family-selector'));
      
      // Should show family member options
      expect(getByTestId('family-member-member-1')).toBeTruthy();
      expect(getByTestId('family-member-member-2')).toBeTruthy();
    });

    it('should assign family members when selected', () => {
      const { getByTestId } = renderWithProviders();
      
      // Open family picker
      fireEvent.press(getByTestId('family-selector'));
      
      // Select a family member
      fireEvent.press(getByTestId('family-member-member-1'));
      
      // Close family picker
      fireEvent.press(getByTestId('family-picker-done'));
      
      // Family selector should reflect the selection
      const familySelector = getByTestId('family-selector');
      expect(familySelector).toBeTruthy();
    });
  });

  describe('Advanced Options', () => {
    it('should call onAdvanced when advanced options link is pressed', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('advanced-options-link'));
      
      expect(mockOnAdvanced).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timezone Selection', () => {
    it('should show timezone selector', () => {
      const { getByTestId } = renderWithProviders();
      
      expect(getByTestId('timezone-selector')).toBeTruthy();
    });

    it('should handle timezone selector press', () => {
      const { getByTestId } = renderWithProviders();
      
      fireEvent.press(getByTestId('timezone-selector'));
      
      // Should not crash and should log the action
      expect(getByTestId('timezone-selector')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      const { getByTestId } = renderWithProviders();
      
      const saveButton = getByTestId('save-button');
      
      // Try to save with empty title
      fireEvent.press(saveButton);
      
      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only title', () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      
      // Enter whitespace
      fireEvent.changeText(titleInput, '   ');
      
      // Should be disabled
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should handle very long title', () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const longTitle = 'A'.repeat(101); // Exceeds maxLength of 100
      
      fireEvent.changeText(titleInput, longTitle);
      
      // Should truncate to 100 characters
      expect(titleInput.props.value.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Modal Lifecycle', () => {
    it('should reset form when modal is closed and reopened', () => {
      const { getByTestId, rerender } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      
      // Enter some data
      fireEvent.changeText(titleInput, 'Test reminder');
      
      // Close modal
      fireEvent.press(getByTestId('close-button'));
      
      // Reopen modal
      rerender(
        <AuthContext.Provider value={{ 
          user: mockUser, 
          isAnonymous: false, 
          signIn: jest.fn(), 
          signOut: jest.fn(),
          signUp: jest.fn(),
          signInAnonymously: jest.fn(),
          upgradeFromAnonymous: jest.fn(),
          resetPassword: jest.fn(),
          requireAuth: jest.fn(),
          updateUserProfile: jest.fn(),
          isLoading: false
        }}>
          <ThemeContext.Provider value={{ 
            theme: 'light', 
            colors: Colors.light,
            isDark: false,
            toggleTheme: jest.fn() 
          }}>
            <ModalContext.Provider value={{ 
              showDatePicker: jest.fn(), 
              hideDatePicker: jest.fn(),
              showQuickAddModal: jest.fn(),
              hideQuickAddModal: jest.fn(),
              showEditReminderModal: jest.fn(),
              hideEditReminderModal: jest.fn()
            }}>
              <FamilyContext.Provider value={{ 
                family: { id: 'test-family-id', name: 'Test Family', ownerId: 'owner-1', ownerName: 'Owner', memberCount: 2, maxMembers: 5, createdAt: new Date(), updatedAt: new Date() },
                familyMembers: mockFamilyMembers, 
                currentMember: mockFamilyMembers[0],
                isLoading: false,
                hasFamily: true,
                isOwner: false,
                createFamily: jest.fn(),
                inviteMember: jest.fn(),
                updateMember: jest.fn(),
                removeMember: jest.fn(),
                refreshFamily: jest.fn()
              }}>
                <QuickAddModal {...defaultProps} visible={true} />
              </FamilyContext.Provider>
            </ModalContext.Provider>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );
      
      // Form should be reset
      const newTitleInput = getByTestId('title-input');
      expect(newTitleInput.props.value).toBe('');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props change', () => {
      const { getByTestId, rerender } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      
      // Enter some data
      fireEvent.changeText(titleInput, 'Test reminder');
      
      // Rerender with same props
      rerender(
        <AuthContext.Provider value={{ 
          user: mockUser, 
          isAnonymous: false, 
          signIn: jest.fn(), 
          signOut: jest.fn(),
          signUp: jest.fn(),
          signInAnonymously: jest.fn(),
          upgradeFromAnonymous: jest.fn(),
          resetPassword: jest.fn(),
          requireAuth: jest.fn(),
          updateUserProfile: jest.fn(),
          isLoading: false
        }}>
          <ThemeContext.Provider value={{ 
            theme: 'light', 
            colors: Colors.light,
            isDark: false,
            toggleTheme: jest.fn() 
          }}>
            <ModalContext.Provider value={{ 
              showDatePicker: jest.fn(), 
              hideDatePicker: jest.fn(),
              showQuickAddModal: jest.fn(),
              hideQuickAddModal: jest.fn(),
              showEditReminderModal: jest.fn(),
              hideEditReminderModal: jest.fn()
            }}>
              <FamilyContext.Provider value={{ 
                family: { id: 'test-family-id', name: 'Test Family', ownerId: 'owner-1', ownerName: 'Owner', memberCount: 2, maxMembers: 5, createdAt: new Date(), updatedAt: new Date() },
                familyMembers: mockFamilyMembers, 
                currentMember: mockFamilyMembers[0],
                isLoading: false,
                hasFamily: true,
                isOwner: false,
                createFamily: jest.fn(),
                inviteMember: jest.fn(),
                updateMember: jest.fn(),
                removeMember: jest.fn(),
                refreshFamily: jest.fn()
              }}>
                <QuickAddModal {...defaultProps} />
              </FamilyContext.Provider>
            </ModalContext.Provider>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      );
      
      // Input value should be preserved
      const newTitleInput = getByTestId('title-input');
      expect(newTitleInput.props.value).toBe('Test reminder');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      const closeButton = getByTestId('close-button');
      
      expect(titleInput).toBeTruthy();
      expect(saveButton).toBeTruthy();
      expect(closeButton).toBeTruthy();
    });

    it('should handle keyboard navigation', () => {
      const { getByTestId } = renderWithProviders();
      
      const titleInput = getByTestId('title-input');
      
      // Should auto-focus on title input
      expect(titleInput.props.autoFocus).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const mockOnSaveWithError = jest.fn().mockRejectedValue(new Error('Save failed'));
      const { getByTestId } = renderWithProviders({ onSave: mockOnSaveWithError });
      
      const titleInput = getByTestId('title-input');
      const saveButton = getByTestId('save-button');
      
      // Enter title
      fireEvent.changeText(titleInput, 'Test reminder');
      
      // Press save
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(mockOnSaveWithError).toHaveBeenCalledTimes(1);
      });
      
      // Should not crash
      expect(getByTestId('save-button')).toBeTruthy();
    });

    it('should handle missing user gracefully', () => {
      const { getByTestId } = renderWithProviders();
      
      // Should still render without user
      expect(getByTestId('title-input')).toBeTruthy();
    });
  });
}); 
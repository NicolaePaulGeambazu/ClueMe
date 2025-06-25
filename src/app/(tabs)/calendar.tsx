import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const styles = createStyles(colors);

  const handleDatePress = (date: Date) => {
    const viewDateAction = () => {
      console.log('Viewing date:', date);
    };

    guardAction(viewDateAction);
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(() => {
      console.log('Calendar access granted');
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAnonymous && (
          <View style={styles.anonymousNotice}>
            <Text style={styles.noticeText}>
              Sign in to view your complete calendar with all saved reminders and events.
            </Text>
          </View>
        )}

        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateMonth('prev')}
            >
              <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {getMonthName(currentDate)}
            </Text>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateMonth('next')}
            >
              <ChevronRight size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarPlaceholder}>
            <Calendar size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.placeholderTitle}>Calendar View</Text>
            <Text style={styles.placeholderDescription}>
              {isAnonymous 
                ? 'Sign in to see your reminders in calendar format'
                : 'Your reminders will appear here'
              }
            </Text>
            
            {isAnonymous && (
              <TouchableOpacity 
                style={styles.signInButton}
                onPress={() => setShowLoginPrompt(true)}
              >
                <Text style={styles.signInButtonText}>Sign In to View Calendar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title="Calendar Access"
        message="Sign in to view your complete calendar with all saved reminders and events."
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  anonymousNotice: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  monthTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  calendarPlaceholder: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  placeholderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signInButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';;
import { Search, Filter, Star, Clock, CheckCircle, AlertCircle, X } from 'lucide-react-native';

export default function SearchScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const styles = createStyles(colors);

  const handleSearch = () => {
    const searchAction = () => {
      // Mock search - replace with actual API call
      console.log('Searching for:', searchQuery);
      setSearchResults([
        { id: 1, title: 'Sample Reminder 1', description: 'This is a sample reminder' },
        { id: 2, title: 'Sample Reminder 2', description: 'Another sample reminder' },
      ]);
    };

    if (searchQuery.trim()) {
      guardAction(searchAction);
    }
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(handleSearch);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textTertiary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reminders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAnonymous && (
          <View style={styles.anonymousNotice}>
            <Text style={styles.noticeText}>
              Sign in to search through all your saved reminders and access advanced search features.
            </Text>
          </View>
        )}

        {searchResults.length > 0 ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            {searchResults.map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <Text style={styles.resultTitle}>{result.title}</Text>
                <Text style={styles.resultDescription}>{result.description}</Text>
              </View>
            ))}
          </View>
        ) : searchQuery.length > 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search terms or check your spelling.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start searching</Text>
            <Text style={styles.emptyDescription}>
              Enter keywords to find your reminders quickly.
            </Text>
          </View>
        )}
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title="Search Reminders"
        message="Sign in to search through all your saved reminders and access advanced search features."
      />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  resultsSection: {
    marginTop: 24,
  },
  resultsTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  resultDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
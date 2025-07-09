import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit, Trash2, CheckSquare, Hash, List as ListIcon, Star, FileText, Search, Lock, ChevronRight, X, Users } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../hooks/useFamily';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { listService, UserList } from '../services/firebaseService';
import { useTranslation } from 'react-i18next';
import QuickAddListModal from '../components/lists/QuickAddListModal';

export default function ListsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { family } = useFamily();
  const [lists, setLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [listFilter, setListFilter] = useState<'my' | 'shared'>('my');

  const styles = createStyles(colors);

  // Debug log only when relevant data changes
  useEffect(() => {
    if (__DEV__) {
      console.log({
        isLoading,
        listsCount: lists.length,
        searchQuery,
        error
      });
    }
  }, [isLoading, lists, searchQuery, error]);

  // Split lists into myLists and sharedLists
  const myLists = React.useMemo(() => lists.filter(list => list.createdBy === user?.uid), [lists, user?.uid]);
  const sharedLists = React.useMemo(() => lists.filter(list => list.createdBy !== user?.uid), [lists, user?.uid]);

  // Filtered lists based on filter and search
  const filteredLists = React.useMemo(() => {
    const base = listFilter === 'my' ? myLists : sharedLists;
    if (!searchQuery) return base;
    return base.filter(list =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [listFilter, myLists, sharedLists, searchQuery]);

  // Error/empty state component
  const ErrorState = () => (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ color: colors.error, fontFamily: Fonts.text.semibold, fontSize: 16 }}>
        {t('common.error')}: {error}
      </Text>
    </View>
  );

  // Load lists
  const loadLists = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    setIsLoading(true);
    try {
      const userLists = await listService.getUserLists(user.uid);
      setLists(userLists);
    } catch (error) {
      Alert.alert('Error', 'Failed to load lists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Load lists on mount and when user changes
  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Set up real-time listener for lists
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    try {
      const unsubscribe = listService.onUserListsChange(user.uid, (userLists) => {
        setLists(userLists);
      });

      // Force a manual check after 2 seconds to see if listener works
      setTimeout(() => {
        // This will trigger the listener callback if it's working
      }, 2000);

      return () => {
        unsubscribe();
      };
    } catch (error) {
    }
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadLists();
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  }, [loadLists]);

  const getListStats = (list: UserList) => {
    const total = list.items.length;
    const completed = list.items.filter(item => item.completed).length;
    return { total, completed };
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'checkmark': return CheckSquare;
      case 'line': return ListIcon;
      case 'number': return Hash;
      case 'plain': return FileText;
      default: return CheckSquare;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'checkmark': return 'Checkmarks';
      case 'line': return 'Lines';
      case 'number': return 'Numbers';
      case 'plain': return 'Plain Text';
      default: return 'Checkmarks';
    }
  };

  const handleListPress = (list: UserList) => {
    navigation.navigate('ListDetail', { listId: list.id });
  };

  const handleCreateList = async (listData: { name: string; description?: string; format: string; isPrivate: boolean }) => {
    if (!user?.uid) {return;}
    setActionLoading(true);
    setError(null);
    try {
      const listId = await listService.createList({
        name: listData.name,
        description: listData.description,
        format: listData.format as any,
        isPrivate: listData.isPrivate,
        isFavorite: false,
        createdBy: user.uid,
        familyId: family?.id || null,
      });
      
      // The listener will automatically update the lists
      
      setIsCreateModalVisible(false);
    } catch (err: any) {
      setError(t('common.error') + ': ' + (err && err.message ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditList = (list: UserList) => {
    setEditingList(list);
    setIsCreateModalVisible(true);
  };

  const handleUpdateList = async (listData: any) => {
    if (!editingList) {return;}
    setActionLoading(true);
    setError(null);
    try {
      await listService.updateList(editingList.id, {
        name: listData.name,
        description: listData.description,
        format: listData.format,
        isPrivate: listData.isPrivate,
      });
      
      // The listener will automatically update the lists
      
      setIsCreateModalVisible(false);
      setEditingList(null);
    } catch (err: any) {
      setError(t('common.error') + ': ' + (err && err.message ? err.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteList = (list: UserList) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setError(null);
            try {
              await listService.deleteList(list.id);
              
              // The listener will automatically update the lists
            } catch (err: any) {
              setError(t('common.error') + ': ' + (err && err.message ? err.message : 'Unknown error'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (list: UserList) => {
    try {
      await listService.updateList(list.id, {
        isFavorite: !list.isFavorite,
      });
      
      // The listener will automatically update the lists
    } catch (error) {
      Alert.alert('Error', 'Failed to update list. Please try again.');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('lists.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('lists.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: listFilter === 'my' ? colors.primary + '22' : 'transparent',
            paddingVertical: 10,
            borderRadius: 8,
            marginHorizontal: 8,
            alignItems: 'center',
          }}
          onPress={() => setListFilter('my')}
        >
          <Text style={{ color: listFilter === 'my' ? colors.primary : colors.textSecondary, fontFamily: Fonts.text.semibold }}>
            {t('lists.myLists') || 'My Lists'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: listFilter === 'shared' ? colors.primary + '22' : 'transparent',
            paddingVertical: 10,
            borderRadius: 8,
            marginHorizontal: 8,
            alignItems: 'center',
          }}
          onPress={() => setListFilter('shared')}
        >
          <Text style={{ color: listFilter === 'shared' ? colors.primary : colors.textSecondary, fontFamily: Fonts.text.semibold }}>
            {t('lists.sharedLists') || 'Shared Lists'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {searchQuery && (
          <View style={styles.searchContainer}>
            <Text style={styles.searchResults}>
              {filteredLists.length} {filteredLists.length === 1 ? t('lists.listView').toLowerCase() : t('lists.listView').toLowerCase() + 's'} found
            </Text>
          </View>
        )}

        <View style={styles.listsGrid}>
          {filteredLists.map((list) => {
            const stats = getListStats(list);
            const FormatIcon = getFormatIcon(list.format);

            return (
              <TouchableOpacity
                key={list.id}
                style={styles.listCard}
                onPress={() => handleListPress(list)}
              >
                <View style={styles.listHeader}>
                  <View style={[styles.listIcon, { backgroundColor: colors.primary + '15' }]}>
                    <FormatIcon size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.listTitleContainer}>
                    <Text style={styles.listTitle}>{list.name}</Text>
                    <View style={styles.listIndicators}>
                      {list.isPrivate && (
                        <Lock size={14} color={colors.textSecondary} />
                      )}
                      {!list.isPrivate && list.createdBy !== user?.uid && (
                        <Text style={styles.sharedBadge}>{t('lists.shared')}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.listActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleToggleFavorite(list)}
                    >
                      <Star 
                        size={16} 
                        color={list.isFavorite ? colors.warning : colors.textSecondary} 
                        fill={list.isFavorite ? colors.warning : 'transparent'}
                      />
                    </TouchableOpacity>
                    {list.createdBy === user?.uid && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditList(list)}
                        >
                          <Edit size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteList(list)}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.listContent}>
                  {list.description && (
                    <Text style={styles.listDescription}>{list.description}</Text>
                  )}

                  <View style={styles.listStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{stats.total}</Text>
                      <Text style={styles.statLabel}>{t('lists.items')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.success }]}>{stats.completed}</Text>
                      <Text style={styles.statLabel}>{t('lists.done')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.formatLabel}>{getFormatLabel(list.format)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.listFooter}>
                  <ChevronRight size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredLists.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('lists.noListsSearch', { query: searchQuery }) : t('lists.noLists')}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? t('lists.tryDifferentSearch') : t('lists.noListsDescription')}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Plus size={20} color="white" />
                <Text style={styles.createButtonText}>{t('lists.createList')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>{t('lists.loadingLists')}</Text>
          </View>
        )}

        {error && <ErrorState />}
      </ScrollView>

      {/* Quick Add/Edit List Modal */}
      <QuickAddListModal
        visible={isCreateModalVisible}
        onClose={() => {
          setIsCreateModalVisible(false);
          setEditingList(null);
        }}
        onSave={editingList ? handleUpdateList : handleCreateList}
        editingList={editingList}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 28,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBarFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: Fonts.text.regular,
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listsGrid: {
    gap: 16,
    paddingTop: 8,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  listIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sharedBadge: {
    fontFamily: Fonts.text.medium,
    fontSize: 10,
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  listContent: {
    marginBottom: 16,
  },
  listDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  listStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: Fonts.text.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formatLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listFooter: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: 'white',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },

});

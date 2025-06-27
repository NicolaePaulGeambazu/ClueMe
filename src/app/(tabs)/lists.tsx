import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, Plus, Edit, Trash2, Search, Filter, ChevronRight, CheckSquare, Hash, List as ListIcon, FileText, Lock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { listService, UserList, familyService } from '../../services/firebaseService';

export default function ListsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'checkmark' | 'line' | 'number' | 'plain'>('checkmark');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  
  const styles = createStyles(colors);

  // Load lists
  const loadLists = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user, skipping lists load');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Loading lists...');
      const userLists = await listService.getUserLists(user.uid);
      console.log(`✅ Loaded ${userLists.length} lists`);
      setLists(userLists);
    } catch (error) {
      console.error('❌ Error loading lists:', error);
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
    if (!user?.uid) return;

    console.log('👂 Setting up lists listener...');
    const unsubscribe = listService.onUserListsChange(user.uid, (userLists) => {
      console.log('📡 Lists updated via listener:', userLists.length);
      setLists(userLists);
    });

    return () => {
      console.log('🔇 Cleaning up lists listener...');
      unsubscribe();
    };
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadLists();
    } catch (error) {
      console.error('Error refreshing:', error);
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

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create a list');
      return;
    }

    try {
      console.log('🔄 Creating new list...');
      
      // Get user's family if the list is not private
      let familyId: string | undefined;
      if (!isPrivate) {
        try {
          const userFamily = await familyService.getUserFamily(user.uid);
          if (userFamily) {
            familyId = userFamily.id;
            console.log('👨‍👩‍👧‍👦 List will be shared with family:', userFamily.name);
          } else {
            console.log('⚠️ No family found, list will be private');
            // If no family found, make the list private
            setIsPrivate(true);
          }
        } catch (error) {
          console.warn('⚠️ Could not get user family:', error);
          // If error getting family, make the list private
          setIsPrivate(true);
        }
      }
      
      await listService.createList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
        format: selectedFormat,
        isFavorite: false,
        isPrivate: isPrivate,
        familyId: familyId || undefined,
        createdBy: user.uid,
      });
      
      console.log('✅ List created successfully');
      setNewListName('');
      setNewListDescription('');
      setSelectedFormat('checkmark');
      setIsPrivate(false);
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('❌ Error creating list:', error);
      Alert.alert('Error', 'Failed to create list. Please try again.');
    }
  };

  const handleEditList = (list: UserList) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setSelectedFormat(list.format);
    setIsPrivate(list.isPrivate);
    setIsCreateModalVisible(true);
  };

  const handleUpdateList = async () => {
    if (!editingList || !newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to update a list');
      return;
    }

    try {
      console.log('🔄 Updating list...');
      
      // Get user's family if the list is not private
      let familyId: string | undefined;
      if (!isPrivate) {
        try {
          const userFamily = await familyService.getUserFamily(user.uid);
          if (userFamily) {
            familyId = userFamily.id;
            console.log('👨‍👩‍👧‍👦 List will be shared with family:', userFamily.name);
          } else {
            console.log('⚠️ No family found, list will be private');
            // If no family found, make the list private
            setIsPrivate(true);
          }
        } catch (error) {
          console.warn('⚠️ Could not get user family:', error);
          // If error getting family, make the list private
          setIsPrivate(true);
        }
      }
      
      await listService.updateList(editingList.id, {
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
        format: selectedFormat,
        isPrivate: isPrivate,
        familyId: familyId || undefined,
      });
      
      console.log('✅ List updated successfully');
      setNewListName('');
      setNewListDescription('');
      setSelectedFormat('checkmark');
      setIsPrivate(false);
      setEditingList(null);
      setIsCreateModalVisible(false);
    } catch (error) {
      console.error('❌ Error updating list:', error);
      Alert.alert('Error', 'Failed to update list. Please try again.');
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
            try {
              console.log('🔄 Deleting list...');
              await listService.deleteList(list.id);
              console.log('✅ List deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting list:', error);
              Alert.alert('Error', 'Failed to delete list. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (list: UserList) => {
    try {
      console.log('🔄 Toggling favorite...');
      await listService.updateList(list.id, {
        isFavorite: !list.isFavorite,
      });
      console.log('✅ Favorite toggled successfully');
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update list. Please try again.');
    }
  };

  const filteredLists = lists.filter(list => {
    if (searchQuery) {
      return list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lists</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
              {filteredLists.length} list{filteredLists.length !== 1 ? 's' : ''} found
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
                        <Text style={styles.sharedBadge}>Shared</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.listActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleToggleFavorite(list)}
                    >
                      <Text style={[styles.favoriteIcon, { color: list.isFavorite ? colors.warning : colors.textSecondary }]}>
                        ★
                      </Text>
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
                      <Text style={styles.statLabel}>Items</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.success }]}>{stats.completed}</Text>
                      <Text style={styles.statLabel}>Done</Text>
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
            <Text style={styles.emptyTitle}>No lists found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery 
                ? `No lists match "${searchQuery}"`
                : 'Create your first list to get started'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.createButtonText}>Create List</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading lists...</Text>
          </View>
        )}
      </ScrollView>

      {/* Create/Edit List Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsCreateModalVisible(false);
          setEditingList(null);
          setNewListName('');
          setNewListDescription('');
          setSelectedFormat('checkmark');
          setIsPrivate(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setIsCreateModalVisible(false);
                setEditingList(null);
                setNewListName('');
                setNewListDescription('');
                setSelectedFormat('checkmark');
                setIsPrivate(false);
              }}
            >
              <Text style={[styles.modalButton, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingList ? 'Edit List' : 'Create List'}
            </Text>
            <TouchableOpacity 
              onPress={editingList ? handleUpdateList : handleCreateList}
            >
              <Text style={[styles.modalButton, { color: colors.primary }]}>
                {editingList ? 'Save' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>List Name</Text>
              <TextInput
                style={[styles.textInput, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text 
                }]}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="Enter list name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textArea, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text 
                }]}
                value={newListDescription}
                onChangeText={setNewListDescription}
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>List Format (Optional)</Text>
              <View style={styles.formatOptions}>
                {[
                  { value: 'checkmark', label: 'Checkmarks', icon: CheckSquare },
                  { value: 'line', label: 'Lines', icon: ListIcon },
                  { value: 'number', label: 'Numbers', icon: Hash },
                  { value: 'plain', label: 'Plain Text', icon: FileText },
                ].map((format) => {
                  const IconComponent = format.icon;
                  const isSelected = selectedFormat === format.value;
                  
                  return (
                    <TouchableOpacity
                      key={format.value}
                      style={[
                        styles.formatOption,
                        { 
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                        }
                      ]}
                      onPress={() => setSelectedFormat(format.value as any)}
                    >
                      <IconComponent 
                        size={20} 
                        color={isSelected ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.formatOptionText,
                        { color: isSelected ? colors.primary : colors.text }
                      ]}>
                        {format.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Privacy</Text>
              <View style={styles.privacyToggle}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    { 
                      borderColor: !isPrivate ? colors.primary : colors.border,
                      backgroundColor: !isPrivate ? colors.primary + '15' : colors.surface,
                    }
                  ]}
                  onPress={() => setIsPrivate(false)}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    { color: !isPrivate ? colors.primary : colors.text }
                  ]}>
                    Shared with Family
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    { 
                      borderColor: isPrivate ? colors.primary : colors.border,
                      backgroundColor: isPrivate ? colors.primary + '15' : colors.surface,
                    }
                  ]}
                  onPress={() => setIsPrivate(true)}
                >
                  <Text style={[
                    styles.privacyOptionText,
                    { color: isPrivate ? colors.primary : colors.text }
                  ]}>
                    Private (Owner Only)
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.privacyDescription}>
                {isPrivate 
                  ? 'Only you can see this list' 
                  : 'Family members can view this list'
                }
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  searchResults: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  listsGrid: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
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
    gap: 6,
  },
  actionButton: {
    padding: 6,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  listContent: {
    marginBottom: 12,
  },
  listDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  listStats: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'flex-start',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.text.bold,
    fontSize: 18,
    color: colors.text,
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
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: Fonts.text.bold,
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
    marginBottom: 24,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 18,
    color: colors.text,
  },
  modalButton: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts.text.regular,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts.text.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatOption: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  formatOptionText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    flex: 1,
  },
  privacyToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyOption: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  privacyOptionText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  privacyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
}); 
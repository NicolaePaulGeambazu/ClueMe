import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit, Trash2, CheckSquare, Hash, List as ListIcon, Star, FileText, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { listService, UserList, ListItem } from '../../services/firebaseService';

export default function ListDetailScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { list: initialList } = route.params;
  
  // Convert Date objects from route params to proper Date instances
  const [list, setList] = useState<UserList>(() => {
    if (initialList) {
      return {
        ...initialList,
        createdAt: initialList.createdAt instanceof Date ? initialList.createdAt : new Date(initialList.createdAt),
        updatedAt: initialList.updatedAt instanceof Date ? initialList.updatedAt : new Date(initialList.updatedAt),
        items: initialList.items?.map((item: any) => ({
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
        })) || [],
      };
    }
    return initialList;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  
  const styles = createStyles(colors);

  // Load list details
  const loadListDetails = useCallback(async () => {
    if (!list.id) return;

    setIsLoading(true);
    try {
      console.log('🔄 Loading list details...');
      const listDetails = await listService.getListById(list.id);
      if (listDetails) {
        setList(listDetails);
      }
    } catch (error) {
      console.error('❌ Error loading list details:', error);
      Alert.alert('Error', 'Failed to load list details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [list.id]);

  // Load list details on mount
  useEffect(() => {
    loadListDetails();
  }, [loadListDetails]);

  // Set up real-time listener for this specific list
  useEffect(() => {
    if (!list.id) return;

    console.log('👂 Setting up list detail listener...');
    const unsubscribe = listService.onListChange(list.id, (updatedList) => {
      console.log('📡 List updated via listener:', updatedList.name);
      setList(updatedList);
    });

    return () => {
      console.log('🔇 Cleaning up list detail listener...');
      unsubscribe();
    };
  }, [list.id]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadListDetails();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadListDetails]);

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

  const handleToggleItem = async (item: ListItem) => {
    try {
      console.log('🔄 Toggling item completion...', { itemId: item.id, currentCompleted: item.completed });
      await listService.updateListItem(list.id, item.id, {
        completed: !item.completed,
      });
      console.log('✅ Item toggled successfully');
    } catch (error) {
      console.error('❌ Error toggling item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Error', 'Please enter an item title');
      return;
    }

    try {
      console.log('🔄 Adding new item...');
      await listService.addListItem(list.id, {
        title: newItemTitle.trim(),
        description: newItemDescription.trim() || undefined,
        completed: false,
        format: list.format,
        sortOrder: list.items.length + 1,
      });
      
      console.log('✅ Item added successfully');
      setNewItemTitle('');
      setNewItemDescription('');
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('❌ Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleEditItem = (item: ListItem) => {
    setEditingItem(item);
    setNewItemTitle(item.title);
    setNewItemDescription(item.description || '');
    setIsAddModalVisible(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemTitle.trim()) {
      Alert.alert('Error', 'Please enter an item title');
      return;
    }

    try {
      console.log('🔄 Updating item...');
      await listService.updateListItem(list.id, editingItem.id, {
        title: newItemTitle.trim(),
        description: newItemDescription.trim() || undefined,
      });
      
      console.log('✅ Item updated successfully');
      setNewItemTitle('');
      setNewItemDescription('');
      setEditingItem(null);
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('❌ Error updating item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = (item: ListItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Deleting item...');
              await listService.deleteListItem(list.id, item.id);
              console.log('✅ Item deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = (item: ListItem, index: number) => {
    const IconComponent = getFormatIcon(list.format);
    
    return (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            {list.format === 'number' && (
              <View style={[styles.numberBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
            )}
            {list.format === 'checkmark' && (
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  {
                    borderColor: item.completed ? colors.success : colors.border,
                    backgroundColor: item.completed ? colors.success : 'transparent',
                  }
                ]}
                onPress={() => handleToggleItem(item)}
              >
                {item.completed && <Check size={16} color="white" />}
              </TouchableOpacity>
            )}
            {list.format === 'line' && (
              <View style={[styles.lineIndicator, { backgroundColor: colors.primary }]} />
            )}
            {list.format === 'plain' && (
              <View style={[styles.plainIndicator, { backgroundColor: colors.textSecondary }]} />
            )}
          </View>
          
          <View style={styles.itemContent}>
            <Text style={[
              styles.itemTitle,
              { 
                color: item.completed ? colors.textSecondary : colors.text,
                textDecorationLine: item.completed ? 'line-through' : 'none'
              }
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[
                styles.itemDescription,
                { color: item.completed ? colors.textSecondary : colors.textSecondary }
              ]}>
                {item.description}
              </Text>
            )}
          </View>
          
          <View style={styles.itemActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditItem(item)}
            >
              <Edit size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteItem(item)}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const sortedItems = [...list.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.listTitle}>{list.name}</Text>
          {list.description && (
            <Text style={styles.listDescription}>{list.description}</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
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
        <View style={styles.listInfo}>
          <View style={styles.formatInfo}>
            {(() => {
              const IconComponent = getFormatIcon(list.format);
              return <IconComponent size={20} color={colors.primary} />;
            })()}
            <Text style={styles.formatText}>{getFormatLabel(list.format)}</Text>
          </View>
          
          <View style={styles.statsInfo}>
            <Text style={styles.statsText}>
              {list.items.filter(item => item.completed).length} of {list.items.length} completed
            </Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {sortedItems.map((item, index) => renderItem(item, index))}
        </View>

        {sortedItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first item to get started
            </Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.createButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsAddModalVisible(false);
          setEditingItem(null);
          setNewItemTitle('');
          setNewItemDescription('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setIsAddModalVisible(false);
                setEditingItem(null);
                setNewItemTitle('');
                setNewItemDescription('');
              }}
            >
              <Text style={[styles.modalButton, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>
            <TouchableOpacity 
              onPress={editingItem ? handleUpdateItem : handleAddItem}
            >
              <Text style={[styles.modalButton, { color: colors.primary }]}>
                {editingItem ? 'Save' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Title</Text>
              <TextInput
                style={[styles.textInput, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text 
                }]}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                placeholder="Enter item title"
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
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  listTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.text,
  },
  listDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsInfo: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemsList: {
    gap: 12,
    paddingVertical: 16,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeft: {
    marginRight: 12,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: Fonts.text.bold,
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  plainIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    marginBottom: 4,
  },
  itemDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
}); 
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, X, Calendar, Clock, MapPin, Tag, Star } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Plus } from 'lucide-react-native';

export default function AddScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  const { createReminder, useFirebase } = useReminders();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as 'task' | 'bill' | 'med' | 'event' | 'note',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    dueTime: '',
    location: '',
    tags: [] as string[],
    isFavorite: false,
    hasNotification: true,
    isRecurring: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const styles = createStyles(colors);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Missing Information', 'Please enter a title for your reminder');
      return;
    }

    const saveAction = async () => {
      setIsLoading(true);
      try {
        await createReminder({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
          dueTime: formData.dueTime || undefined,
          location: formData.location.trim() || undefined,
          completed: false,
          isFavorite: formData.isFavorite,
          isRecurring: formData.isRecurring,
          hasNotification: formData.hasNotification,
          tags: formData.tags,
          userId: user!.uid,
        });
        
        const storageType = useFirebase ? 'Firebase' : 'local storage';
        Alert.alert('Success', `Reminder saved successfully to ${storageType}!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (error) {
        console.error('Error saving reminder:', error);
        Alert.alert('Error', 'Failed to save reminder. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    guardAction(saveAction);
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(handleSave);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const typeOptions = [
    { id: 'task', label: 'Task', emoji: '✓', color: colors.primary },
    { id: 'bill', label: 'Bill', emoji: '💳', color: colors.error },
    { id: 'med', label: 'Medicine', emoji: '💊', color: colors.success },
    { id: 'event', label: 'Event', emoji: '📅', color: colors.secondary },
    { id: 'note', label: 'Note', emoji: '📝', color: colors.warning },
  ];

  const priorityOptions = [
    { id: 'low', label: 'Low', color: colors.success },
    { id: 'medium', label: 'Medium', color: colors.warning },
    { id: 'high', label: 'High', color: colors.error },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <X size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Reminder</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!formData.title.trim() || isLoading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!formData.title.trim() || isLoading}
        >
          <Save size={20} color={formData.title.trim() && !isLoading ? colors.primary : colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAnonymous && (
          <View style={styles.anonymousNotice}>
            <Text style={styles.noticeText}>
              You're using ClearCue anonymously. Sign in to save your reminders permanently and sync across devices.
            </Text>
          </View>
        )}

        {!isAnonymous && (
          <View style={styles.storageNotice}>
            <Text style={styles.storageText}>
              {useFirebase 
                ? '📱 Saving to Firebase (cloud sync enabled)'
                : '💾 Saving to local storage (Firebase unavailable)'
              }
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="What do you need to remember?"
              value={formData.title}
              onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.typeGrid}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.typeOption,
                    formData.type === option.id && { backgroundColor: option.color + '15', borderColor: option.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: option.id as any }))}
                >
                  <Text style={styles.typeEmoji}>{option.emoji}</Text>
                  <Text style={[styles.typeLabel, formData.type === option.id && { color: option.color }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.priorityOption,
                    formData.priority === option.id && { backgroundColor: option.color + '15', borderColor: option.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priority: option.id as any }))}
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text style={[styles.priorityLabel, formData.priority === option.id && { color: option.color }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.inputContainer}>
                <Calendar size={20} color={colors.textTertiary} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.dueDate}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, dueDate: value }))}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.inputContainer}>
                <Clock size={20} color={colors.textTertiary} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={formData.dueTime}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, dueTime: value }))}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                value={formData.location}
                onChangeText={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Add description..."
              value={formData.description}
              onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <Tag size={20} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag..."
                value={newTag}
                onChangeText={setNewTag}
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={addTag}
                disabled={!newTag.trim()}
              >
                <Plus size={16} color={newTag.trim() ? colors.primary : colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tagChip}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <X size={12} color={colors.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Star size={20} color={colors.warning} strokeWidth={2} />
                <Text style={styles.switchLabel}>Mark as favorite</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleButton, formData.isFavorite && styles.toggleButtonActive]}
                onPress={() => setFormData(prev => ({ ...prev, isFavorite: !prev.isFavorite }))}
              >
                <View style={[styles.toggleDot, formData.isFavorite && styles.toggleDotActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title="Save Reminder"
        message="Sign in to save your reminders permanently and sync across devices."
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
  },
  saveButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  anonymousNotice: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  storageNotice: {
    backgroundColor: colors.secondary + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  storageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
  form: {
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  titleInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 60,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  priorityLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
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
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  descriptionInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  tagInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  addTagButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  toggleDotActive: {
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 20 }],
  },
});
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Switch } from 'react-native';
import { useFamily } from '../../hooks/useFamily';
import CategorySelector, { DEFAULT_CATEGORIES, ReminderCategory } from './CategorySelector';
import { CustomDateTimePickerModal } from '../ReminderForm/CustomDateTimePicker';
import { RepeatModal } from '../ReminderForm/RepeatModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, Bell, Repeat, Users } from 'lucide-react-native';
import InterstitialAdTrigger from '../ads/InterstitialAdTrigger';
// Placeholder: import BottomSheet from '@gorhom/bottom-sheet' or your preferred bottom sheet library
// import BottomSheet from '@gorhom/bottom-sheet';

export const AddReminderBottomSheet = () => {
  // State
  const [title, setTitle] = React.useState('');
  const [subTasks, setSubTasks] = React.useState<string[]>([]);
  const [category, setCategory] = React.useState<ReminderCategory>(DEFAULT_CATEGORIES[0]);
  const [assignees, setAssignees] = React.useState<string[]>([]);
  const [dateTime, setDateTime] = React.useState<Date | null>(null);
  const [showDateTimeModal, setShowDateTimeModal] = React.useState(false);
  const [showRepeatModal, setShowRepeatModal] = React.useState(false);
  const [repeatConfig, setRepeatConfig] = React.useState<any>(null);
  const [notificationEnabled, setNotificationEnabled] = React.useState(true);
  const [reminderAdded, setReminderAdded] = React.useState(false);

  // Theme/colors
  const { colors } = useTheme();

  // Get real family members
  const { members: familyMembers } = useFamily();

  // Handlers
  const handleAddSubTask = () => setSubTasks([...subTasks, '']);
  const handleSubTaskChange = (text: string, idx: number) => {
    const updated = [...subTasks];
    updated[idx] = text;
    setSubTasks(updated);
  };
  const handleRemoveSubTask = (idx: number) => {
    const updated = [...subTasks];
    updated.splice(idx, 1);
    setSubTasks(updated);
  };
  const handleToggleAssignee = (id: string) => {
    setAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleAddReminder = () => {
    // TODO: Add actual reminder creation logic here
    console.log('Adding reminder:', { title, category, dateTime, repeatConfig, assignees });
    
    // Trigger interstitial ad after successful reminder creation
    setReminderAdded(true);
    
    // Reset form
    setTitle('');
    setSubTasks([]);
    setCategory(DEFAULT_CATEGORIES[0]);
    setAssignees([]);
    setDateTime(null);
    setRepeatConfig(null);
    setNotificationEnabled(true);
  };

  return (
    // <BottomSheet ...> // Uncomment and configure with your bottom sheet library
    <View style={styles.sheet}>
      {/* Main Input */}
      <TextInput
        style={styles.input}
        placeholder="Input new task here"
        value={title}
        onChangeText={setTitle}
      />
      {/* Sub-tasks */}
      <FlatList
        data={subTasks}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.subTaskRow}>
            <TextInput
              style={styles.subTaskInput}
              placeholder="Input the sub-task"
              value={item}
              onChangeText={text => handleSubTaskChange(text, index)}
            />
            <TouchableOpacity onPress={() => handleRemoveSubTask(index)}>
              <Text style={styles.removeSubTask}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity onPress={handleAddSubTask} style={styles.addSubTaskBtn}>
            <Text style={styles.addSubTaskText}>+ Add Sub-task</Text>
          </TouchableOpacity>
        }
      />
      {/* Category Selector */}
      <CategorySelector value={category} onChange={setCategory} />
      {/* Quick Action Bar */}
      <View style={styles.quickBar}>
        {/* Date/Time */}
        <TouchableOpacity onPress={() => setShowDateTimeModal(true)} style={styles.quickBtn}>
          <Calendar color={dateTime ? colors.primary : colors.textSecondary} size={22} />
          <Text style={[styles.quickBtnText, { color: dateTime ? colors.primary : colors.textSecondary }]}>Date/Time</Text>
        </TouchableOpacity>
        {/* Notification */}
        <View style={styles.quickBtn}>
          <Bell color={notificationEnabled ? colors.primary : colors.textSecondary} size={22} />
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            thumbColor={notificationEnabled ? colors.primary : '#ccc'}
            trackColor={{ true: colors.primary + '44', false: '#ccc' }}
            style={{ marginLeft: 4 }}
          />
        </View>
        {/* Repeat */}
        <TouchableOpacity onPress={() => setShowRepeatModal(true)} style={styles.quickBtn}>
          <Repeat color={repeatConfig ? colors.primary : colors.textSecondary} size={22} />
          <Text style={[styles.quickBtnText, { color: repeatConfig ? colors.primary : colors.textSecondary }]}>Repeat</Text>
        </TouchableOpacity>
        {/* Assign To (scrolls to assign section) */}
        <TouchableOpacity style={styles.quickBtn}>
          <Users color={assignees.length > 0 ? colors.primary : colors.textSecondary} size={22} />
          <Text style={[styles.quickBtnText, { color: assignees.length > 0 ? colors.primary : colors.textSecondary }]}>Assign</Text>
        </TouchableOpacity>
      </View>
      {/* Assign To (inline, real data) */}
      {familyMembers && familyMembers.length > 1 && (
        <View style={styles.assignToRow}>
          <Text style={styles.assignToLabel}>Assign to:</Text>
          {familyMembers.map(member => (
            <TouchableOpacity
              key={member.userId || member.id}
              style={[styles.assigneeBtn, assignees.includes(member.userId || member.id) && styles.assigneeSelected]}
              onPress={() => handleToggleAssignee(member.userId || member.id)}
            >
              <Text>{member.name || member.email || 'Family Member'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Primary Action Button */}
      <TouchableOpacity style={styles.addBtn} onPress={handleAddReminder}>
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>

      {/* Interstitial Ad Trigger - Shows after reminder creation (temporarily disabled) */}
      {/* <InterstitialAdTrigger
        triggerOnAction={true}
        actionCompleted={reminderAdded}
        onAdShown={() => setReminderAdded(false)}
        onAdFailed={() => setReminderAdded(false)}
      /> */}
      {/* Date/Time Picker Modal */}
      <CustomDateTimePickerModal
        visible={showDateTimeModal}
        onClose={() => setShowDateTimeModal(false)}
        onConfirm={date => { setDateTime(date); setShowDateTimeModal(false); }}
        initialDate={dateTime || new Date()}
        mode="datetime"
        colors={colors}
      />
      {/* Repeat Modal */}
      <RepeatModal
        visible={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        onConfirm={repeat => { setRepeatConfig(repeat); setShowRepeatModal(false); }}
        initialValue={repeatConfig}
      />
    </View>
    // </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  input: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    padding: 8,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  subTaskInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    padding: 6,
    fontSize: 16,
  },
  removeSubTask: {
    fontSize: 20,
    color: '#aaa',
    marginLeft: 8,
  },
  addSubTaskBtn: {
    marginTop: 5,
  },
  addSubTaskText: {
    color: '#007AFF',
    fontSize: 16,
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 8,
  },
  quickBtn: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  quickBtnText: {
    fontSize: 14,
    marginLeft: 2,
  },
  assignToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  assignToLabel: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  assigneeBtn: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  assigneeSelected: {
    backgroundColor: '#007AFF22',
  },
  addBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddReminderBottomSheet; 
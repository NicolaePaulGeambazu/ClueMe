import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

export interface ReminderCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: ReminderCategory[] = [
  { id: 'none', name: 'No Category', icon: '📋', color: '#B0BEC5' },
  { id: 'work', name: 'Work', icon: '💼', color: '#4F8EF7' },
  { id: 'personal', name: 'Personal', icon: '😊', color: '#FBC02D' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', color: '#8BC34A' },
  { id: 'health', name: 'Health', icon: '💪', color: '#E57373' },
  { id: 'school', name: 'School / Study', icon: '📚', color: '#9575CD' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#FF7043' },
  { id: 'bills', name: 'Bills / Finance', icon: '💵', color: '#009688' },
  { id: 'chores', name: 'Chores / Home', icon: '🏠', color: '#90A4AE' },
  { id: 'events', name: 'Events / Birthdays', icon: '🎉', color: '#FFB300' },
  { id: 'travel', name: 'Travel / Vacation', icon: '✈️', color: '#29B6F6' },
  { id: 'pets', name: 'Pets', icon: '🐾', color: '#A1887F' },
  { id: 'other', name: 'Other', icon: '🔖', color: '#BDBDBD' },
];

interface CategorySelectorProps {
  value: ReminderCategory;
  onChange: (cat: ReminderCategory) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.categoryBtn, { backgroundColor: value.color + '22' }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ fontSize: 18 }}>{value.icon}</Text>
        <Text style={[styles.categoryText, { color: value.color }]}>{value.name}</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <FlatList
              data={DEFAULT_CATEGORIES}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.categoryOption, { backgroundColor: item.color + '11' }]}
                  onPress={() => {
                    onChange(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <Text style={[styles.categoryText, { color: item.color, marginLeft: 8 }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  categoryText: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0006',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
});

export default CategorySelector; 
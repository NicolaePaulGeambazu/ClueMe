
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FluidContainer, FluidHeader, FluidList, FluidButton } from '../components/design-system';
import { useReminders } from '../hooks/useReminders';
import { formatDateUK } from '../utils/formatDateUK';

interface List {
  id: string;
  name: string;
  color: string;
  reminderCount: number;
  lastUpdated: Date;
}

const ListsFluid: React.FC = () => {
  const [lists, setLists] = useState<List[]>([]);
  const { reminders } = useReminders();

  useEffect(() => {
    // Mock data - replace with actual data fetching
    const mockLists: List[] = [
      {
        id: '1',
        name: 'Personal Tasks',
        color: '#007AFF',
        reminderCount: 12,
        lastUpdated: new Date(),
      },
      {
        id: '2',
        name: 'Work Projects',
        color: '#FF9500',
        reminderCount: 8,
        lastUpdated: new Date(Date.now() - 86400000),
      },
      {
        id: '3',
        name: 'Shopping',
        color: '#34C759',
        reminderCount: 5,
        lastUpdated: new Date(Date.now() - 172800000),
      },
      {
        id: '4',
        name: 'Health & Fitness',
        color: '#FF3B30',
        reminderCount: 3,
        lastUpdated: new Date(Date.now() - 259200000),
      },
    ];
    setLists(mockLists);
  }, []);

  const handleCreateList = () => {
    Alert.alert(
      'Create New List',
      'Enter a name for your new list',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create', style: 'default' },
      ]
    );
  };

  const handleListPress = (list: List) => {
    // Navigate to list detail
    console.log('Navigate to list:', list.name);
  };

  const handleDeleteList = (listId: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? All reminders in this list will be moved to "Personal Tasks".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLists(prev => prev.filter(list => list.id !== listId));
          },
        },
      ]
    );
  };

  const renderListItem = (list: List) => (
    <TouchableOpacity
      key={list.id}
      onPress={() => handleListPress(list)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: list.color,
              marginRight: 16,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000000',
              marginBottom: 4,
            }}>
              {list.name}
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#8E8E93',
            }}>
              {list.reminderCount} reminder{list.reminderCount !== 1 ? 's' : ''} • Updated {formatDateUK(list.lastUpdated)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteList(list.id)}
          style={{ padding: 8 }}
        >
          <Icon name="ellipsis-horizontal" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FluidContainer>
        <FluidHeader
          title="Lists"
          rightAction={{
            icon: 'add',
            onPress: handleCreateList,
          }}
        />
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: 20 }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#8E8E93',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              My Lists ({lists.length})
            </Text>
            
            {lists.map(renderListItem)}
            
            <FluidButton
              title="Create New List"
              onPress={handleCreateList}
              variant="secondary"
              icon="add-circle-outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </ScrollView>
      </FluidContainer>
    </SafeAreaView>
  );
};

export default ListsFluid;

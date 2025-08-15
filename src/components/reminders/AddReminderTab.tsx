import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

type TabParamList = {
  Home: undefined;
  Add: undefined;
  Lists: undefined;
  Settings: undefined;
};

type AddTabNavigationProp = BottomTabNavigationProp<TabParamList, 'Add'>;

export default function AddReminderTab() {
  const navigation = useNavigation<AddTabNavigationProp>();
  const { showQuickAddModal } = useModal();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [isFocused, setIsFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Show modal when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      showQuickAddModal();
      // Navigate back to Home tab immediately
      navigation.navigate('Home');
    }, [showQuickAddModal, navigation])
  );

  useEffect(() => {
    if (isFocused) {
      setShowModal(true);
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      {/* This screen is just a trigger - the modal is handled globally */}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

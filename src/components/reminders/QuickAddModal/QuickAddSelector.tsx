import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';

interface QuickAddSelectorProps {
  testID: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: any;
  styles: any;
}

export const QuickAddSelector: React.FC<QuickAddSelectorProps> = ({
  testID,
  icon,
  label,
  onPress,
  colors,
  styles,
}) => (
  <View style={styles.selectorContainer}>
    <TouchableOpacity
      testID={testID}
      style={[styles.selector, { borderColor: colors.borderLight }]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.selectorText, { color: colors.text }]}>
        {label}
      </Text>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  </View>
); 
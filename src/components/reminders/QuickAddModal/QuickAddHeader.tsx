import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface QuickAddHeaderProps {
  onClose: () => void;
  isEditing: boolean;
  colors: any;
  styles: any;
}

export const QuickAddHeader: React.FC<QuickAddHeaderProps> = ({
  onClose,
  isEditing,
  colors,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        testID="close-button"
        style={styles.closeButton} 
        onPress={onClose}
        activeOpacity={0.7}
      >
        <X size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {isEditing ? t('quickAdd.editReminder') : t('quickAdd.newReminder')}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}; 
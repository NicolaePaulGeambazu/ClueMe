import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface QuickAddFooterProps {
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
  isEditing: boolean;
  colors: any;
  styles: any;
}

export const QuickAddFooter: React.FC<QuickAddFooterProps> = ({
  onSave,
  isSaving,
  isDisabled,
  isEditing,
  colors,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        testID="save-button"
        style={[
          styles.createButton,
          { 
            backgroundColor: !isDisabled && !isSaving ? colors.primary : colors.borderLight,
            opacity: !isDisabled && !isSaving ? 1 : 0.6
          }
        ]}
        onPress={onSave}
        disabled={isDisabled || isSaving}
      >
        {isSaving ? (
          <>
            <ActivityIndicator size="small" color={colors.background} />
            <Text style={[
              styles.createButtonText,
              { color: colors.background }
            ]}>
              {t('common.saving')}
            </Text>
          </>
        ) : (
          <>
            <Check size={20} color={!isDisabled ? colors.background : colors.textTertiary} />
            <Text style={[
              styles.createButtonText,
              { color: !isDisabled ? colors.background : colors.textTertiary }
            ]}>
              {isEditing ? t('quickAdd.updateReminder') : t('quickAdd.createReminder')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}; 
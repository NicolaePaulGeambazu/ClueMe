import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X, Lightbulb, Plus, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface QuickAddHeaderProps {
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDisabled: boolean;
  isEditing: boolean;
  colors: any;
  styles: any;
}

export const QuickAddHeader: React.FC<QuickAddHeaderProps> = ({
  onClose,
  onSave,
  isSaving,
  isDisabled,
  isEditing,
  colors,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
        accessibilityRole="button"
      >
        <X size={24} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? t('quickAdd.editReminder') : t('quickAdd.newReminder')}
        </Text>
        <View style={styles.headerSubtitle}>
          <Lightbulb size={14} color={colors.textTertiary} />
          <Text style={[styles.headerSubtitleText, { color: colors.textTertiary }]}>
            {t('quickAdd.quickAddHint')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.closeButton,
          {
            backgroundColor: isDisabled ? colors.borderLight : colors.primary,
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
        onPress={onSave}
        disabled={isDisabled || isSaving}
        activeOpacity={0.8}
        accessibilityLabel={isEditing ? t('quickAdd.update') : t('quickAdd.create')}
        accessibilityRole="button"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            {isEditing ? (
              <Check size={20} color={colors.white} strokeWidth={2} />
            ) : (
              <Plus size={20} color={colors.white} strokeWidth={2} />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

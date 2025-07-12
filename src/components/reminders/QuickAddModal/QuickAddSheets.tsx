import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

interface DateOption {
  value: string;
  label: string;
  description: string;
}

interface TimeOption {
  value: string;
  label: string;
  description: string;
  time: string;
}

interface FamilyMember {
  id: string;
  userId: string;
  name: string;
}

interface QuickAddSheetsProps {
  showDateSheet: boolean;
  showTimeSheet: boolean;
  showFamilyPicker: boolean;
  dateOptions: DateOption[];
  timeOptions: TimeOption[];
  members: FamilyMember[];
  assignedTo: string[];
  onDateSelect: (value: string) => void;
  onTimeSelect: (value: string) => void;
  onFamilyMemberToggle: (memberId: string) => void;
  onCloseDateSheet: () => void;
  onCloseTimeSheet: () => void;
  onCloseFamilyPicker: () => void;
  colors: any;
  styles: any;
}

export const QuickAddSheets: React.FC<QuickAddSheetsProps> = ({
  showDateSheet,
  showTimeSheet,
  showFamilyPicker,
  dateOptions,
  timeOptions,
  members,
  assignedTo,
  onDateSelect,
  onTimeSelect,
  onFamilyMemberToggle,
  onCloseDateSheet,
  onCloseTimeSheet,
  onCloseFamilyPicker,
  colors,
  styles,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <>
      {/* Date Sheet */}
      {showDateSheet && (
        <View style={[styles.sheet, { 
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 16 
        }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('quickAdd.whenShouldThisHappen')}</Text>
          </View>
          {dateOptions.map(opt => (
            <TouchableOpacity 
              key={opt.value}
              testID={`date-option-${opt.value}`}
              style={styles.sheetOption} 
              onPress={() => onDateSelect(opt.value)}
            >
              <View style={styles.sheetOptionContent}>
                <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                  {opt.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity testID="date-sheet-cancel" style={styles.sheetCancel} onPress={onCloseDateSheet}>
            <Text style={[styles.sheetCancelText, { color: colors.error }]}>{t('quickAdd.cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Time Sheet */}
      {showTimeSheet && (
        <View style={[styles.sheet, { 
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 16 
        }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('quickAdd.whenShouldThisHappen')}</Text>
          </View>
          {timeOptions.map(opt => (
            <TouchableOpacity 
              key={opt.value}
              testID={`time-option-${opt.value}`}
              style={styles.sheetOption} 
              onPress={() => onTimeSelect(opt.value)}
            >
              <View style={styles.sheetOptionContent}>
                <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                  {opt.description}
                </Text>
              </View>
              <Text style={[styles.sheetOptionTime, { color: colors.primary }]}>{opt.time}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity testID="time-sheet-cancel" style={styles.sheetCancel} onPress={onCloseTimeSheet}>
            <Text style={[styles.sheetCancelText, { color: colors.error }]}>{t('quickAdd.cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Family Member Picker Modal */}
      {showFamilyPicker && (
        <View style={[styles.sheet, { 
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 16 
        }]}> 
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('quickAdd.assignToFamilyMembers')}</Text>
          </View>
          {members.map((member) => (
            <TouchableOpacity 
              key={member.id}
              testID={`family-member-${member.id}`}
              style={styles.sheetOption} 
              onPress={() => onFamilyMemberToggle(member.userId)}
            >
              <View style={styles.sheetOptionContent}>
                <Text style={[styles.sheetOptionText, { color: colors.text }]}>{member.name}</Text>
                <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                  {assignedTo.includes(member.userId) ? t('quickAdd.assigned') : t('quickAdd.notAssigned')}
                </Text>
              </View>
              {assignedTo.includes(member.userId) && (
                <Check size={20} color={colors.primary} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity testID="family-picker-done" style={styles.sheetCancel} onPress={onCloseFamilyPicker}>
            <Text style={[styles.sheetCancelText, { color: colors.error }]}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}; 
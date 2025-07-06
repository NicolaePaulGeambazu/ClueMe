import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import EditReminderModal from '../components/reminders/EditReminderModal';

export default function EditReminderScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();

  const { reminderId } = route.params;
  const [showModal, setShowModal] = useState(true);

  const styles = createStyles(colors);

  const handleClose = () => {
    setShowModal(false);
    navigation.goBack();
  };

  if (!reminderId) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {t('edit.error.noReminderId')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EditReminderModal
        visible={showModal}
        onClose={handleClose}
        reminderId={reminderId}
      />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 
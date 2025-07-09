import React, { useState } from 'react';
import EditReminderModal from '../components/reminders/EditReminderModal';

export default function EditReminderScreen({ navigation, route }: any) {
  const { reminderId } = route.params;
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    navigation.goBack();
  };

  if (!reminderId) {
    return null;
  }

  return (
    <EditReminderModal
      visible={showModal}
      onClose={handleClose}
      reminderId={reminderId}
    />
  );
} 
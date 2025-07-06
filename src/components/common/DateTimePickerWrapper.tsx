import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerWrapperProps {
  value: Date;
  mode: 'date' | 'time';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: any, date?: Date) => void;
  onCancel?: () => void;
  locale?: string;
  is24Hour?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any;
}

export const DateTimePickerWrapper: React.FC<DateTimePickerWrapperProps> = ({
  value,
  mode,
  display = 'default',
  onChange,
  locale = 'en-GB',
  is24Hour = true,
  minimumDate,
  maximumDate,
  style,
}) => {
  // For iOS, use 'default' display mode which has better text visibility
  const getDisplayMode = () => {
    if (Platform.OS === 'ios') {
      return 'default';
    }
    return display;
  };

  // Ensure text color is visible on iOS
  const getTextColor = () => {
    if (Platform.OS === 'ios') {
      // Use black text for better visibility on iOS
      return '#000000';
    }
    return undefined; // Let the system handle it on Android
  };

  const getAccentColor = () => {
    return '#007AFF'; // iOS blue
  };

  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display={getDisplayMode()}
      onChange={onChange}
      locale={locale}
      is24Hour={is24Hour}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      textColor={getTextColor()}
      accentColor={getAccentColor()}
      style={[
        styles.picker,
        Platform.OS === 'ios' && styles.iosPicker,
        style
      ]}
    />
  );
};

const styles = StyleSheet.create({
  picker: {
    // Ensure proper sizing and visibility
    minHeight: 200,
  },
  iosPicker: {
    // Additional iOS-specific styling for better visibility
    backgroundColor: '#FFFFFF',
  },
}); 
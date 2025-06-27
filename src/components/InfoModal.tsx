import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, AlertCircle, Info, Shield, HelpCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type?: 'info' | 'help' | 'privacy' | 'warning';
}

const { width: screenWidth } = Dimensions.get('window');

export default function InfoModal({
  visible,
  onClose,
  title,
  content,
  type = 'info',
}: InfoModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const getIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle size={32} color={colors.warning} strokeWidth={2} />;
      case 'privacy':
        return <Shield size={32} color={colors.success} strokeWidth={2} />;
      case 'warning':
        return <AlertCircle size={32} color={colors.error} strokeWidth={2} />;
      default:
        return <Info size={32} color={colors.primary} strokeWidth={2} />;
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'help':
        return colors.warning + '15';
      case 'privacy':
        return colors.success + '15';
      case 'warning':
        return colors.error + '15';
      default:
        return colors.primary + '15';
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('•')) {
        return (
          <Text key={index} style={styles.bulletPoint}>
            {line}
          </Text>
        );
      } else if (line.trim() === '') {
        return <View key={index} style={styles.paragraphSpacing} />;
      } else {
        return (
          <Text key={index} style={styles.contentText}>
            {line}
          </Text>
        );
      }
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
              {getIcon()}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.contentContainer}>
              {formatContent(content)}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxWidth: screenWidth - 48,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 16,
    lineHeight: 32,
  },
  contentContainer: {
    paddingBottom: 8,
  },
  contentText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 4,
    paddingLeft: 8,
  },
  paragraphSpacing: {
    height: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButtonLarge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

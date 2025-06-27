import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import { ChevronRight, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Only include the languages we actually support
const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setModalVisible(false);

    try {
      onLanguageChange(languageCode);
    } catch (error) {
      Alert.alert(t('common.error'), t('language.languageChangeError'));
    }
  };

  const LanguageItem: React.FC<{ language: Language; isSelected: boolean }> = ({
    language,
    isSelected,
  }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        { borderBottomColor: colors.border },
        isSelected && { backgroundColor: colors.primary + '10' },
      ]}
      onPress={() => handleLanguageSelect(language.code)}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.flag}>{language.flag}</Text>
        <View style={styles.languageText}>
          <Text style={[
            styles.languageName,
            { color: colors.text },
            isSelected && { color: colors.primary, fontFamily: Fonts.text.semibold },
          ]}>
            {language.nativeName}
          </Text>
          <Text style={[
            styles.languageEnglish,
            { color: colors.textSecondary },
            isSelected && { color: colors.primary },
          ]}>
            {language.name}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <>
      <TouchableOpacity
        style={[styles.selectorButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={styles.currentLanguageInfo}>
            <Text style={styles.currentFlag}>{currentLang.flag}</Text>
            <View style={styles.currentLanguageText}>
              <Text style={[styles.currentLanguageName, { color: colors.text }]}>
                {currentLang.nativeName}
              </Text>
              <Text style={[styles.currentLanguageSubtext, { color: colors.textSecondary }]}>
                {t('language.current')}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('language.selectLanguage')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {languages.map((language) => (
                <LanguageItem
                  key={language.code}
                  language={language}
                  isSelected={selectedLanguage === language.code}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  selectorButton: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentLanguageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currentLanguageText: {
    flex: 1,
  },
  currentLanguageName: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
  },
  currentLanguageSubtext: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginHorizontal: -4,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
  },
  languageEnglish: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    marginTop: 2,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

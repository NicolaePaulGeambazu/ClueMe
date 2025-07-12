import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  CheckSquare,
  List as ListIcon,
  Hash,
  FileText,
  Lock,
  Users,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../hooks/useFamily';
import { useMonetization } from '../../hooks/useMonetization';
import { useUserUsage } from '../../hooks/useUserUsage';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserList } from '../../services/firebaseService';
import SmallPaywallModal from '../premium/SmallPaywallModal';
import FullScreenPaywall from '../premium/FullScreenPaywall';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuickAddListModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (list: any) => Promise<void>;
  editingList?: UserList | null;
}

export default function QuickAddListModal({
  visible,
  onClose,
  onSave,
  editingList,
}: QuickAddListModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { family } = useFamily();
  const { 
    showFullScreenPaywall, 
    showSmallPaywall, 
    paywallMessage, 
    paywallTrigger,
    checkListCreation,
    hidePaywall,
    isLoading: monetizationLoading 
  } = useMonetization();
  const { canCreateList, incrementListCount } = useUserUsage();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'checkmark' | 'line' | 'number' | 'plain'>('checkmark');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showFormatSheet, setShowFormatSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update form when editingList changes
  useEffect(() => {
    if (editingList) {
      setName(editingList.name);
      setDescription(editingList.description || '');
      setSelectedFormat(editingList.format);
      setIsPrivate(editingList.isPrivate);
    } else {
      // Reset form for new list
      setName('');
      setDescription('');
      setSelectedFormat('checkmark');
      setIsPrivate(false);
    }
  }, [editingList]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    console.log('QuickAddListModal - Selected format:', selectedFormat);
    console.log('QuickAddListModal - Format options:', formatOptions.map(opt => ({ value: opt.value, label: opt.label })));

    // Check usage limits before saving
    if (!canCreateList) {
      // Show paywall or error message
      Alert.alert(
        'List Limit Reached',
        'You\'ve reached your limit of 2 lists. Upgrade to Pro for unlimited lists.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => showFullScreenPaywall }
        ]
      );
      return;
    }

    // Check monetization limits before saving
    const monetizationResult = await checkListCreation();
    
    if (monetizationResult.isBlocking) {
      // Don't proceed with saving if blocked
      return;
    }

    const listData = {
      name: name.trim(),
      description: description.trim() || undefined,
      format: selectedFormat,
      isPrivate,
      isFavorite: editingList?.isFavorite || false,
      createdBy: user?.uid,
      familyId: family?.id || null,
    };
    
    console.log('QuickAddListModal - List data being saved:', listData);
    console.log('QuickAddListModal - Format being saved:', listData.format);

    try {
      setIsSaving(true);
      
      await onSave(listData);
      
      // Increment usage count after successful creation
      await incrementListCount();
      
      handleClose();
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    
    // Reset all internal state
    setName('');
    setDescription('');
    setSelectedFormat('checkmark');
    setIsPrivate(false);
    setShowFormatSheet(false);
    setShowPrivacySheet(false);
    setIsSaving(false);
    
    // Then call the parent's onClose
    onClose();
  };

  const formatOptions = [
    { 
      value: 'checkmark', 
      label: 'Checkmarks', 
      description: 'Check off completed items',
      icon: CheckSquare 
    },
    { 
      value: 'line', 
      label: 'Lines', 
      description: 'Simple line items',
      icon: ListIcon 
    },
    { 
      value: 'number', 
      label: 'Numbers', 
      description: 'Numbered list items',
      icon: Hash 
    },
  ];

  // Get the format option for the selected format, with fallback for legacy formats
  const getFormatOption = (format: string) => {
    const option = formatOptions.find(opt => opt.value === format);
    if (option) return option;
    
    // Fallback for legacy formats or unknown formats
    return {
      value: format,
      label: format.charAt(0).toUpperCase() + format.slice(1),
      description: 'List format',
      icon: CheckSquare
    };
  };

  const privacyOptions = [
    {
      value: false,
      label: 'Shared with Family',
      description: 'Family members can view this list',
      icon: Users
    },
    {
      value: true,
      label: 'Private (Owner Only)',
      description: 'Only you can see this list',
      icon: Lock
    }
  ];

  const handleFormatSelect = (value: string) => {
    setSelectedFormat(value as any);
    setShowFormatSheet(false);
  };

  const handlePrivacySelect = (value: boolean) => {
    setIsPrivate(value);
    setShowPrivacySheet(false);
  };

  const renderFormatSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('lists.listFormat')}
      </Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[
            styles.selector, 
            { 
              borderColor: colors.borderLight,
              opacity: editingList ? 0.5 : 1,
            }
          ]}
          onPress={() => !editingList && setShowFormatSheet(true)}
          disabled={!!editingList}
        >
          {(() => {
            const formatOption = getFormatOption(selectedFormat);
            const FormatIcon = formatOption.icon;
            return <FormatIcon size={20} color={colors.textSecondary} />;
          })()}
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {getFormatOption(selectedFormat).label}
          </Text>
          {!editingList && <ChevronRight size={16} color={colors.textTertiary} />}
        </TouchableOpacity>
      </View>
      {editingList && (
        <Text style={[styles.disabledText, { color: colors.textTertiary }]}>
          Format cannot be changed after creation
        </Text>
      )}
    </View>
  );

  const renderPrivacySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('lists.privacy')}
      </Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.borderLight }]}
          onPress={() => setShowPrivacySheet(true)}
        >
          {(() => {
            const PrivacyIcon = isPrivate ? Lock : Users;
            return <PrivacyIcon size={20} color={colors.textSecondary} />;
          })()}
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {isPrivate ? 'Private (Owner Only)' : 'Shared with Family'}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              backgroundColor: colors.background,
              opacity: opacityAnim 
            }
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
          onResponderGrant={(e) => e.stopPropagation()}
          onResponderMove={(e) => e.stopPropagation()}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {editingList ? t('lists.editList') : t('lists.createList')}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Main Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('lists.listName')}
                </Text>
                <TextInput
                  style={[styles.titleInput, { 
                    borderColor: colors.borderLight,
                    color: colors.text,
                    backgroundColor: colors.surface
                  }]}
                  placeholder={t('forms.placeholders.enterListName')}
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={100}
                />
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('lists.description')}
                </Text>
                <TextInput
                  style={[styles.descriptionInput, { 
                    borderColor: colors.borderLight,
                    color: colors.text,
                    backgroundColor: colors.surface
                  }]}
                  placeholder={t('forms.placeholders.enterDescription')}
                  placeholderTextColor={colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              {/* Format and Privacy Selectors */}
              <View style={styles.selectorsContainer}>
                {renderFormatSelector()}
                {renderPrivacySelector()}
              </View>

              {/* Privacy Description */}
              <View style={styles.section}>
                <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                  {isPrivate
                    ? t('lists.privacyDescription')
                    : t('lists.privacyDescriptionShared')
                  }
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { 
                    backgroundColor: name.trim() && !isSaving ? colors.primary : colors.borderLight,
                    opacity: name.trim() && !isSaving ? 1 : 0.6
                  }
                ]}
                onPress={handleSave}
                disabled={!name.trim() || isSaving}
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
                    <Check size={20} color={name.trim() ? colors.background : colors.textTertiary} />
                    <Text style={[
                      styles.createButtonText,
                      { color: name.trim() ? colors.background : colors.textTertiary }
                    ]}>
                      {editingList ? t('common.save') : t('lists.createList')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Format Sheet */}
        {showFormatSheet && (
          <View style={[styles.sheet, { 
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16 
          }]}> 
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose List Format</Text>
            </View>
            {formatOptions.map(opt => {
              const IconComponent = opt.icon;
              return (
                <TouchableOpacity 
                  key={opt.value} 
                  style={styles.sheetOption} 
                  onPress={() => handleFormatSelect(opt.value)}
                >
                  <View style={styles.sheetOptionContent}>
                    <View style={styles.sheetOptionHeader}>
                      <IconComponent size={20} color={colors.primary} />
                      <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                    </View>
                    <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                      {opt.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowFormatSheet(false)}>
              <Text style={[styles.sheetCancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Sheet */}
        {showPrivacySheet && (
          <View style={[styles.sheet, { 
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16 
          }]}> 
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose Privacy Setting</Text>
            </View>
            {privacyOptions.map(opt => {
              const IconComponent = opt.icon;
              return (
                <TouchableOpacity 
                  key={opt.value.toString()} 
                  style={styles.sheetOption} 
                  onPress={() => handlePrivacySelect(opt.value)}
                >
                  <View style={styles.sheetOptionContent}>
                    <View style={styles.sheetOptionHeader}>
                      <IconComponent size={20} color={colors.primary} />
                      <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                    </View>
                    <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                      {opt.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPrivacySheet(false)}>
              <Text style={[styles.sheetCancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Small Paywall Modal */}
      <SmallPaywallModal
        visible={showSmallPaywall}
        onClose={hidePaywall}
        onUpgrade={() => {
          // Handle upgrade flow
          hidePaywall();
        }}
        message={paywallMessage}
        triggerFeature={paywallTrigger || undefined}
      />

      {/* Full Screen Paywall */}
      <FullScreenPaywall
        visible={showFullScreenPaywall}
        onClose={hidePaywall}
        onUpgrade={() => {
          // Handle upgrade flow
          hidePaywall();
        }}
        triggerFeature={paywallTrigger || undefined}
      />
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    maxHeight: '92%',
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.display?.semibold,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    fontFamily: Fonts.text?.regular,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: Fonts.text?.regular,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorsContainer: {
    gap: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
  },
  privacyDescription: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
    textAlign: 'center',
  },
  sheetOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetOptionContent: {
    flex: 1,
  },
  sheetOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sheetOptionText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
  },
  sheetOptionDescription: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    marginLeft: 32,
  },
  sheetCancel: {
    marginTop: 12,
    paddingVertical: 16,
  },
  sheetCancelText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledText: {
    fontSize: 12,
    fontFamily: Fonts.text?.regular,
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { X, Mail, User, Calendar, Check, X as XIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import { FamilyInvitation } from '../services/firebaseService';

interface FamilyInvitationModalProps {
  visible: boolean;
  onClose: () => void;
  pendingInvitations: FamilyInvitation[];
  onSendInvitation: (email: string) => Promise<string>;
  onAcceptInvitation: (invitationId: string) => Promise<void>;
  onDeclineInvitation: (invitationId: string) => Promise<void>;
  isOwner: boolean;
}

export default function FamilyInvitationModal({
  visible,
  onClose,
  pendingInvitations,
  onSendInvitation,
  onAcceptInvitation,
  onDeclineInvitation,
  isOwner,
}: FamilyInvitationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), 'Please enter an email address');
      return;
    }

    try {
      setIsSending(true);
      await onSendInvitation(email.trim());
      setEmail('');
      Alert.alert(t('common.success'), t('family.invitations.sentSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('family.invitations.sentError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await onAcceptInvitation(invitationId);
      Alert.alert(t('common.success'), t('family.invitations.acceptSuccess'));
      onClose();
    } catch (error) {
      Alert.alert(t('common.error'), t('family.invitations.acceptError'));
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await onDeclineInvitation(invitationId);
      Alert.alert(t('common.success'), t('family.invitations.declineSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('family.invitations.declineError'));
    } finally {
      setProcessingInvitation(null);
    }
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpired = (expiresAt: Date) => {
    return expiresAt < new Date();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('family.invitations.title')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Send Invitation Section */}
          {isOwner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('family.invitations.sendInvitation')}</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.textSecondary} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder={t('family.invitations.emailPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                onPress={handleSendInvitation}
                disabled={isSending}
              >
                <Text style={styles.sendButtonText}>
                  {isSending ? t('family.invitations.sending') : t('family.invitations.send')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pending Invitations Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('family.invitations.pendingInvitations')}</Text>

            {pendingInvitations.length === 0 ? (
              <Text style={styles.emptyText}>{t('family.invitations.noPendingInvitations')}</Text>
            ) : (
              pendingInvitations.map((invitation) => {
                const daysUntilExpiry = getDaysUntilExpiry(invitation.expiresAt);
                const expired = isExpired(invitation.expiresAt);

                return (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <User size={16} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.invitationFrom}>
                        {t('family.invitations.invitationFrom', { name: invitation.inviterName })}
                      </Text>
                    </View>

                    <Text style={styles.invitationTo}>
                      {t('family.invitations.invitationTo', { familyName: invitation.familyName })}
                    </Text>

                    <View style={styles.invitationFooter}>
                      <View style={styles.invitationMeta}>
                        <Calendar size={14} color={colors.textTertiary} strokeWidth={2} />
                        <Text style={styles.expiryText}>
                          {expired
                            ? t('family.invitations.invitationExpired')
                            : t('family.invitations.expiresIn', { days: daysUntilExpiry })
                          }
                        </Text>
                      </View>

                      {!expired && (
                        <View style={styles.invitationActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptInvitation(invitation.id)}
                            disabled={processingInvitation === invitation.id}
                          >
                            <Check size={16} color={colors.surface} strokeWidth={2} />
                            <Text style={styles.acceptButtonText}>
                              {processingInvitation === invitation.id
                                ? t('family.invitations.accepting')
                                : t('family.invitations.accept')
                              }
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={() => handleDeclineInvitation(invitation.id)}
                            disabled={processingInvitation === invitation.id}
                          >
                            <XIcon size={16} color={colors.error} strokeWidth={2} />
                            <Text style={styles.declineButtonText}>
                              {processingInvitation === invitation.id
                                ? t('family.invitations.declining')
                                : t('family.invitations.decline')
                              }
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: Fonts.text.semibold,
    fontSize: 20,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.surface,
  },
  emptyText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  invitationFrom: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  invitationTo: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  invitationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invitationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.surface,
    marginLeft: 4,
  },
  declineButton: {
    backgroundColor: colors.error + '15',
  },
  declineButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
});

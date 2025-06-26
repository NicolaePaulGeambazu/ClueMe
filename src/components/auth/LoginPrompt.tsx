import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';;
import { isValidEmail, isValidPassword } from '../../utils/authUtils';

interface LoginPromptProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({
  visible,
  onClose,
  onSuccess,
  title = 'Sign In Required',
  message = 'Please sign in to continue with this action.',
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { signIn, signUp, upgradeFromAnonymous, isAnonymous } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const styles = createStyles(colors);

  const handleSubmit = async () => {
    if (!isValidEmail(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    if (!isValidPassword(formData.password)) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup' && !formData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
      } else {
        if (isAnonymous) {
          await upgradeFromAnonymous(formData.email, formData.password, formData.name);
        } else {
          await signUp(formData.email, formData.password, formData.name);
        }
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Authentication Failed', 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setShowPassword(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'signin' && styles.activeModeButton]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.modeButtonText, mode === 'signin' && styles.activeModeButtonText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'signup' && styles.activeModeButton]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeButtonText, mode === 'signup' && styles.activeModeButtonText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <User size={20} color={colors.textTertiary} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  value={formData.name}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  autoCapitalize="words"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={formData.email}
                onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(value) => setFormData(prev => ({ ...prev, password: value }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textTertiary} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={colors.textTertiary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading 
                  ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                  : (mode === 'signin' ? 'Sign In' : 'Create Account')
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isAnonymous 
                ? 'Your anonymous data will be preserved when you create an account.'
                : 'By continuing, you agree to our Terms of Service and Privacy Policy.'
              }
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeModeButtonText: {
    color: colors.text,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
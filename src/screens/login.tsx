import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import { useTranslation } from 'react-i18next';

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const colors = Colors[theme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.trim(), password);

      // Wait a moment for authentication state to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigation.replace('MainTabs');
    } catch (error: any) {

      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = 'Login Failed';

      // Handle specific Firebase auth errors with more descriptive messages
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.\n\nPlease check your email or create a new account.';
          errorTitle = 'Account Not Found';
          break;
        case 'auth/wrong-password':
          errorMessage = 'The password you entered is incorrect.\n\nPlease check your password and try again.';
          errorTitle = 'Incorrect Password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.\n\nExample: user@example.com';
          errorTitle = 'Invalid Email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts.\n\nPlease wait a few minutes before trying again.';
          errorTitle = 'Too Many Attempts';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Unable to connect to the server.\n\nPlease check your internet connection and try again.';
          errorTitle = 'Connection Error';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.\n\nPlease contact support for assistance.';
          errorTitle = 'Account Disabled';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password sign-in is not enabled for this app.\n\nPlease contact support.';
          errorTitle = 'Sign-in Disabled';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.\n\nPlease check your credentials and try again.';
          errorTitle = 'Invalid Credentials';
          break;
        case 'auth/user-token-expired':
          errorMessage = 'Your session has expired.\n\nPlease sign in again.';
          errorTitle = 'Session Expired';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'For security reasons, please sign in again.';
          errorTitle = 'Re-authentication Required';
          break;
        default:
          // For unknown errors, provide a more helpful message
          if (error.message) {
            errorMessage = `Login failed: ${error.message}\n\nPlease try again or contact support if the problem persists.`;
          }
          break;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textTertiary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
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
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
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
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
              </Text>
              {!isLoading && (
                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>{t('auth.login.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 32,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.primary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});

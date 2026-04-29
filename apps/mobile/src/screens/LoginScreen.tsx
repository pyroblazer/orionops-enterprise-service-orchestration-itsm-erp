import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { apiClient } from '../services/api';

const KEYCLOAK_AUTH_URL = __DEV__
  ? 'http://10.0.2.2:8080/realms/orionops/protocol/openid-connect/auth'
  : 'https://auth.orionops.example.com/realms/orionops/protocol/openid-connect/auth';

const CLIENT_ID = 'orionops-mobile';
const REDIRECT_URI = 'orionops://auth/callback';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { colors, isHighContrast } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For the mobile app, we use direct login (Resource Owner Password)
      // In production, this would use the browser-based OAuth redirect
      await apiClient.loginWithKeycloak(
        `${username}:${password}`,
        REDIRECT_URI
      );
      navigation.replace('Main');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials and try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this opens the system browser for Keycloak OAuth
      // The redirect URI captures the authorization code
      // For now, simulate the SSO flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigation.replace('Main');
    } catch (err: any) {
      setError('SSO login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Login screen"
      >
        {/* Logo and branding */}
        <View style={styles.brandSection}>
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: colors.primary,
                borderColor: isHighContrast ? colors.borderStrong : 'transparent',
                borderWidth: isHighContrast ? 3 : 0,
              },
            ]}
            accessibilityLabel="OrionOps logo"
            accessibilityRole="image"
          >
            <Text style={[styles.logoText, { color: '#FFFFFF' }]}>O</Text>
          </View>
          <Text
            style={[styles.appName, { color: colors.text }]}
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            OrionOps
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Enterprise Service Management
          </Text>
        </View>

        {/* Login form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: isHighContrast ? colors.borderStrong : colors.border,
              borderWidth: isHighContrast ? 2 : 1,
            },
          ]}
        >
          <Text
            style={[styles.formTitle, { color: colors.text }]}
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Sign in to your account
          </Text>

          {error && (
            <View
              style={[styles.errorBox, { backgroundColor: colors.errorLight }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]} nativeID="usernameLabel">
              Username
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: isHighContrast ? colors.borderStrong : colors.border,
                  borderWidth: isHighContrast ? 2 : 1,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Username"
              accessibilityLabelledBy="usernameLabel"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]} nativeID="passwordLabel">
              Password
            </Text>
            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: isHighContrast ? colors.borderStrong : colors.border,
                  borderWidth: isHighContrast ? 2 : 1,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
              accessibilityLabelledBy="passwordLabel"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: colors.primary,
                borderColor: isHighContrast ? colors.borderStrong : colors.primary,
                borderWidth: isHighContrast ? 3 : 0,
              },
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Sign in"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" accessibilityLabel="Signing in" />
            ) : (
              <Text style={[styles.loginButtonText, { color: '#FFFFFF' }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.ssoButton,
              {
                backgroundColor: colors.surface,
                borderColor: isHighContrast ? colors.borderStrong : colors.border,
                borderWidth: isHighContrast ? 3 : 2,
              },
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleSSOLogin}
            disabled={isLoading}
            accessibilityLabel="Sign in with company SSO"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={[styles.ssoButtonText, { color: colors.text }]}>
              Sign in with Company SSO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          By signing in, you agree to the OrionOps Terms of Service.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
  },
  formCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
  },
  ssoButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  ssoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
  },
});

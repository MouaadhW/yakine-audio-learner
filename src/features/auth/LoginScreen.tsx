import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { changeLanguage } from '@/lib/i18n';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '@/navigations';
import { loginSuccess } from './authSlice';
import { DefaultStyles } from '@/components/styles';
import { makeApiRequest } from '@/lib/makeApiRequest';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const { colors } = useAppSelector(selectTheme);
  const isFrench = i18n.language !== 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formSlide = useRef(new Animated.Value(60)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(formFade, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [fadeAnim, slideAnim, formSlide, formFade]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(isFrench ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await makeApiRequest({
        url: '/api/auth/login',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.message ??
            (isFrench ? 'Email ou mot de passe invalide.' : 'Invalid email or password.'),
        );
        return;
      }

      const data = await response.json();
      dispatch(
        loginSuccess({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );
    } catch {
      setError(
        isFrench
          ? 'Impossible de se connecter. Veuillez reessayer.'
          : 'Unable to connect. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View
            style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.primaryForeground }]}>
              Y
            </Text>
          </View>
          <View style={[styles.langRow, { alignSelf: 'stretch' }]}>
            <TouchableOpacity
              style={[
                styles.langChip,
                i18n.language.startsWith('en')
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => void changeLanguage('en')}
              activeOpacity={0.8}>
              <Text style={[styles.langChipText, { color: i18n.language.startsWith('en') ? '#fff' : colors.text }]}>
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langChip,
                i18n.language.startsWith('fr')
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => void changeLanguage('fr')}
              activeOpacity={0.8}>
              <Text style={[styles.langChipText, { color: i18n.language.startsWith('fr') ? '#fff' : colors.text }]}>
                FR
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isFrench ? 'Bon retour' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFrench
              ? 'Connectez-vous pour poursuivre votre apprentissage.'
              : 'Sign in to continue learning.'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.form,
            {
              opacity: formFade,
              transform: [{ translateY: formSlide }],
            },
          ]}>
          {error ? (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.error + '15' },
              ]}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={isFrench ? 'Entrez votre email' : 'Enter your email'}
              placeholderTextColor={colors.highlight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {isFrench ? 'Mot de passe' : 'Password'}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={isFrench ? 'Entrez votre mot de passe' : 'Enter your password'}
              placeholderTextColor={colors.highlight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
            style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              {isFrench ? 'Mot de passe oublié ?' : 'Forgot your password?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={() => void handleLogin()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.buttonText,
                { color: colors.primaryForeground },
              ]}>
              {loading
                ? isFrench
                  ? 'Connexion...'
                  : 'Signing in...'
                : isFrench
                  ? 'Se connecter'
                  : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              {isFrench ? "Vous n'avez pas de compte ?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.replace('Signup')}
              activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {' '}
                {isFrench ? "S'inscrire" : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    ...DefaultStyles.fonts.bold,
  },
  title: {
    fontSize: 28,
    ...DefaultStyles.fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    ...DefaultStyles.fonts.regular,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  langChipText: {
    fontSize: 12,
    ...DefaultStyles.fonts.semiBold,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    ...DefaultStyles.fonts.regular,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    ...DefaultStyles.fonts.semiBold,
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    ...DefaultStyles.fonts.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    ...DefaultStyles.fonts.regular,
  },
  footerLink: {
    fontSize: 14,
    ...DefaultStyles.fonts.semiBold,
  },
});

export default LoginScreen;

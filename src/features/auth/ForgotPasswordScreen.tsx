import { Text } from '@/components/ui/Text';
import { DefaultStyles } from '@/components/styles';
import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { makeApiRequest } from '@/lib/makeApiRequest';
import { RootStackParamList } from '@/navigations';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { colors } = useAppSelector(selectTheme);
  const { i18n } = useTranslation();
  const isFr = i18n.language !== 'en';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(isFr ? 'Veuillez entrer votre email.' : 'Please enter your email.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await makeApiRequest({
        url: '/api/auth/forgot-password',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      });
      // Always show the success state regardless of API response (anti-enumeration)
      setSubmitted(true);
    } catch {
      setError(isFr ? 'Impossible de se connecter. Veuillez reessayer.' : 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centred}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.iconText, { color: colors.primary }]}>✉️</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isFr ? 'Vérifiez vos emails' : 'Check your email'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFr
              ? "Si cette adresse email est enregistrée, vous recevrez un lien de réinitialisation sous peu."
              : "If that email is registered, you'll receive a reset link shortly."}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {isFr ? 'Retour à la connexion' : 'Back to Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isFr ? 'Mot de passe oublié' : 'Forgot Password'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFr
              ? 'Entrez votre email pour recevoir un lien de réinitialisation.'
              : 'Enter your email to receive a password reset link.'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={isFr ? 'Entrez votre email' : 'Enter your email'}
              placeholderTextColor={colors.highlight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={() => void handleSubmit()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {loading
                ? (isFr ? 'Envoi...' : 'Sending...')
                : (isFr ? 'Envoyer le lien' : 'Send Reset Link')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.back}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              {isFr ? '← Retour' : '← Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  header: { marginBottom: 32, gap: 8 },
  form: { gap: 16 },
  iconBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconText: { fontSize: 32 },
  title: { fontSize: 26, ...DefaultStyles.fonts.semiBold, textAlign: 'center' },
  subtitle: { fontSize: 14, ...DefaultStyles.fonts.regular, textAlign: 'center', lineHeight: 20 },
  errorBox: { padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, ...DefaultStyles.fonts.medium, textAlign: 'center' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, ...DefaultStyles.fonts.medium, marginLeft: 4 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, ...DefaultStyles.fonts.regular },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, ...DefaultStyles.fonts.semiBold },
  back: { alignItems: 'center', marginTop: 4 },
  backText: { fontSize: 14, ...DefaultStyles.fonts.medium },
});

export default ForgotPasswordScreen;

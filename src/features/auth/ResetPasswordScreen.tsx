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

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const { token } = route.params;
  const { colors } = useAppSelector(selectTheme);
  const { i18n } = useTranslation();
  const isFr = i18n.language !== 'en';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!password || !confirm) {
      setError(isFr ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError(isFr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError(isFr ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Password must be at least 8 characters.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await makeApiRequest({
        url: '/api/auth/reset-password',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? (isFr ? 'Lien invalide ou expiré.' : 'Invalid or expired reset link.'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(isFr ? 'Impossible de se connecter. Veuillez reessayer.' : 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centred}>
          <View style={[styles.iconBox, { backgroundColor: (colors.success ?? '#22c55e') + '18' }]}>
            <Text style={styles.iconText}>✅</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isFr ? 'Mot de passe mis à jour !' : 'Password Updated!'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFr
              ? 'Votre mot de passe a été réinitialisé. Connectez-vous avec votre nouveau mot de passe.'
              : 'Your password has been reset. Sign in with your new password.'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {isFr ? 'Se connecter' : 'Sign In'}
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
            {isFr ? 'Nouveau mot de passe' : 'New Password'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFr
              ? 'Choisissez un mot de passe fort pour sécuriser votre compte.'
              : 'Choose a strong password to secure your account.'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {isFr ? 'Nouveau mot de passe' : 'New Password'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={isFr ? 'Entrez votre nouveau mot de passe' : 'Enter new password'}
              placeholderTextColor={colors.highlight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {isFr ? 'Confirmer le mot de passe' : 'Confirm Password'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={isFr ? 'Confirmez votre mot de passe' : 'Confirm your password'}
              placeholderTextColor={colors.highlight}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          </View>

          <View style={[styles.hintBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.hintText, { color: colors.muted }]}>
              {isFr
                ? '• 8 caractères minimum\n• 1 majuscule\n• 1 chiffre\n• 1 caractère spécial'
                : '• 8+ characters\n• 1 uppercase letter\n• 1 number\n• 1 special character'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={() => void handleReset()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {loading
                ? (isFr ? 'Mise à jour...' : 'Updating...')
                : (isFr ? 'Réinitialiser' : 'Reset Password')}
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
  hintBox: { borderWidth: 1, borderRadius: 10, padding: 12 },
  hintText: { fontSize: 12, ...DefaultStyles.fonts.regular, lineHeight: 20 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, ...DefaultStyles.fonts.semiBold },
});

export default ResetPasswordScreen;

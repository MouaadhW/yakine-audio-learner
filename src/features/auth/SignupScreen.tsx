import { Text } from '@/components/ui/Text';
import { DefaultStyles } from '@/components/styles';
import { selectTheme } from '@/features/themeSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { changeLanguage } from '@/lib/i18n';
import { makeApiRequest } from '@/lib/makeApiRequest';
import { RootStackParamList } from '@/navigations';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { loginSuccess } from './authSlice';
import {
  LAW_LEVELS,
  LAW_MAJORS,
  LAW_UNIVERSITIES_BY_REGION,
  type LawRegion,
} from '../../../backend/src/constants/lawOnboarding';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;
type LawMajor = (typeof LAW_MAJORS)[number];
type LawAcademicLevel = (typeof LAW_LEVELS)[number];

type LocalizedOption<T extends string> = {
  value: T;
  labelFr: string;
  labelEn: string;
};

const REGION_OPTIONS: LocalizedOption<LawRegion>[] = [
  { value: 'TUNIS', labelFr: 'Tunis', labelEn: 'Tunis' },
  { value: 'SOUSSE', labelFr: 'Sousse', labelEn: 'Sousse' },
  { value: 'SFAX', labelFr: 'Sfax', labelEn: 'Sfax' },
  { value: 'JENDOUBA', labelFr: 'Jendouba', labelEn: 'Jendouba' },
  { value: 'KAIROUAN', labelFr: 'Kairouan', labelEn: 'Kairouan' },
  { value: 'GABES', labelFr: 'Gabès', labelEn: 'Gabes' },
  { value: 'NABEUL', labelFr: 'Nabeul', labelEn: 'Nabeul' },
  { value: 'BIZERTE', labelFr: 'Bizerte', labelEn: 'Bizerte' },
];

const MAJOR_OPTIONS: LocalizedOption<LawMajor>[] = [
  { value: 'DROIT_PRIVE', labelFr: 'Droit privé', labelEn: 'Private Law' },
  { value: 'DROIT_PUBLIC', labelFr: 'Droit public', labelEn: 'Public Law' },
];

const LEVEL_OPTIONS: LocalizedOption<LawAcademicLevel>[] = [
  { value: 'L1', labelFr: '1ère année - L1', labelEn: '1st Year - L1' },
  { value: 'L2', labelFr: '2ème année - L2', labelEn: '2nd Year - L2' },
  { value: 'L3', labelFr: '3ème année - L3', labelEn: '3rd Year - L3' },
];

function getPasswordRuleError(password: string, isFrench: boolean): string | null {
  if (password.length < 8) {
    return isFrench
      ? 'Le mot de passe doit contenir au moins 8 caractères.'
      : 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return isFrench
      ? 'Le mot de passe doit contenir au moins une lettre majuscule.'
      : 'Password must contain at least one uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return isFrench
      ? 'Le mot de passe doit contenir au moins un chiffre.'
      : 'Password must contain at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return isFrench
      ? 'Le mot de passe doit contenir au moins un caractère spécial (ex. ! @ # ?).'
      : 'Password must contain at least one special character (e.g. ! @ # ?).';
  }
  return null;
}

function mapServerPasswordMessage(msg: string, isFrench: boolean): string {
  const m: Record<string, { fr: string; en: string }> = {
    'At least 8 characters': {
      fr: 'Le mot de passe doit contenir au moins 8 caractères.',
      en: 'Password must be at least 8 characters.',
    },
    'Must contain an uppercase letter': {
      fr: 'Le mot de passe doit contenir au moins une lettre majuscule.',
      en: 'Password must contain an uppercase letter.',
    },
    'Must contain a number': {
      fr: 'Le mot de passe doit contenir au moins un chiffre.',
      en: 'Password must contain a number.',
    },
    'Must contain a special character': {
      fr: 'Le mot de passe doit contenir au moins un caractère spécial.',
      en: 'Password must contain a special character.',
    },
  };
  const row = m[msg];
  if (row) {
    return isFrench ? row.fr : row.en;
  }
  return msg;
}

const SignupScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const { colors } = useAppSelector(selectTheme);

  const isFrench = i18n.language !== 'en';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lawRegion, setLawRegion] = useState<LawRegion | null>(null);
  const [lawUniversity, setLawUniversity] = useState<string | null>(null);
  const [lawMajor, setLawMajor] = useState<LawMajor | null>(null);
  const [lawAcademicLevel, setLawAcademicLevel] = useState<LawAcademicLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regionExpanded, setRegionExpanded] = useState(false);
  const [universityExpanded, setUniversityExpanded] = useState(false);
  const [majorExpanded, setMajorExpanded] = useState(false);
  const [levelExpanded, setLevelExpanded] = useState(false);

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

  const universities = useMemo(
    () => (lawRegion ? LAW_UNIVERSITIES_BY_REGION[lawRegion] : []),
    [lawRegion],
  );

  const validateForm = (): boolean => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(isFrench ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.');
      return false;
    }
    if (password !== confirmPassword) {
      setError(isFrench ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return false;
    }
    const pwdErr = getPasswordRuleError(password, isFrench);
    if (pwdErr) {
      setError(pwdErr);
      return false;
    }
    if (!lawRegion) {
      setError(isFrench ? 'Veuillez sélectionner votre région.' : 'Please select your region.');
      return false;
    }
    if (!lawUniversity) {
      setError(
        isFrench ? 'Veuillez sélectionner votre université.' : 'Please select your university.',
      );
      return false;
    }
    if (!lawMajor) {
      setError(isFrench ? 'Veuillez sélectionner votre spécialité.' : 'Please select your major.');
      return false;
    }
    if (!lawAcademicLevel) {
      setError(
        isFrench
          ? "Veuillez sélectionner votre niveau d'études."
          : 'Please select your academic level.',
      );
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }
    if (!lawRegion || !lawUniversity || !lawMajor || !lawAcademicLevel) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await makeApiRequest({
        url: '/api/auth/register',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: username,
            email,
            password,
            lawRegion,
            lawUniversity,
            lawMajor,
            lawAcademicLevel,
          }),
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 400 && Array.isArray(data.errors)) {
          const pwdIssue = data.errors.find(
            (issue: { path?: string[] }) => issue.path?.[0] === 'password',
          );
          if (pwdIssue?.message) {
            setError(mapServerPasswordMessage(pwdIssue.message, isFrench));
            return;
          }
          const first = data.errors[0];
          if (first?.message) {
            setError(first.message);
            return;
          }
        }
        setError(
          data.message ??
            (isFrench
              ? "Échec de l'inscription. Veuillez réessayer."
              : 'Registration failed. Please try again.'),
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
          ? 'Impossible de se connecter. Veuillez réessayer.'
          : 'Unable to connect. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCompactLocalizedSelect = <T extends string>(
    title: string,
    options: LocalizedOption<T>[],
    selected: T | null,
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    onSelect: (value: T) => void,
  ) => {
    const selectedLabel = selected
      ? options.find(option => option.value === selected)
      : null;
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}>
          <Text style={{ color: colors.text, fontSize: 14, flex: 1, paddingRight: 8 }}>
            {selectedLabel
              ? isFrench
                ? selectedLabel.labelFr
                : selectedLabel.labelEn
              : isFrench
                ? 'Choisir…'
                : 'Select…'}
          </Text>
          <Text style={{ color: colors.muted }}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {expanded && (
          <ScrollView
            nestedScrollEnabled
            style={[styles.dropdownList, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  selected === option.value && { backgroundColor: colors.primary + '22' },
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setExpanded(false);
                }}
                activeOpacity={0.8}>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {isFrench ? option.labelFr : option.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const passwordHint = isFrench
    ? '8 caractères minimum, une majuscule, un chiffre et un caractère spécial.'
    : 'At least 8 characters, one uppercase letter, one number, and one special character.';

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
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.primaryForeground }]}>Y</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isFrench ? 'Créer un compte' : 'Create Account'}
          </Text>
          <View style={styles.langRow}>
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
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isFrench
              ? 'Remplissez le formulaire ci-dessous pour vous inscrire.'
              : 'Fill out the form below to sign up.'}
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
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {isFrench ? "Nom d'utilisateur" : 'Username'}
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
              placeholder={isFrench ? "Choisissez un nom d'utilisateur" : 'Choose a username'}
              placeholderTextColor={colors.highlight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

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
              placeholder={isFrench ? 'Entrez votre e-mail' : 'Enter your email'}
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
              placeholder={isFrench ? 'Créez un mot de passe' : 'Create a password'}
              placeholderTextColor={colors.highlight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text style={[styles.hint, { color: colors.muted }]}>{passwordHint}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>
              {isFrench ? 'Confirmez le mot de passe' : 'Confirm password'}
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
              placeholder={isFrench ? 'Confirmez votre mot de passe' : 'Confirm your password'}
              placeholderTextColor={colors.highlight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {renderCompactLocalizedSelect(
            isFrench ? 'Sélectionnez votre région' : 'Select your region',
            REGION_OPTIONS,
            lawRegion,
            regionExpanded,
            setRegionExpanded,
            value => {
              setLawRegion(value);
              setLawUniversity(null);
            },
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isFrench ? 'Sélectionnez votre université' : 'Select your university'}
            </Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setUniversityExpanded(!universityExpanded)}
              activeOpacity={0.8}
              disabled={!lawRegion}>
              <Text
                style={{
                  color: lawRegion ? colors.text : colors.muted,
                  fontSize: 14,
                  flex: 1,
                  paddingRight: 8,
                }}>
                {!lawRegion
                  ? isFrench
                    ? 'Choisissez d’abord une région'
                    : 'Choose a region first'
                  : lawUniversity ?? (isFrench ? 'Choisir…' : 'Select…')}
              </Text>
              <Text style={{ color: colors.muted }}>{universityExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {universityExpanded && lawRegion && (
              <ScrollView
                nestedScrollEnabled
                style={[styles.dropdownList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {universities.map(university => (
                  <TouchableOpacity
                    key={university}
                    style={[
                      styles.dropdownItem,
                      lawUniversity === university && { backgroundColor: colors.primary + '22' },
                    ]}
                    onPress={() => {
                      setLawUniversity(university);
                      setUniversityExpanded(false);
                    }}
                    activeOpacity={0.8}>
                    <Text style={{ color: colors.text, fontSize: 14 }}>{university}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {renderCompactLocalizedSelect(
            isFrench ? 'Sélectionnez votre spécialité' : 'Select your major',
            MAJOR_OPTIONS,
            lawMajor,
            majorExpanded,
            setMajorExpanded,
            setLawMajor,
          )}

          {renderCompactLocalizedSelect(
            isFrench ? "Sélectionnez votre niveau d'études" : 'Select your academic level',
            LEVEL_OPTIONS,
            lawAcademicLevel,
            levelExpanded,
            setLevelExpanded,
            setLawAcademicLevel,
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={() => void handleSignup()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
              {loading
                ? isFrench
                  ? 'Création…'
                  : 'Creating…'
                : isFrench
                  ? 'Créer mon compte'
                  : 'Create account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              {isFrench ? 'Vous avez déjà un compte ?' : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {' '}
                {isFrench ? 'Se connecter' : 'Sign in'}
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  },
  subtitle: {
    fontSize: 15,
    ...DefaultStyles.fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
    width: '100%',
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
  hint: {
    fontSize: 12,
    ...DefaultStyles.fonts.regular,
    marginLeft: 4,
    marginTop: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    ...DefaultStyles.fonts.regular,
  },
  sectionTitle: {
    fontSize: 16,
    ...DefaultStyles.fonts.semiBold,
    marginBottom: 4,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownList: {
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    ...DefaultStyles.fonts.semiBold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
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

export default SignupScreen;

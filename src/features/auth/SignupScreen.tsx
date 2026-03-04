import { Text } from '@/components/ui/Text';
import { selectTheme } from '@/features/themeSlice';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useEffect, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type EducationLevel = 'HIGH_SCHOOL' | 'UNIVERSITY';
type StreamType = 'SCIENTIFIC' | 'LITERARY' | 'ECONOMIC' | 'TECHNICAL';

const HIGH_SCHOOL_GRADES = [
  { value: 1, label: '1ère année' },
  { value: 2, label: '2ème année' },
  { value: 3, label: 'Terminale' },
];

const UNIVERSITY_YEARS = [
  { value: 1, label: 'Year 1' },
  { value: 2, label: 'Year 2' },
  { value: 3, label: 'Year 3' },
  { value: 4, label: 'Year 4' },
  { value: 5, label: 'Year 5' },
];

const HIGH_SCHOOL_STREAMS: { value: StreamType; label: string; icon: string }[] = [
  { value: 'SCIENTIFIC', label: 'Scientific', icon: '🔬' },
  { value: 'LITERARY', label: 'Literary', icon: '📚' },
  { value: 'ECONOMIC', label: 'Economic', icon: '💰' },
  { value: 'TECHNICAL', label: 'Technical', icon: '⚙️' },
];

const UNIVERSITY_STREAMS: { value: StreamType; label: string; icon: string }[] = [
  { value: 'SCIENTIFIC', label: 'Comp. Science', icon: '💻' },
  { value: 'LITERARY', label: 'Literature', icon: '📚' },
  { value: 'ECONOMIC', label: 'Economics', icon: '💰' },
  { value: 'TECHNICAL', label: 'Engineering', icon: '⚙️' },
];

const SignupScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { colors } = useAppSelector(selectTheme);

  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 fields
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [universityYear, setUniversityYear] = useState<number | null>(null);

  // Step 3 fields
  const [stream, setStream] = useState<StreamType | null>(null);

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

  const validateStep1 = (): boolean => {
    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError('Please fill in all fields.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain an uppercase letter.');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain a number.');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain a special character.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!educationLevel) {
      setError('Please select your education level.');
      return false;
    }
    if (educationLevel === 'HIGH_SCHOOL' && grade == null) {
      setError('Please select your grade.');
      return false;
    }
    if (educationLevel === 'UNIVERSITY' && universityYear == null) {
      setError('Please select your year.');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!stream) {
      setError('Please select your stream.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSignup = async () => {
    if (!validateStep3()) return;

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
            educationLevel,
            grade: educationLevel === 'HIGH_SCHOOL' ? grade : undefined,
            universityYear: educationLevel === 'UNIVERSITY' ? universityYear : undefined,
            stream,
          }),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Registration failed. Please try again.');
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
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map(s => (
        <View
          key={s}
          style={[
            styles.stepDot,
            {
              backgroundColor: s <= step ? colors.primary : colors.border,
              width: s === step ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>Username</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Choose a username"
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
          placeholder="Enter your email"
          placeholderTextColor={colors.highlight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Create a password"
          placeholderTextColor={colors.highlight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.muted }]}>Confirm Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Confirm your password"
          placeholderTextColor={colors.highlight}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleNext}
        activeOpacity={0.8}>
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Next →
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        I am in:
      </Text>

      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.levelChip,
            {
              backgroundColor:
                educationLevel === 'HIGH_SCHOOL' ? colors.primary : colors.card,
              borderColor:
                educationLevel === 'HIGH_SCHOOL' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            setEducationLevel('HIGH_SCHOOL');
            setGrade(null);
            setUniversityYear(null);
            setStream(null);
          }}
          activeOpacity={0.8}>
          <Text style={{ fontSize: 24 }}>🏫</Text>
          <Text
            style={[
              styles.chipLabel,
              {
                color: educationLevel === 'HIGH_SCHOOL' ? '#fff' : colors.text,
              },
            ]}>
            High School
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.levelChip,
            {
              backgroundColor:
                educationLevel === 'UNIVERSITY' ? colors.primary : colors.card,
              borderColor:
                educationLevel === 'UNIVERSITY' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            setEducationLevel('UNIVERSITY');
            setGrade(null);
            setUniversityYear(null);
            setStream(null);
          }}
          activeOpacity={0.8}>
          <Text style={{ fontSize: 24 }}>🎓</Text>
          <Text
            style={[
              styles.chipLabel,
              {
                color: educationLevel === 'UNIVERSITY' ? '#fff' : colors.text,
              },
            ]}>
            University
          </Text>
        </TouchableOpacity>
      </View>

      {educationLevel === 'HIGH_SCHOOL' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            Select your grade:
          </Text>
          <View style={styles.chipRow}>
            {HIGH_SCHOOL_GRADES.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.gradeChip,
                  {
                    backgroundColor: grade === g.value ? colors.primary : colors.card,
                    borderColor: grade === g.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setGrade(g.value)}
                activeOpacity={0.8}>
                <Text
                  style={{
                    color: grade === g.value ? '#fff' : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {educationLevel === 'UNIVERSITY' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            Select your year:
          </Text>
          <View style={styles.chipRow}>
            {UNIVERSITY_YEARS.map(y => (
              <TouchableOpacity
                key={y.value}
                style={[
                  styles.gradeChip,
                  {
                    backgroundColor:
                      universityYear === y.value ? colors.primary : colors.card,
                    borderColor:
                      universityYear === y.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setUniversityYear(y.value)}
                activeOpacity={0.8}>
                <Text
                  style={{
                    color: universityYear === y.value ? '#fff' : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {y.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.8}>
          <Text style={[styles.navButtonText, { color: colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}>
          <Text style={[styles.navButtonText, { color: colors.primaryForeground }]}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep3 = () => {
    const streams =
      educationLevel === 'HIGH_SCHOOL' ? HIGH_SCHOOL_STREAMS : UNIVERSITY_STREAMS;

    return (
      <>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          What is your stream?
        </Text>

        <View style={styles.streamGrid}>
          {streams.map(s => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.streamChip,
                {
                  backgroundColor:
                    stream === s.value ? colors.primary : colors.card,
                  borderColor:
                    stream === s.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setStream(s.value)}
              activeOpacity={0.8}>
              <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              <Text
                style={{
                  color: stream === s.value ? '#fff' : colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 8,
                }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleBack}
            activeOpacity={0.8}>
            <Text style={[styles.navButtonText, { color: colors.text }]}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={() => void handleSignup()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={[styles.navButtonText, { color: colors.primaryForeground }]}>
              {loading ? 'Creating...' : '✓ Create'}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const stepTitles = ['Account Details', 'Education Level', 'Your Specialty'];

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
          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Step {step}: {stepTitles[step - 1]}
          </Text>
          {renderStepIndicator()}
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

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Already have an account?
            </Text>
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {' '}
                Sign In
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
    marginBottom: 32,
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
  },
  subtitle: {
    fontSize: 15,
    ...DefaultStyles.fonts.regular,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
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
  sectionTitle: {
    fontSize: 16,
    ...DefaultStyles.fonts.semiBold,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelChip: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  streamGrid: {
    gap: 10,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  navButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
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

export default SignupScreen;

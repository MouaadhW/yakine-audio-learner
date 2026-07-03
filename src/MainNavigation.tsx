import { getDefaultHeaderHeight } from '@react-navigation/elements';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookmarkIcon, Share2Icon } from 'lucide-react-native';
import { ActivityIndicator, Dimensions, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { HeaderButtons, Item } from 'react-navigation-header-buttons';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import MainTabs from './MainTabs';
import { DefaultStyles } from './components/styles';
import { Text } from './components/ui/Text';
import { CustomStatusBar } from './components/ui/CustomStatusBar';
import { ToastErrorLayout, ToastInfoLayout } from './components/ui/ToastLayout';
import AudioPlayerScreen from './features/audio/AudioPlayerScreen';
import LoginScreen from './features/auth/LoginScreen';
import SignupScreen from './features/auth/SignupScreen';
import ForgotPasswordScreen from './features/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './features/auth/ResetPasswordScreen';
import { selectIsLoggedIn, logout } from './features/auth/authSlice';
import PostDetailScreen from './features/blog/PostDetailScreen';
import CourseDetailScreen from './features/course/CourseDetailScreen';
import CourseListHeaderRight from './features/course/CourseListHeaderRight';
import CourseListHeaderTitle from './features/course/CourseListHeaderTitle';
import CourseListScreen from './features/course/CourseListScreen';
import AdminPanelScreen from './features/admin/AdminPanelScreen';
import AnnouncementsScreen from './features/admin/AnnouncementsScreen';
import BulkImportExportScreen from './features/admin/BulkImportExportScreen';
import ContentManagementScreen from './features/admin/ContentManagementScreen';
import FeatureFlagsScreen from './features/admin/FeatureFlagsScreen';
import ModerationScreen from './features/admin/ModerationScreen';
import StatsScreen from './features/admin/StatsScreen';
import UserManagementScreen from './features/admin/UserManagementScreen';
import TeacherScopesScreen from './features/admin/TeacherScopesScreen';
import TeacherLawSubjectsScreen from './features/admin/TeacherLawSubjectsScreen';
import TeacherAudioComposerScreen from './features/admin/TeacherAudioComposerScreen';
import ChapterListScreen from './features/subjects/ChapterListScreen';
import LessonListScreen from './features/subjects/LessonListScreen';
import SubjectListScreen from './features/subjects/SubjectListScreen';
import { selectTheme } from './features/themeSlice';
import { useAppDispatch, useAppSelector } from './lib/hooks';
import { makeApiRequest } from './lib/makeApiRequest';
import { RootStackParamList } from './navigations';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screen = Dimensions.get('window');

const linking = {
  prefixes: ['yakine://'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: { token: (t: string) => t },
      },
    },
  },
};

async function handleVerifyEmailLink(url: string | null): Promise<void> {
  if (!url?.includes('verify-email')) return;
  const match = url.match(/[?&]token=([^&]+)/);
  if (!match) return;
  const token = decodeURIComponent(match[1]);
  try {
    const resp = await makeApiRequest({
      url: '/api/auth/verify-email',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      },
    });
    if (resp.ok) {
      Toast.show({ type: 'info', text1: 'Email verified', text2: 'Your email has been successfully verified.' });
    } else {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: 'Invalid or expired verification link.' });
    }
  } catch {
    Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to verify email. Please try again.' });
  }
}

const MainNavigation = () => {
  const navigationRef = useNavigationContainerRef();
  const theme = useAppSelector(selectTheme);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const wasLoggedIn = useRef(isLoggedIn);

  // Clear the per-user server cache on logout so the next user never sees the
  // previous user's cached subjects / lessons / progress.
  useEffect(() => {
    if (wasLoggedIn.current && !isLoggedIn) {
      queryClient.clear();
    }
    wasLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, queryClient]);

  const insets = useSafeAreaInsets();

  // Validate stored session on cold start
  useEffect(() => {
    const validateSession = async () => {
      if (!isLoggedIn) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const resp = await makeApiRequest({ url: '/api/auth/me' });
        if (!resp.ok) {
          dispatch(logout());
        }
      } catch {
        // Network error — keep the session, user can retry later
      }
      setIsBootstrapping(false);
    };

    void validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle verify-email deep links (programmatic — no nav screen needed)
  useEffect(() => {
    void Linking.getInitialURL().then(handleVerifyEmailLink);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleVerifyEmailLink(url);
    });
    return () => subscription.remove();
  }, []);

  const headerHeight = getDefaultHeaderHeight(screen, false, insets.top);

  const toastTopOffset = headerHeight + 10;

  const toastConfig: ToastConfig = {
    error: ToastErrorLayout,
    info: ToastInfoLayout,
  };

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          gap: 16,
        }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.muted, fontSize: 14 }}>
          {t('loadingSession')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} theme={theme} linking={linking}>
        <CustomStatusBar />
        <Stack.Navigator
          screenOptions={{
            headerBackTitleVisible: false,
            headerShadowVisible: false,
            headerTintColor: theme.colors.text,
            navigationBarColor: theme.colors.tabBar,
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            animation: 'slide_from_right',
            headerTitleStyle: {
              fontSize: 18,
              ...DefaultStyles.fonts.medium,
            },
          }}>
          {!isLoggedIn ? (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="Signup"
                component={SignupScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{
                  title: 'Back',
                  headerShown: false,
                  animation: 'fade',
                }}
              />
          <Stack.Screen
            name="BlogDetail"
            component={PostDetailScreen}
            options={({ route }) => ({
              headerBackTitleVisible: false,
              title: '',
              headerRight: props => {
                return (
                  <Item
                    title="Share"
                    iconName="share"
                    IconComponent={Share2Icon as any}
                    color={props.tintColor}
                  />
                );
              },
            })}
          />
          <Stack.Screen
            name="CourseList"
            component={CourseListScreen}
            options={({ route }) => ({
              headerBackTitleVisible: false,
              title: 'Courses',
              headerTitleAlign: 'left',
              headerTitle: CourseListHeaderTitle,
              headerRight: CourseListHeaderRight,
            })}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={({ route }) => ({
              headerBackTitleVisible: false,
              title: '',
              headerRight: props => {
                return (
                  <HeaderButtons left>
                    <Item
                      title="Bookmark"
                      iconName="bookmark"
                      IconComponent={BookmarkIcon as any}
                      color={props.tintColor}
                    />
                    <Item
                      title="Share"
                      iconName="share"
                      IconComponent={Share2Icon as any}
                      color={props.tintColor}
                    />
                  </HeaderButtons>
                );
              },
            })}
          />
          <Stack.Screen
            name="SubjectList"
            component={SubjectListScreen}
            options={{ title: 'Subjects' }}
          />
          <Stack.Screen
            name="ChapterList"
            component={ChapterListScreen}
            options={{ title: 'Chapters' }}
          />
          <Stack.Screen
            name="LessonList"
            component={LessonListScreen}
            options={{ title: 'Lessons' }}
          />
          <Stack.Screen
            name="AudioPlayer"
            component={AudioPlayerScreen}
            options={({ route }) => ({
              title: route.params.lesson.titleFr,
              headerBackTitleVisible: false,
            })}
          />
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
            options={{ title: 'Admin Panel' }}
          />
          <Stack.Screen
            name="UserManagement"
            component={UserManagementScreen}
            options={{ title: 'User Management' }}
          />
          <Stack.Screen
            name="TeacherScopes"
            component={TeacherScopesScreen}
            options={{ title: 'Teacher Permissions' }}
          />
          <Stack.Screen
            name="TeacherLawSubjects"
            component={TeacherLawSubjectsScreen}
            options={{ title: 'Law subject access' }}
          />
          <Stack.Screen
            name="Moderation"
            component={ModerationScreen}
            options={{ title: 'Content Moderation' }}
          />
          <Stack.Screen
            name="Stats"
            component={StatsScreen}
            options={{ title: 'System Stats' }}
          />
          <Stack.Screen
            name="BulkImportExport"
            component={BulkImportExportScreen}
            options={{ title: 'Import / Export' }}
          />
          <Stack.Screen
            name="Announcements"
            component={AnnouncementsScreen}
            options={{ title: 'Announcements' }}
          />
          <Stack.Screen
            name="FeatureFlags"
            component={FeatureFlagsScreen}
            options={{ title: 'Feature Flags' }}
          />
          <Stack.Screen
            name="ContentManagement"
            component={ContentManagementScreen}
            options={{ title: 'Content Management' }}
          />
          <Stack.Screen
            name="TeacherAudioComposer"
            component={TeacherAudioComposerScreen}
            options={{ title: 'Teacher Audio Composer' }}
          />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <Toast
        config={toastConfig}
        topOffset={toastTopOffset}
        visibilityTime={5000}
      />
    </>
  );
};

export default MainNavigation;

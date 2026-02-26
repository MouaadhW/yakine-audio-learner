import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BellIcon, MoonIcon, SunIcon } from 'lucide-react-native';
import {
  BookOpenIcon,
  HomeIcon,
  NewspaperIcon,
  UserIcon,
} from 'react-native-heroicons/outline';
import {
  BookOpenIcon as BookOpenSolidIcon,
  HomeIcon as HomeSolidIcon,
  NewspaperIcon as NewspaperSolidIcon,
  UserIcon as UserSolidIcon,
} from 'react-native-heroicons/solid';
import { HeaderButtons, Item } from 'react-navigation-header-buttons';
import { useTranslation } from 'react-i18next';
import { DefaultStyles } from './components/styles';
import { HeaderLogo } from './components/ui/HeaderLogo';
import HomeScreen from './features/home/HomeScreen';
import MyCoursesScreen from './features/learning/MyCoursesScreen';
import ProfileScreen from './features/profile/ProfileScreen';
import SubjectListScreen from './features/subjects/SubjectListScreen';
import { selectTheme, setDarkMode, setLightMode } from './features/themeSlice';
import { useAppDispatch, useAppSelector } from './lib/hooks';
import { BottomTabParamList } from './navigations';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const MainTabs = () => {
  const dispatch = useAppDispatch();
  const { dark, colors } = useAppSelector(selectTheme);
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarShowLabel: false,
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: 18,
          ...DefaultStyles.fonts.medium,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home'),
          headerTitleAlign: 'left',
          headerTitle: props => <HeaderLogo {...props} />,
          tabBarIcon: props => {
            if (props.focused) {
              return <HomeSolidIcon {...props} />;
            }
            return <HomeIcon {...props} />;
          },
          headerRight: props => (
            <HeaderButtons>
              <Item
                title="Notification"
                iconName="notification"
                IconComponent={BellIcon as any}
                color={props.tintColor}
              />
              <Item
                title="Theme"
                iconName="mode"
                IconComponent={(dark ? MoonIcon : SunIcon) as any}
                color={props.tintColor}
                onPress={() => {
                  if (dark) {
                    dispatch(setLightMode());
                  } else {
                    dispatch(setDarkMode());
                  }
                }}
              />
            </HeaderButtons>
          ),
        }}
      />
      <Tab.Screen
        name="Subjects"
        component={SubjectListScreen}
        options={{
          title: 'Subjects',
          tabBarIcon: props => {
            if (props.focused) {
              return <NewspaperSolidIcon {...props} />;
            }
            return <NewspaperIcon {...props} />;
          },
        }}
      />
      <Tab.Screen
        name="Learnings"
        component={MyCoursesScreen}
        options={{
          title: t('library'),
          headerTitle: t('library'),
          tabBarIcon: props => {
            if (props.focused) {
              return <BookOpenSolidIcon {...props} />;
            }
            return <BookOpenIcon {...props} />;
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile'),
          tabBarIcon: props => {
            if (props.focused) {
              return <UserSolidIcon {...props} />;
            }
            return <UserIcon {...props} />;
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;

import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectTheme, setDarkMode, setLightMode } from '../themeSlice';
import { changeLanguage } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { logout } from '../auth/authSlice';
import { DefaultStyles } from '@/components/styles';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { colors } = useAppSelector(selectTheme);

  const selectedLanguage = i18n.language.startsWith('fr') ? 'fr' : 'en';

  return (
    <>
      <Divider orientation="horizontal" stroke={0.5} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          <Text style={{ ...styles.sectionTitle, color: colors.text }}>
            {t('language')}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    selectedLanguage === 'en' ? colors.primary : colors.card,
                },
              ]}
              onPress={() => {
                void changeLanguage('en');
              }}>
              <Text
                style={{
                  color:
                    selectedLanguage === 'en'
                      ? colors.primaryForeground
                      : colors.text,
                }}>
                {t('english')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    selectedLanguage === 'fr' ? colors.primary : colors.card,
                },
              ]}
              onPress={() => {
                void changeLanguage('fr');
              }}>
              <Text
                style={{
                  color:
                    selectedLanguage === 'fr'
                      ? colors.primaryForeground
                      : colors.text,
                }}>
                {t('french')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ ...styles.sectionTitle, color: colors.text }}>
            {t('appearance')}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => {
                dispatch(setLightMode());
              }}>
              <Text style={{ color: colors.text }}>{t('lightMode')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => {
                dispatch(setDarkMode());
              }}>
              <Text style={{ color: colors.text }}>{t('darkMode')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                { backgroundColor: colors.error + '12', borderColor: colors.error + '30' },
              ]}
              onPress={() => {
                dispatch(logout());
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.logoutText,
                  { color: colors.error },
                ]}>
                {t('logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutSection: {
    marginTop: 24,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    ...DefaultStyles.fonts.semiBold,
  },
});

export default ProfileScreen;

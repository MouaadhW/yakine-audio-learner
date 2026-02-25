import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '../themeSlice';

const ProfileScreen = () => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <>
      <Divider orientation="horizontal" stroke={0.5} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <View style={styles.container}>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            Profile details will appear here.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default ProfileScreen;

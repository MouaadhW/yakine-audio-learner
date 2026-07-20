import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { dirRow } from '@/lib/rtl';
import { HeaderTitleProps } from '@react-navigation/elements';
import { StyleSheet, Text, View } from 'react-native';

export const HeaderLogo = (props: HeaderTitleProps) => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <View style={[styles.container, { flexDirection: dirRow() }]}>
      {/* <View
        style={{
          backgroundColor: colors.primary,
          width: 28,
          height: 28,
          borderRadius: BaseStyles.values.borderRadius,
        }}
      /> */}
      <Text style={{ ...styles.title, color: colors.text }}>
        <Text style={{ ...styles.title, fontSize: 30, color: colors.primary }}>
          Y
        </Text>
        akine
      </Text>

      {/* <Image
        source={src}
        style={{
          height: 28,
          aspectRatio: 474 / 218,
        }}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'Lexend-Bold',
    fontSize: 24,
    letterSpacing: 1.5,
  },
});

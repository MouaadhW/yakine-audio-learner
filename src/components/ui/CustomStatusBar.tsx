import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'react-native';

interface CustomStatusBarProps {
  style?: 'light' | 'dark';
}

export const CustomStatusBar = ({ style }: CustomStatusBarProps) => {
  const isFocused = useIsFocused();
  const { dark, colors } = useAppSelector(selectTheme);

  const backgroundStyle = {
    backgroundColor: dark ? 'transparent' : colors.background,
  };

  if (!isFocused) {
    return null;
  }

  if (style === 'light') {
    return (
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={colors.card}
        translucent={true}
      />
    );
  }

  if (style === 'dark') {
    return (
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={colors.background}
        translucent={true}
      />
    );
  }

  return (
    <StatusBar
      barStyle={dark ? 'light-content' : 'dark-content'}
      backgroundColor={backgroundStyle.backgroundColor}
      translucent={true}
    />
  );
};

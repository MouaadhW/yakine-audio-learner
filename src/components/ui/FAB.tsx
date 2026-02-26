import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import { PlusIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface FABProps {
  onPress: () => void;
}

export const FAB = ({ onPress }: FABProps) => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}>
      <PlusIcon size={28} color="#fff" strokeWidth={2.5} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
});

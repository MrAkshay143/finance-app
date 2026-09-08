import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { colors } from '@finance/shared-ui-tokens';
import { PlusIcon } from './icons';

export interface TabBarFabButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export const TabBarFabButton: React.FC<TabBarFabButtonProps> = ({
  onPress,
  accessibilityLabel = 'Add transaction',
}) => {
  return (
    <View style={styles.fabContainer} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.fabButton,
          pressed && styles.fabPressed,
        ]}
      >
        <PlusIcon size={26} color="#FFFFFF" strokeWidth={2.8} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    top: -18,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});

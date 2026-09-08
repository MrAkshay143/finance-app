import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.navyHeaderStart}
      />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

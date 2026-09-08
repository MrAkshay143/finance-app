import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'src/__tests__/mocks/react-native.ts'),
      'react-native-keychain': path.resolve(__dirname, 'src/__tests__/mocks/react-native-keychain.ts'),
      'react-native-safe-area-context': path.resolve(__dirname, 'src/__tests__/mocks/react-native-safe-area-context.ts'),
      'react-native-svg': path.resolve(__dirname, 'src/__tests__/mocks/react-native-svg.ts'),
      '@react-navigation/native': path.resolve(__dirname, 'src/__tests__/mocks/react-navigation.ts'),
      '@react-navigation/native-stack': path.resolve(__dirname, 'src/__tests__/mocks/react-navigation.ts'),
      '@react-navigation/bottom-tabs': path.resolve(__dirname, 'src/__tests__/mocks/react-navigation.ts'),
    },
  },
});

import React from 'react';

export const useNavigation = () => ({
  navigate: () => {},
  goBack: () => {},
  reset: () => {},
  canGoBack: () => true,
  setOptions: () => {},
  addListener: () => () => {},
});

export const useRoute = () => ({
  params: {},
});

export const NavigationContainer = ({ children }: { children: React.ReactNode }) => children;
export const useFocusEffect = () => {};
export const useIsFocused = () => true;

export const createNativeStackNavigator = () => ({
  Navigator: ({ children }: any) => children,
  Screen: ({ children }: any) => children,
});

export const createBottomTabNavigator = () => ({
  Navigator: ({ children }: any) => children,
  Screen: ({ children }: any) => children,
});

export default {
  useNavigation,
  useRoute,
  NavigationContainer,
  useFocusEffect,
  useIsFocused,
  createNativeStackNavigator,
  createBottomTabNavigator,
};

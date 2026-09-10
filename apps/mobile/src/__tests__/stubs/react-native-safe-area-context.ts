import React from 'react';

export const SafeAreaInsetsContext = React.createContext({
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
});

export const useSafeAreaInsets = () => ({
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
});

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => children;
export const SafeAreaView = ({ children }: { children: React.ReactNode; style?: any }) => children;

export default {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  SafeAreaProvider,
  SafeAreaView,
};

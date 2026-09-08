import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import {
  HomeScreen,
  TransactionsScreen,
  ReportsScreen,
  MoreScreen,
} from '../screens';
import {
  HomeIcon,
  TransactionsIcon,
  ReportsIcon,
  MoreIcon,
} from '../components/icons';
import { TabBarFabButton } from '../components/TabBarFabButton';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const AddPlaceholderScreen: React.FC = () => <View />;

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size ?? 22} />
          ),
        }}
      />

      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarAccessibilityLabel: 'Transactions tab',
          tabBarIcon: ({ color, size }) => (
            <TransactionsIcon color={color} size={size ?? 22} />
          ),
        }}
      />

      {/* Center Raised FAB Slot (+) */}
      <Tab.Screen
        name="AddPlaceholder"
        component={AddPlaceholderScreen}
        options={({ navigation }) => ({
          tabBarLabel: () => null,
          tabBarButton: () => (
            <TabBarFabButton
              accessibilityLabel="Add transaction"
              onPress={() => {
                // Navigate to modal presentation stack
                (navigation as any).navigate('AddTransactionModal');
              }}
            />
          ),
        })}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            (navigation as any).navigate('AddTransactionModal');
          },
        })}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarAccessibilityLabel: 'Reports tab',
          tabBarIcon: ({ color, size }) => (
            <ReportsIcon color={color} size={size ?? 22} />
          ),
        }}
      />

      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarAccessibilityLabel: 'More menu tab',
          tabBarIcon: ({ color, size }) => (
            <MoreIcon color={color} size={size ?? 22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import { TabNavigator } from './TabNavigator';
import {
  LoginScreen,
  SignupScreen,
  AccountsScreen,
  PlanningScreen,
  CategoriesScreen,
  ProfileScreen,
  BasicProfileScreen,
  FinanceProfileScreen,
  SecurityQuestionsScreen,
  OnboardingScreen,
  AddTransactionModalScreen,
  ReportsScreen,
  AnalyticsScreen,
  NotificationsScreen,
  InvestmentsScreen,
  RecurringScreen,
  AiAnalysisScreen,
  MenuScreen,
  AboutScreen,
  SettingsScreen,
  AuditLogScreen,
  AdminDashboardScreen,
  ManageUserScreen,
  AdminSettingsScreen,
  AdminAuditScreen,
  ImportScreen,
  ExportScreen,
} from '../screens';
import { secureStorage } from '../services/secureStorage';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionExists = await secureStorage.hasValidSession();
        setHasSession(sessionExists);
        await initialize();
      } catch {
        // Fallback for non-native environments
      } finally {
        setIsInitializing(false);
      }
    };

    void checkAuth();
  }, [initialize]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasSession || isAuthenticated ? 'MainTabs' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Onboarding Stack */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        {/* Main 5-item App Shell */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Accounts, Planning & Categories Detail Screens */}
        <Stack.Screen name="Accounts" component={AccountsScreen} />
        <Stack.Screen name="Planning" component={PlanningScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="BasicProfile" component={BasicProfileScreen} />
        <Stack.Screen name="FinanceProfile" component={FinanceProfileScreen} />

        {/* Security Stack */}
        <Stack.Screen name="SecurityQuestions" component={SecurityQuestionsScreen} />

        {/* Phase 4 Analytics, Reports, Notifications, Investments, Recurring & AI Screens */}
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Investments" component={InvestmentsScreen} />
        <Stack.Screen name="Recurring" component={RecurringScreen} />
        <Stack.Screen name="AiAnalysis" component={AiAnalysisScreen} />

        {/* Phase 5 Settings, Admin, Audit, About & Import/Export Screens */}
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AuditLog" component={AuditLogScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="ManageUser" component={ManageUserScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
        <Stack.Screen name="AdminAudit" component={AdminAuditScreen} />
        <Stack.Screen name="Import" component={ImportScreen} />
        <Stack.Screen name="Export" component={ExportScreen} />

        {/* Modal Presentation */}
        <Stack.Screen
          name="AddTransactionModal"
          component={AddTransactionModalScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

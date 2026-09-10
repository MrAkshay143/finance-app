import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  ChevronRightIcon,
  UserIcon,
  SettingsIcon,
  BarChartIcon,
  SparklesIcon,
  CreditCardIcon,
  TagIcon,
  ShieldIcon,
  HelpCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  PiggyBankIcon,
  RepeatIcon,
  UploadIcon,
  DownloadIcon,
  FileTextIcon,
  UsersIcon,
  PencilIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

interface MenuItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.firstName
      ? user.firstName[0]?.toUpperCase()
      : 'U';

  const sections: MenuSection[] = [
    {
      title: 'ACCOUNT',
      items: [
        {
          id: 'profile',
          label: 'User Profile',
          subtitle: 'Personal details and verification status',
          icon: <UserIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Profile'),
        },
        {
          id: 'financeProfile',
          label: 'Finance Profile',
          subtitle: 'Monthly targets, income range, and risk appetite',
          icon: <SettingsIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('FinanceProfile'),
        },
        {
          id: 'security',
          label: 'Security Questions',
          subtitle: 'Security questions and account recovery',
          icon: <ShieldIcon size={20} color={colors.warning} />,
          onPress: () => navigation.navigate('SecurityQuestions'),
        },
        {
          id: 'settings',
          label: 'Application Preferences',
          subtitle: 'Currency, cycle dates, and dashboard toggles',
          icon: <SettingsIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Settings'),
        },
      ],
    },
    {
      title: 'INSIGHTS & ANALYTICS',
      items: [
        {
          id: 'reports',
          label: 'Finance Reports',
          subtitle: 'Target vs actual monthly financial statements',
          icon: <BarChartIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Reports'),
        },
        {
          id: 'analytics',
          label: 'Analytics Dashboard',
          subtitle: 'Multi-period trends and category breakdowns',
          icon: <BarChartIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Analytics'),
        },
        {
          id: 'aiAnalysis',
          label: 'AI Financial Analysis',
          subtitle: 'Forward projections and optimization insights',
          icon: <SparklesIcon size={20} color={colors.investment} />,
          onPress: () => navigation.navigate('AiAnalysis'),
        },
        {
          id: 'audit',
          label: 'Activity Audit Log',
          subtitle: 'Historical security and session activity trail',
          icon: <ShieldCheckIcon size={20} color={colors.success} />,
          onPress: () => navigation.navigate('AuditLog'),
        },
      ],
    },
    {
      title: 'FINANCE & PLANNING',
      items: [
        {
          id: 'accounts',
          label: 'Accounts Dashboard',
          subtitle: 'Connected bank, cash, and asset accounts',
          icon: <CreditCardIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Accounts'),
        },
        {
          id: 'categories',
          label: 'Categories Management',
          subtitle: 'System and custom transaction tags',
          icon: <TagIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Categories'),
        },
        {
          id: 'planning',
          label: 'Planning & Budgets',
          subtitle: 'Monthly spending caps and long-term goals',
          icon: <BarChartIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Planning'),
        },
        {
          id: 'investments',
          label: 'Investments Portfolio',
          subtitle: 'Track mutual funds, equity SIPs, and assets',
          icon: <PiggyBankIcon size={20} color={colors.investment} />,
          onPress: () => navigation.navigate('Investments'),
        },
        {
          id: 'recurring',
          label: 'Recurring Transactions',
          subtitle: 'Automated periodic bills, salaries, and schedules',
          icon: <RepeatIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Recurring'),
        },
      ],
    },
    {
      title: 'DATA & IMPORT',
      items: [
        {
          id: 'importCsv',
          label: 'Import CSV Data',
          subtitle: 'Upload and parse bank transaction records',
          icon: <UploadIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Import'),
        },
        {
          id: 'exportData',
          label: 'Export Financial Data',
          subtitle: 'Download complete account history in CSV or JSON',
          icon: <DownloadIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Export'),
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          id: 'notifications',
          label: 'Notifications & Reminders',
          subtitle: 'Due dates and bill alerts configuration',
          icon: <BellIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('Notifications'),
        },
        {
          id: 'about',
          label: 'About Finance Tracker',
          subtitle: 'Application guide, FAM scoring rules & methodology',
          icon: <HelpCircleIcon size={20} color={colors.primary} />,
          onPress: () => navigation.navigate('About'),
        },
      ],
    },
  ];

  if (user?.role === 'ADMIN') {
    sections.push({
      title: 'ADMINISTRATION',
      items: [
        {
          id: 'adminDashboard',
          label: 'Admin Console & Users',
          subtitle: 'User directory, status toggles & elevated controls',
          icon: <UsersIcon size={20} color={colors.danger} />,
          onPress: () => navigation.navigate('AdminDashboard'),
        },
        {
          id: 'adminSettings',
          label: 'Platform App Settings',
          subtitle: 'Session inactivity thresholds and lockout policies',
          icon: <SettingsIcon size={20} color={colors.danger} />,
          onPress: () => navigation.navigate('AdminSettings'),
        },
        {
          id: 'adminAudit',
          label: 'Global Activity Audit',
          subtitle: 'System-wide immutable security event audit log',
          icon: <FileTextIcon size={20} color={colors.danger} />,
          onPress: () => navigation.navigate('AdminAudit'),
        },
      ],
    });
  }

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Finance Tracker"
        subtitle="Menu & More Options"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Hero Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.fullName || 'Finance User'}
                </Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Standard Member'}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email || 'Not Set'}
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.buttonPressed,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Edit Profile"
            >
              <PencilIcon size={14} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Grouped Navigation Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.row,
                      !isLast && styles.rowBorder,
                      pressed && styles.rowPressed,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.iconContainer}>{item.icon}</View>
                      <View style={styles.textColumn}>
                        <Text style={styles.rowLabel}>{item.label}</Text>
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chevronAffordance}>
                      <ChevronRightIcon size={18} color="#98A2B3" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  planBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  sectionContainer: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  chevronAffordance: {
    width: 20,
    alignItems: 'center',
  },
});

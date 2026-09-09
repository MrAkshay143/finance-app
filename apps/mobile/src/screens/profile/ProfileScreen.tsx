import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import type { UserProfile, FamScoreResponse } from '@finance/shared-types';
import {
  UserIcon,
  DollarSignIcon,
  BuildingIcon,
  TagIcon,
  StoreIcon,
  LinkIcon,
  ShieldIcon,
  PencilIcon,
  CameraIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  BarChartIcon,
  InfoIcon,
  LogOutIcon,
  CheckIcon,
} from '../../components/icons';
import { BrandedHeader } from '../../components/BrandedHeader';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user: authUser, logout } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [famScore, setFamScore] = useState<FamScoreResponse | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = useCallback(async () => {
    try {
      const [profileData, famData, notifData] = await Promise.allSettled([
        apiClient.profile.get(),
        apiClient.fam.getScore(),
        apiClient.notifications.list(),
      ]);

      if (profileData.status === 'fulfilled') {
        setProfile(profileData.value);
      }
      if (famData.status === 'fulfilled') {
        setFamScore(famData.value);
      }
      if (notifData.status === 'fulfilled') {
        const notifs = notifData.value;
        const count = Array.isArray(notifs)
          ? notifs.filter((n: any) => !n.isRead).length
          : (notifs as any)?.unreadCount ?? 0;
        setUnreadNotificationsCount(count);
      }
    } catch {
      // In-memory auth user fallback
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchProfileData().finally(() => setIsLoading(false));
  }, [fetchProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const displayName =
    profile?.fullName ||
    (profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : null) ||
    authUser?.fullName ||
    'Account Member';

  const displayEmail = profile?.email || authUser?.email || 'Not Set';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'U';

  // Calculate completion percentage
  let completionPercentage = 0;
  if (profile) {
    let score = 20;
    if (profile.fullName) score += 20;
    if (profile.mobileNumber || profile.phone) score += 15;
    if (profile.kbaConfigured) score += 25;
    if (profile.onboardingCompleted) score += 20;
    completionPercentage = Math.min(score, 100);
  }

  const famGradeDisplay =
    famScore?.isAvailable && famScore.overallGrade !== 'NOT_AVAILABLE'
      ? (famScore as any).gradeDisplay || (famScore.overallGrade === 'A_PLUS' ? 'A+' : famScore.overallGrade)
      : 'N/A';

  return (
    <View style={styles.container}>
      {/* Dark Navy Branded App Header */}
      <BrandedHeader
        variant="root"
        title="Finance Tracker"
        subtitle={`Welcome back, ${profile?.firstName || displayName.split(' ')[0]}`}
        unreadCount={unreadNotificationsCount}
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 28 : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Section Title Bar */}
        <View style={styles.titleRow}>
          <View style={styles.titleWithAccent}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.sectionHeaderTitle}>Profile</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Manage your personal and finance details
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('BasicProfile')}
            style={({ pressed }) => [styles.editProfileButton, pressed && styles.pressedState]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit Profile"
          >
            <PencilIcon size={14} color={colors.primary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>

        {isLoading && !profile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {/* User Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {/* Avatar with Camera badge */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </View>
              <View style={styles.cameraBadge}>
                <CameraIcon size={12} color={colors.primary} />
              </View>
            </View>

            {/* User Meta Information */}
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {displayEmail}
              </Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Standard Member'}
                </Text>
              </View>
            </View>

            {/* FAM Score Widget */}
            <View style={styles.famScoreBox}>
              <View style={styles.famScoreLabelRow}>
                <Text style={styles.famScoreLabel}>FAM Score</Text>
                <InfoIcon size={12} color={colors.textMuted} />
              </View>
              <View style={styles.famScoreValueRow}>
                <Text style={styles.famScoreValue}>{famGradeDisplay}</Text>
                <BarChartIcon size={18} color="#98A2B3" />
              </View>
            </View>
          </View>

          {/* Profile Completion Metric or Compact One-Line Completed */}
          {completionPercentage >= 100 ? (
            <View style={styles.completionCompletedRow}>
              <View style={styles.completionCompletedLeft}>
                <CheckIcon size={16} color={colors.success} />
                <Text style={styles.completionCompletedText}>Profile Completed</Text>
              </View>
              <View style={styles.completionBadge}>
                <Text style={styles.completionBadgeText}>100%</Text>
              </View>
            </View>
          ) : (
            <View style={styles.completionContainer}>
              <View style={styles.completionLabelRow}>
                <Text style={styles.completionLabel}>Profile Completion</Text>
                <Text style={styles.completionPercentage}>{completionPercentage}%</Text>
              </View>

              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${completionPercentage}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.completionActionRow}>
                <Text style={styles.completionSubtext}>
                  Complete your profile for personalized insights.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('FinanceProfile')}
                  style={({ pressed }) => [
                    styles.completeProfileButton,
                    pressed && styles.pressedState,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Complete Profile"
                >
                  <Text style={styles.completeProfileText}>Complete Profile</Text>
                  <ArrowRightIcon size={14} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* SECTION: PROFILE */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupHeader}>PROFILE</Text>
          <View style={styles.cardList}>
            {/* Basic Profile */}
            <Pressable
              onPress={() => navigation.navigate('BasicProfile')}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Basic Profile"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#EFF4FF' }]}>
                <UserIcon size={20} color="#2554EE" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Basic Profile</Text>
                <Text style={styles.itemSubtitle}>Update your personal information</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            <View style={styles.itemDivider} />

            {/* Finance Profile */}
            <Pressable
              onPress={() => navigation.navigate('FinanceProfile')}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Finance Profile"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#F4EBFF' }]}>
                <DollarSignIcon size={20} color="#7C4DE0" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Finance Profile</Text>
                <Text style={styles.itemSubtitle}>Set your income, expenses and goals</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>

        {/* SECTION: FINANCE */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupHeader}>FINANCE</Text>
          <View style={styles.cardList}>
            {/* Accounts */}
            <Pressable
              onPress={() => navigation.navigate('Accounts')}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Accounts"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#EDFCF2' }]}>
                <BuildingIcon size={20} color="#1F9D55" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Accounts</Text>
                <Text style={styles.itemSubtitle}>Manage your bank accounts and wallets</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            <View style={styles.itemDivider} />

            {/* Categories */}
            <Pressable
              onPress={() => navigation.navigate('Categories')}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Categories"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#FFF1F3' }]}>
                <TagIcon size={20} color="#E23D3D" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Categories</Text>
                <Text style={styles.itemSubtitle}>Customize your income & expense categories</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            <View style={styles.itemDivider} />

            {/* Merchants */}
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Merchants"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#FFF6ED' }]}>
                <StoreIcon size={20} color="#E68A2E" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Merchants</Text>
                <Text style={styles.itemSubtitle}>Manage and view your saved merchants</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>

        {/* SECTION: MORE */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupHeader}>MORE</Text>
          <View style={styles.cardList}>
            {/* Integrations */}
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'More' })}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Integrations"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#F4EBFF' }]}>
                <LinkIcon size={20} color="#7C4DE0" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Integrations</Text>
                <Text style={styles.itemSubtitle}>Connect with third-party services</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            <View style={styles.itemDivider} />

            {/* Security Questions KBA */}
            <Pressable
              onPress={() => navigation.navigate('SecurityQuestions')}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Security Questions KBA"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#EFF4FF' }]}>
                <ShieldIcon size={20} color="#2554EE" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Security Questions (KBA)</Text>
                <Text style={styles.itemSubtitle}>
                  {profile?.kbaConfigured
                    ? 'Questions configured for account recovery'
                    : 'Set up questions to enable recovery'}
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>

            <View style={styles.itemDivider} />

            {/* Sign Out */}
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.listItem, pressed && styles.itemPressed]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <View style={[styles.itemIconSquare, { backgroundColor: '#FEE4E2' }]}>
                <LogOutIcon size={20} color={colors.danger} />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.danger }]}>Sign Out</Text>
                <Text style={styles.itemSubtitle}>End session and clear secure storage</Text>
              </View>
              <ChevronRightIcon size={18} color="#98A2B3" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWithAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    gap: 6,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface,
    borderRadius: 10,
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  famScoreBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    minWidth: 86,
  },
  famScoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  famScoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  famScoreValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  famScoreValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  completionCompletedRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionCompletedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionCompletedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  completionBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  completionContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  completionPercentage: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F2F4F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FDB022',
    borderRadius: 4,
  },
  completionActionRow: {
    marginTop: 10,
  },
  completionSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF4FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 44,
    gap: 4,
  },
  completeProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  groupContainer: {
    gap: 8,
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  cardList: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
  itemPressed: {
    backgroundColor: '#F8FAFC',
  },
  itemIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 70,
  },
  pressedState: {
    opacity: 0.8,
  },
});

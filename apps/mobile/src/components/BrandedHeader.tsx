import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BellIcon, ChevronLeftIcon } from './icons';
import { useAuthStore } from '../store/authStore';

export interface BrandedHeaderProps {
  variant?: 'root' | 'nested';
  title?: string;
  subtitle?: string;
  unreadCount?: number;
  initials?: string;
  onNotificationPress?: () => void;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
  rightAction?: React.ReactNode;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  variant = 'root',
  title = 'Finance Tracker',
  subtitle = 'Personal Finance System',
  unreadCount = 0,
  initials,
  onNotificationPress,
  onBackPress,
  onAvatarPress,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const derivedInitials =
    initials ??
    (user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.fullName
      ? user.fullName.slice(0, 2).toUpperCase()
      : 'FT');

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top > 0 ? insets.top + 12 : 20,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {variant === 'nested' ? (
          <View style={styles.nestedLeftContainer}>
            {onBackPress && (
              <Pressable
                onPress={onBackPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ChevronLeftIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View style={styles.titleColumn}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.rootLeftContainer}>
            {/* Square rounded app icon */}
            <View style={styles.appIconSquare}>
              <Text style={styles.appIconText}>FT</Text>
            </View>
            <View style={styles.titleColumn}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        )}

        {/* Right side controls */}
        {variant === 'root' ? (
          <View style={styles.rootRightControls}>
            {/* Notification Bell with unread badge */}
            <Pressable
              onPress={onNotificationPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BellIcon size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Circular avatar with two-tone green/blue progress ring */}
            <Pressable
              onPress={onAvatarPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={styles.avatarButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.avatarRingOuter}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitials}>{derivedInitials}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.nestedRightControls}>{rightAction}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.navyHeaderStart,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.navyHeaderStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rootLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  nestedLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 84, 238, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 231, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#DCE7FF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  rootRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nestedRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.navyHeaderStart,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarRingOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 84, 238, 0.25)',
  },
  avatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

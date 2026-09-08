import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Wallet } from 'lucide-react';
import { AvatarProgressRing } from '../finance/FamProgressRing.js';
import { useUiStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';

export interface AppHeaderProps {
  variant?: 'root' | 'nested';
  title?: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showNotifications?: boolean;
  showAvatar?: boolean;
  avatarInitials?: string;
  unreadCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  variant = 'root',
  title = 'Finance Tracker',
  subtitle = 'Personal Wealth & Spending Hub',
  backTo,
  onBack,
  rightAction,
  showNotifications = true,
  showAvatar = true,
  avatarInitials = 'FT',
  unreadCount: propUnreadCount,
}) => {
  const navigate = useNavigate();
  const storeUnreadCount = typeof window === 'undefined'
    ? useUiStore.getState().unreadCount
    : useUiStore((state) => state.unreadCount);
  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : storeUnreadCount;
  const user = useAuthStore((state) => state.user);

  const dynamicInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.fullName
      ? user.fullName.slice(0, 2).toUpperCase()
      : avatarInitials;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleAppIconClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="bg-gradient-to-b from-[#0B1B3A] to-[#132A5C] text-white pt-6 pb-5 px-5 rounded-b-[24px] shadow-header relative z-30 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left Section */}
        {variant === 'root' ? (
          <div className="flex items-center gap-3 min-w-0">
            {/* Square rounded app icon */}
            <button
              type="button"
              onClick={handleAppIconClick}
              aria-label="Finance Tracker Home"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-400 flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A]"
            >
              <Wallet className="w-5 h-5 text-white" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-300 font-normal leading-tight truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A]"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-300 font-normal leading-tight truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 shrink-0">
          {rightAction ? (
            rightAction
          ) : (
            <>
              {showNotifications && (
                <button
                  type="button"
                  onClick={handleNotificationClick}
                  aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:bg-white/20 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A]"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-semantic-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0B1B3A] leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              {showAvatar && (
                <AvatarProgressRing
                  initials={dynamicInitials}
                  avatarUrl={user?.avatarUrl}
                  size={38}
                  onClick={handleAvatarClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

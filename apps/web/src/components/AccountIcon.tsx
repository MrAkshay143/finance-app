import React, { useState, useEffect, useMemo } from 'react';
import { Landmark, CreditCard, TrendingUp, Wallet, Coins, HandCoins } from 'lucide-react';
import type { AccountType } from '@finance/shared-types';
import {
  resolveInstitutionIcon,
  type IconResult,
} from '../lib/resolveInstitutionLogo.js';
import {
  detectCardNetwork,
  type CardNetwork,
  CARD_NETWORK_NAMES,
} from '../lib/cardNetwork.js';

export interface AccountIconProps {
  institution?: string | null;
  accountType?: AccountType | string;
  cardNetworkPrefix?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showNetworkBadge?: boolean;
}

/**
 * Clean React SVG icon component for each network.
 * Renders crisp vector graphics with no external image fetches or innerHTML.
 */
export const CardNetworkBadgeIcon: React.FC<{ network: CardNetwork; className?: string }> = ({
  network,
  className = 'w-full h-full',
}) => {
  switch (network) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#0E4595" />
          <text
            x="24"
            y="21"
            fill="#FFFFFF"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="14"
            textAnchor="middle"
            letterSpacing="1"
          >
            VISA
          </text>
        </svg>
      );
    case 'mastercard':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#1A1F2C" />
          <circle cx="19" cy="16" r="10" fill="#EB001B" />
          <circle cx="29" cy="16" r="10" fill="#F79E1B" fillOpacity="0.9" />
          <path d="M24 8.8a10 10 0 0 1 0 14.4 10 10 0 0 1 0-14.4z" fill="#FF5F00" />
        </svg>
      );
    case 'rupay':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#0D519B" />
          <path
            d="M12 21V11h8c3.2 0 5 1.5 5 4s-1.8 4-5 4h-4v2h-4zm4-5h3.5c1.2 0 2-.6 2-1.5s-.8-1.5-2-1.5H16v3z"
            fill="#FFFFFF"
          />
          <path
            d="M23 16l4 5h5l-4.5-5.5c2-1 2.5-2.5 2.5-3.5 0-2.5-2-4-5.5-4h-5v4h3c1.5 0 2.5.5 2.5 1.5s-1 1.5-2.5 1.5h-2l-.5 1z"
            fill="#00A551"
          />
          <polygon points="34,11 39,11 36,21 31,21" fill="#F37021" />
        </svg>
      );
    case 'amex':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#007BC1" />
          <text
            x="24"
            y="20"
            fill="#FFFFFF"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900"
            fontSize="10"
            textAnchor="middle"
            letterSpacing="1"
          >
            AMEX
          </text>
        </svg>
      );
    case 'diners':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#004A97" />
          <circle cx="24" cy="16" r="9" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M21 11v10h2a5 5 0 0 0 0-10h-2zm4 2a3 3 0 0 1 0 6v-6z" fill="#FFFFFF" />
        </svg>
      );
    case 'discover':
      return (
        <svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
          <text
            x="17"
            y="20"
            fill="#1A1F2C"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="9"
            textAnchor="middle"
          >
            DISC
          </text>
          <circle cx="27" cy="16" r="4.5" fill="#F36F21" />
          <text
            x="36"
            y="20"
            fill="#1A1F2C"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="800"
            fontSize="9"
            textAnchor="middle"
          >
            VER
          </text>
        </svg>
      );
    default:
      return null;
  }
};

/**
 * Custom hook wrapping resolveInstitutionIcon with a 300ms debounce
 * for smooth live-typing preview without excessive probing or re-renders.
 */
export function useInstitutionIcon(
  institution?: string | null,
  debounceMs = 300
): { iconResult: IconResult | null; isLoading: boolean } {
  const [iconResult, setIconResult] = useState<IconResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const raw = (institution || '').trim();
    if (!raw) {
      setIconResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      let isMounted = true;
      resolveInstitutionIcon(raw)
        .then((res) => {
          if (isMounted) {
            setIconResult(res);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIconResult(null);
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [institution, debounceMs]);

  return { iconResult, isLoading };
}

export interface AccountTypeTheme {
  icon: React.ReactNode;
  containerClass: string;
  label: string;
}

/**
 * Returns crisp semantic Lucide vector icon, container styling, and label for each account type.
 * When an institution logo is unavailable or errors out (e.g. 404 on Google Favicon / DuckDuckGo),
 * this dynamic real icon is displayed as the primary fallback.
 */
export function getAccountTypeTheme(
  type?: string,
  iconClassName = 'w-1/2 h-1/2 stroke-[2.2]'
): AccountTypeTheme {
  const t = (type || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  switch (t) {
    case 'CREDIT_CARD':
    case 'CARD':
    case 'CREDIT':
    case 'DEBIT_CARD':
      return {
        icon: <CreditCard className={iconClassName} />,
        containerClass: 'bg-purple-50 text-purple-600 border border-purple-100/90 shadow-2xs',
        label: 'Credit Card',
      };
    case 'INVESTMENT':
    case 'INVESTMENTS':
    case 'STOCKS':
    case 'STOCK':
    case 'MUTUAL_FUNDS':
    case 'DEMAT':
      return {
        icon: <TrendingUp className={iconClassName} />,
        containerClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100/90 shadow-2xs',
        label: 'Investment',
      };
    case 'WALLET':
    case 'DIGITAL_WALLET':
    case 'PAYMENTS':
      return {
        icon: <Wallet className={iconClassName} />,
        containerClass: 'bg-amber-50 text-amber-600 border border-amber-100/90 shadow-2xs',
        label: 'Digital Wallet',
      };
    case 'CASH':
      return {
        icon: <Coins className={iconClassName} />,
        containerClass: 'bg-teal-50 text-teal-600 border border-teal-100/90 shadow-2xs',
        label: 'Cash',
      };
    case 'LOAN':
    case 'MORTGAGE':
    case 'DEBT':
      return {
        icon: <HandCoins className={iconClassName} />,
        containerClass: 'bg-rose-50 text-rose-600 border border-rose-100/90 shadow-2xs',
        label: 'Loan',
      };
    case 'BANK':
    case 'SAVINGS':
    case 'CHECKING':
    case 'CURRENT':
    default:
      return {
        icon: <Landmark className={iconClassName} />,
        containerClass: 'bg-blue-50 text-blue-600 border border-blue-100/90 shadow-2xs',
        label: 'Bank Account',
      };
  }
}

/**
 * AccountIcon component
 * 
 * Dynamically resolves and renders high-res bank / institution logos.
 * If any logo error occurs (e.g. 404 on Google Favicon / DuckDuckGo, broken image, or missing logo),
 * it immediately renders the dynamic real icon as per the account type.
 */
export const AccountIcon: React.FC<AccountIconProps> = ({
  institution,
  accountType = 'BANK',
  cardNetworkPrefix,
  className = '',
  size = 'md',
  showNetworkBadge = true,
}) => {
  const { iconResult, isLoading } = useInstitutionIcon(institution, 300);
  const [urlIndex, setUrlIndex] = useState<number>(0);
  const [hasImgError, setHasImgError] = useState<boolean>(false);

  // Reset image fallback chain whenever the resolved domain/urls change
  useEffect(() => {
    setUrlIndex(0);
    setHasImgError(false);
  }, [iconResult]);

  const cardNetwork = useMemo(() => {
    const isCreditCard =
      accountType?.toUpperCase() === 'CREDIT_CARD' ||
      accountType?.toUpperCase() === 'CARD';
    if (!isCreditCard || !cardNetworkPrefix) return null;
    return detectCardNetwork(cardNetworkPrefix);
  }, [accountType, cardNetworkPrefix]);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'xs':
        return {
          container: 'w-6 h-6 rounded-md text-[10px]',
          img: 'w-4 h-4',
          icon: 'w-3.5 h-3.5 stroke-[2.2]',
          badge: 'w-3.5 h-2.5 -bottom-0.5 -right-0.5',
        };
      case 'sm':
        return {
          container: 'w-8 h-8 rounded-lg text-xs',
          img: 'w-5 h-5',
          icon: 'w-4 h-4 stroke-[2.2]',
          badge: 'w-4 h-3 -bottom-1 -right-1',
        };
      case 'lg':
        return {
          container: 'w-12 h-12 rounded-2xl text-base',
          img: 'w-7 h-7',
          icon: 'w-6 h-6 stroke-[2.2]',
          badge: 'w-6 h-4.5 -bottom-1.5 -right-1.5',
        };
      case 'xl':
        return {
          container: 'w-14 h-14 rounded-2xl text-lg',
          img: 'w-8 h-8',
          icon: 'w-7 h-7 stroke-[2.2]',
          badge: 'w-7 h-5 -bottom-2 -right-2',
        };
      case 'md':
      default:
        return {
          container: 'w-10 h-10 rounded-xl text-xs',
          img: 'w-6 h-6',
          icon: 'w-5 h-5 stroke-[2.2]',
          badge: 'w-5 h-3.5 -bottom-1 -right-1',
        };
    }
  }, [size]);

  const typeTheme = useMemo(
    () => getAccountTypeTheme(accountType, sizeClasses.icon),
    [accountType, sizeClasses.icon]
  );

  // Handle fallback progression on <img> error
  const handleImageError = () => {
    if (iconResult && iconResult.type === 'logo') {
      if (urlIndex < iconResult.urls.length - 1) {
        setUrlIndex((prev) => prev + 1);
      } else {
        setHasImgError(true);
      }
    } else {
      setHasImgError(true);
    }
  };

  // Detect Google Favicon service default 16x16 fallback globe icon or empty load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (
      img.src.includes('google.com/s2/favicons') &&
      img.src.includes('sz=128') &&
      img.naturalWidth === 16 &&
      img.naturalHeight === 16
    ) {
      handleImageError();
    }
  };

  const hasInstitution = Boolean((institution || '').trim());
  const canShowLogo =
    hasInstitution &&
    iconResult?.type === 'logo' &&
    !hasImgError &&
    iconResult.urls.length > 0;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClasses.container} ${className}`}
      data-testid="account-icon"
    >
      {/* 1. Dynamic Real Logo Image when valid & successfully loaded */}
      {canShowLogo ? (
        <div className="w-full h-full rounded-[inherit] overflow-hidden bg-white border border-borderDefault/80 shadow-2xs flex items-center justify-center p-1">
          <img
            src={iconResult.urls[urlIndex]}
            alt={institution || 'Institution'}
            className={`${sizeClasses.img} object-contain rounded-xs transition-opacity duration-200 ${
              isLoading ? 'opacity-70' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
      ) : (
        /* 2. Dynamic Real Icon Fallback as per Account Type */
        <div
          className={`w-full h-full rounded-[inherit] flex items-center justify-center ${typeTheme.containerClass}`}
          title={institution || typeTheme.label}
          data-testid="account-type-fallback"
        >
          {typeTheme.icon}
        </div>
      )}

      {/* 3. Card Network Overlay Badge for Credit Cards */}
      {showNetworkBadge && cardNetwork && (
        <div
          className={`absolute ${sizeClasses.badge} rounded bg-white shadow-xs border border-borderDefault/90 p-[1px] flex items-center justify-center overflow-hidden z-10`}
          title={`Network: ${CARD_NETWORK_NAMES[cardNetwork]}`}
          data-testid="card-network-badge"
        >
          <CardNetworkBadgeIcon network={cardNetwork} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default AccountIcon;

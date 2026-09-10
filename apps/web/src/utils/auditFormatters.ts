export interface FormattedAuditAction {
  title: string;
  category: string;
  badgeColor: string;
  badgeClasses?: string;
  description?: string;
}

const ACTION_MAP: Record<string, { title: string; category: string; badgeColor: string; description?: string }> = {
  // Authentication & Session
  AUTH_LOGIN: {
    title: 'User Sign In',
    category: 'Auth',
    badgeColor: 'emerald',
    description: 'User successfully signed into account',
  },
  LOGIN_SUCCESS: {
    title: 'User Sign In',
    category: 'Auth',
    badgeColor: 'emerald',
    description: 'User successfully signed into account',
  },
  AUTH_LOGOUT: {
    title: 'User Sign Out',
    category: 'Auth',
    badgeColor: 'slate',
    description: 'User signed out and session terminated',
  },
  AUTH_SIGNUP: {
    title: 'Account Registered',
    category: 'Auth',
    badgeColor: 'blue',
    description: 'New account registered',
  },
  AUTH_TOKEN_ROTATED: {
    title: 'Session Renewed',
    category: 'Auth',
    badgeColor: 'teal',
    description: 'Authentication tokens refreshed',
  },
  AUTH_TOKEN_THEFT_DETECTED: {
    title: 'Security Alert',
    category: 'Security',
    badgeColor: 'rose',
    description: 'Unusual session activity detected',
  },
  AUTH_ACCOUNT_LOCKED: {
    title: 'Account Temporarily Locked',
    category: 'Security',
    badgeColor: 'rose',
    description: 'Locked due to multiple failed sign-in attempts',
  },
  AUTH_PASSWORD_CHANGE: {
    title: 'Password Changed',
    category: 'Security',
    badgeColor: 'amber',
    description: 'Account password changed',
  },
  PASSWORD_CHANGE: {
    title: 'Password Changed',
    category: 'Security',
    badgeColor: 'amber',
    description: 'Account password changed',
  },
  AUTH_SESSIONS_REVOKED_OTHERS: {
    title: 'Other Sessions Revoked',
    category: 'Security',
    badgeColor: 'amber',
    description: 'All other active user sessions were revoked',
  },
  AUTH_FORGOT_PASSWORD_VERIFIED: {
    title: 'Recovery Questions Verified',
    category: 'Auth',
    badgeColor: 'blue',
    description: 'Identity verified using security questions',
  },
  AUTH_PASSWORD_RESET_SUCCESS: {
    title: 'Password Reset Completed',
    category: 'Auth',
    badgeColor: 'emerald',
    description: 'Password reset procedure finished successfully',
  },
  PASSWORD_RESET: {
    title: 'Password Reset Completed',
    category: 'Auth',
    badgeColor: 'emerald',
    description: 'Password reset procedure finished successfully',
  },

  // Security Questions (KBA)
  SECURITY_QUESTIONS_CONFIGURED: {
    title: 'Security Questions Set Up',
    category: 'Security',
    badgeColor: 'blue',
    description: 'Security questions established for account recovery',
  },
  KBA_SETUP: {
    title: 'Security Questions Set Up',
    category: 'Security',
    badgeColor: 'blue',
    description: 'Security questions established for account recovery',
  },
  SECURITY_QUESTIONS_VERIFIED: {
    title: 'Security Questions Verified',
    category: 'Security',
    badgeColor: 'emerald',
    description: 'Security questions successfully answered',
  },
  KBA_VERIFY_SUCCESS: {
    title: 'Security Questions Verified',
    category: 'Security',
    badgeColor: 'emerald',
    description: 'Security questions successfully answered',
  },
  SECURITY_QUESTIONS_VERIFY_FAILED: {
    title: 'Verification Attempt Failed',
    category: 'Security',
    badgeColor: 'rose',
    description: 'Failed attempt answering security questions',
  },
  KBA_VERIFY_FAILURE: {
    title: 'Verification Attempt Failed',
    category: 'Security',
    badgeColor: 'rose',
    description: 'Failed attempt answering security questions',
  },
  SECURITY_QUESTIONS_LOCKED: {
    title: 'Questions Temporarily Locked',
    category: 'Security',
    badgeColor: 'rose',
    description: 'Security questions locked due to repeated failures',
  },

  // Profile & User Settings
  PROFILE_AVATAR_UPDATE: {
    title: 'Profile Photo Updated',
    category: 'Profile',
    badgeColor: 'blue',
    description: 'User avatar photo uploaded or changed',
  },
  PROFILE_AVATAR_DELETE: {
    title: 'Profile Photo Removed',
    category: 'Profile',
    badgeColor: 'slate',
    description: 'User avatar photo removed',
  },
  PROFILE_FINANCE_UPDATE: {
    title: 'Finance Profile Updated',
    category: 'Profile',
    badgeColor: 'blue',
    description: 'Financial preferences or settings updated',
  },
  USER_SETTINGS_UPDATE: {
    title: 'Preferences Updated',
    category: 'Settings',
    badgeColor: 'slate',
    description: 'User application preferences saved',
  },

  // Financial Accounts
  ACCOUNT_CREATE: {
    title: 'Financial Account Added',
    category: 'Accounts',
    badgeColor: 'emerald',
    description: 'New financial account opened',
  },
  ACCOUNT_UPDATE: {
    title: 'Account Details Updated',
    category: 'Accounts',
    badgeColor: 'blue',
    description: 'Account information modified',
  },
  ACCOUNT_STATUS_CHANGE: {
    title: 'Account Status Changed',
    category: 'Accounts',
    badgeColor: 'amber',
    description: 'Account active/archived status updated',
  },
  ACCOUNT_RESET_PROFILE: {
    title: 'Financial Profile Reset',
    category: 'Accounts',
    badgeColor: 'rose',
    description: 'All financial transactions and data were reset',
  },
  ACCOUNT_DELETED: {
    title: 'Account Closed',
    category: 'Accounts',
    badgeColor: 'rose',
    description: 'Financial account permanently closed',
  },

  // Transactions & Transfers
  TRANSACTION_CREATE: {
    title: 'Transaction Recorded',
    category: 'Transactions',
    badgeColor: 'blue',
    description: 'Transaction recorded in account',
  },
  TRANSACTION_UPDATE: {
    title: 'Transaction Updated',
    category: 'Transactions',
    badgeColor: 'blue',
    description: 'Transaction details edited',
  },
  TRANSACTION_DELETE: {
    title: 'Transaction Removed',
    category: 'Transactions',
    badgeColor: 'rose',
    description: 'Transaction deleted',
  },
  TRANSFER_CREATE: {
    title: 'Transfer Completed',
    category: 'Transactions',
    badgeColor: 'blue',
    description: 'Transfer between accounts executed',
  },
  TRANSFER_DELETE: {
    title: 'Transfer Removed',
    category: 'Transactions',
    badgeColor: 'rose',
    description: 'Account transfer record deleted',
  },

  // Categories
  CATEGORY_CREATE: {
    title: 'Category Created',
    category: 'Categories',
    badgeColor: 'blue',
    description: 'New classification category created',
  },
  CATEGORY_UPDATE: {
    title: 'Category Updated',
    category: 'Categories',
    badgeColor: 'blue',
    description: 'Category details modified',
  },
  CATEGORY_DELETE: {
    title: 'Category Removed',
    category: 'Categories',
    badgeColor: 'rose',
    description: 'Category deleted',
  },
  CATEGORY_REORDER: {
    title: 'Categories Reordered',
    category: 'Categories',
    badgeColor: 'slate',
    description: 'Display order of categories modified',
  },

  // Merchants
  MERCHANT_CREATE: {
    title: 'Merchant Added',
    category: 'Merchants',
    badgeColor: 'blue',
    description: 'New merchant directory record added',
  },
  MERCHANT_UPDATE: {
    title: 'Merchant Updated',
    category: 'Merchants',
    badgeColor: 'blue',
    description: 'Merchant information updated',
  },
  MERCHANT_DELETE: {
    title: 'Merchant Removed',
    category: 'Merchants',
    badgeColor: 'rose',
    description: 'Merchant removed from directory',
  },

  // Budgets
  BUDGET_CREATE: {
    title: 'Budget Established',
    category: 'Budgets',
    badgeColor: 'emerald',
    description: 'Monthly budget threshold established',
  },
  BUDGET_UPDATE: {
    title: 'Budget Modified',
    category: 'Budgets',
    badgeColor: 'blue',
    description: 'Budget limit modified',
  },
  BUDGET_DELETE: {
    title: 'Budget Removed',
    category: 'Budgets',
    badgeColor: 'rose',
    description: 'Budget limit deleted',
  },

  // Goals
  GOAL_CREATE: {
    title: 'Savings Goal Created',
    category: 'Goals',
    badgeColor: 'emerald',
    description: 'New savings target created',
  },
  GOAL_UPDATE: {
    title: 'Savings Goal Updated',
    category: 'Goals',
    badgeColor: 'blue',
    description: 'Savings goal modified',
  },
  GOAL_DELETE: {
    title: 'Savings Goal Removed',
    category: 'Goals',
    badgeColor: 'rose',
    description: 'Savings goal removed',
  },

  // Recurring Transactions
  RECURRING_TRANSACTION_CREATE: {
    title: 'Recurring Schedule Added',
    category: 'Transactions',
    badgeColor: 'blue',
    description: 'Scheduled recurring transaction configured',
  },
  RECURRING_TRANSACTION_MATERIALIZE: {
    title: 'Scheduled Transaction Posted',
    category: 'Transactions',
    badgeColor: 'emerald',
    description: 'Scheduled transaction posted to account',
  },

  // Administration
  ADMIN_USER_UPDATE: {
    title: 'User Details Updated',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'User details updated by administrator',
  },
  USER_ROLE_UPDATE: {
    title: 'User Role Changed',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'User role changed by administrator',
  },
  USER_SUSPEND: {
    title: 'Account Suspended',
    category: 'Admin',
    badgeColor: 'rose',
    description: 'User account suspended by administrator',
  },
  USER_ACTIVATE: {
    title: 'Account Activated',
    category: 'Admin',
    badgeColor: 'emerald',
    description: 'User account activated by administrator',
  },
  ADMIN_RESET_PASSWORD: {
    title: 'Password Reset',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'User password reset by administrator',
  },
  ADMIN_RESET_KBA: {
    title: 'Security Questions Reset',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'Security questions reset by administrator',
  },
  ADMIN_DELETE_USER: {
    title: 'Account Deleted',
    category: 'Admin',
    badgeColor: 'rose',
    description: 'User account deleted by administrator',
  },
  USER_DELETE: {
    title: 'Account Deleted',
    category: 'Admin',
    badgeColor: 'rose',
    description: 'User account deleted by administrator',
  },
  ADMIN_REVOKE_USER_SESSIONS: {
    title: 'Sessions Terminated',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'User sessions signed out by administrator',
  },
  ADMIN_APP_SETTINGS_UPDATE: {
    title: 'System Settings Updated',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'System-wide settings updated',
  },
  APP_SETTINGS_UPDATE: {
    title: 'System Settings Updated',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'System-wide settings updated',
  },
  ADMIN_CATEGORY_CREATE: {
    title: 'Default Category Created',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'System default category created',
  },
  ADMIN_CATEGORY_UPDATE: {
    title: 'Default Category Updated',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'System default category updated',
  },
  ADMIN_CATEGORY_DELETE: {
    title: 'Default Category Removed',
    category: 'Admin',
    badgeColor: 'rose',
    description: 'System default category removed',
  },
  ADMIN_CACHE_CLEAR: {
    title: 'Cache Cleared',
    category: 'Admin',
    badgeColor: 'slate',
    description: 'Temporary system cache cleared',
  },
  ADMIN_RUN_RECURRING: {
    title: 'Scheduled Tasks Run',
    category: 'Admin',
    badgeColor: 'purple',
    description: 'Scheduled recurring transactions processed',
  },
  ADMIN_AUDIT_LOG_PURGE: {
    title: 'Audit Logs Cleared',
    category: 'Admin',
    badgeColor: 'rose',
    description: 'Historical audit logs cleared',
  },

  // Data Import / Export
  DATA_EXPORT: {
    title: 'Data Archive Exported',
    category: 'Data',
    badgeColor: 'teal',
    description: 'Financial or system data archive exported',
  },
  DATA_IMPORT_CSV: {
    title: 'Bank Statement Imported',
    category: 'Data',
    badgeColor: 'teal',
    description: 'CSV financial statement imported',
  },
};

export const BADGE_COLOR_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function getAuditBadgeClasses(badgeColor: string): string {
  return BADGE_COLOR_CLASSES[badgeColor] || BADGE_COLOR_CLASSES.slate;
}

/**
 * Fallback Title-case generator: ACTION_NAME -> Action Name
 */
function toTitleCase(action: string): string {
  if (!action) return 'System Event';
  return action
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Maps raw backend uppercase action strings into polished human-readable titles,
 * categories, badge colors, and descriptions.
 */
export function formatAuditAction(action: string): {
  title: string;
  category: string;
  badgeColor: string;
  badgeClasses?: string;
  description?: string;
} {
  if (!action) {
    return {
      title: 'System Event',
      category: 'System',
      badgeColor: 'slate',
      badgeClasses: BADGE_COLOR_CLASSES.slate,
      description: 'System activity recorded',
    };
  }

  const match = ACTION_MAP[action];
  if (match) {
    return {
      ...match,
      badgeClasses: BADGE_COLOR_CLASSES[match.badgeColor] || BADGE_COLOR_CLASSES.slate,
    };
  }

  // Fallback: title-case the underscore-separated string
  const title = toTitleCase(action);
  let category = 'General';
  const act = action.toUpperCase();
  if (act.startsWith('AUTH_') || act.includes('LOGIN') || act.includes('SESSION')) category = 'Auth';
  else if (act.startsWith('ADMIN_')) category = 'Admin';
  else if (act.startsWith('PROFILE_') || act.startsWith('USER_')) category = 'Profile';
  else if (act.startsWith('ACCOUNT_')) category = 'Accounts';
  else if (act.startsWith('TRANSACTION_') || act.startsWith('TRANSFER_')) category = 'Transactions';
  else if (act.startsWith('CATEGORY_')) category = 'Categories';
  else if (act.startsWith('MERCHANT_')) category = 'Merchants';
  else if (act.startsWith('BUDGET_')) category = 'Budgets';
  else if (act.startsWith('GOAL_')) category = 'Goals';
  else if (act.startsWith('SECURITY_') || act.includes('KBA')) category = 'Security';
  else if (act.startsWith('DATA_')) category = 'Data';

  return {
    title,
    category,
    badgeColor: 'slate',
    badgeClasses: BADGE_COLOR_CLASSES.slate,
    description: `${title} recorded.`,
  };
}

/**
 * Convenience helper returning just the human-readable action label.
 */
export function formatAuditActionLabel(action: string): string {
  return formatAuditAction(action).title;
}

/**
 * Returns badge styling for an audit category.
 */
export function getAuditCategoryBadge(category?: string): {
  label: string;
  className: string;
} {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'security':
    case 'auth':
    case 'login':
      return {
        label: 'Security',
        className: 'bg-blue-50 text-blue-700 border-blue-200/60',
      };
    case 'admin':
      return {
        label: 'Admin',
        className: 'bg-purple-50 text-purple-700 border-purple-200/60',
      };
    case 'settings':
      return {
        label: 'Settings',
        className: 'bg-amber-50 text-amber-700 border-amber-200/60',
      };
    case 'finance':
    case 'accounts':
    case 'transactions':
      return {
        label: 'Finance',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      };
    default:
      return {
        label: category || 'System',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export interface ParsedClientDevice {
  device: string;
  location: string;
  browser?: string;
  os?: string;
}

// Parses user-agent strings into human-readable OS and browser information
export function parseClientDevice(
  userAgent?: string | null,
  ipAddress?: string | null
): ParsedClientDevice {
  const rawIp = (ipAddress || '').replace(/^::ffff:/, '').trim();
  let location = 'Local Network';
  if (
    rawIp &&
    rawIp !== '127.0.0.1' &&
    rawIp !== '::1' &&
    rawIp !== 'Local' &&
    rawIp !== 'Internal' &&
    !rawIp.startsWith('192.168.') &&
    !rawIp.startsWith('10.') &&
    !rawIp.startsWith('172.16.')
  ) {
    location = rawIp;
  }

  const effectiveUa =
    userAgent && typeof userAgent === 'string' && userAgent.trim()
      ? userAgent
      : typeof window !== 'undefined' && window.navigator?.userAgent
        ? window.navigator.userAgent
        : null;

  if (!effectiveUa) {
    return {
      device: 'Web Client',
      location,
      os: 'Web',
      browser: 'Browser',
    };
  }

  const ua = effectiveUa;

  // Detect Operating System
  let os = '';
  if (/Windows NT 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/iPhone/i.test(ua)) {
    os = 'iPhone (iOS)';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad (iPadOS)';
  } else if (/Android/i.test(ua)) {
    const androidMatch = ua.match(/Android\s+([\d.]+)/i);
    os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Ubuntu/i.test(ua)) {
    os = 'Ubuntu Linux';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detect Browser or Client Engine
  let browser = '';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Brave/i.test(ua)) {
    browser = 'Brave';
  } else if (/Vivaldi/i.test(ua)) {
    browser = 'Vivaldi';
  } else if (/Chrome\/[\d.]+/i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox\/[\d.]+/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\/[\d.]+/i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari';
  } else if (/PostmanRuntime/i.test(ua)) {
    browser = 'Postman API';
  } else if (/curl/i.test(ua)) {
    browser = 'cURL CLI';
  } else if (/axios|node-fetch/i.test(ua)) {
    browser = 'API Service';
  }

  // Assemble friendly device label
  let deviceName = 'Web Client';
  if (os && browser) {
    deviceName = `${os} • ${browser}`;
  } else if (os) {
    deviceName = `${os} • Web`;
  } else if (browser) {
    deviceName = `${browser} Client`;
  }

  return {
    device: deviceName,
    location,
    os: os || 'Web',
    browser: browser || 'Browser',
  };
}

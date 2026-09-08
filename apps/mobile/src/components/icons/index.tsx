import React from 'react';
import Svg, { Path, Polyline, Line, Circle, Rect, SvgProps } from 'react-native-svg';

export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const HomeIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

export const TransactionsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m16 3 4 4-4 4" />
    <Path d="M20 7H4" />
    <Path d="m8 21-4-4 4-4" />
    <Path d="M4 17h16" />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2.5,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const ReportsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M3 3v18h18" />
    <Path d="M18 17V9" />
    <Path d="M13 17V5" />
    <Path d="M8 17v-3" />
  </Svg>
);

export const MoreIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
    <Circle cx="5" cy="12" r="1.5" fill={color} />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#FFFFFF',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="6 9 12 15 18 9" />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="20" height="16" x="2" y="4" rx="2" />
    <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <Line x1="2" x2="22" y1="2" y2="22" />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <Line x1="16" x2="16" y1="2" y2="6" />
    <Line x1="8" x2="8" y1="2" y2="6" />
    <Line x1="3" x2="21" y1="10" y2="10" />
  </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </Svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1F9D55',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

export const DollarSignIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="12" x2="12" y1="2" y2="22" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

export const TagIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <Circle cx="7" cy="7" r="1" fill={color} />
  </Svg>
);

export const BuildingIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1F9D55',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <Path d="M9 22v-4h6v4" />
    <Line x1="8" y1="6" x2="8.01" y2="6" />
    <Line x1="16" y1="6" x2="16.01" y2="6" />
    <Line x1="8" y1="10" x2="8.01" y2="10" />
    <Line x1="16" y1="10" x2="16.01" y2="10" />
    <Line x1="8" y1="14" x2="8.01" y2="14" />
    <Line x1="16" y1="14" x2="16.01" y2="14" />
  </Svg>
);

export const StoreIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E68A2E',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <Path d="M2 7h20" />
  </Svg>
);

export const LinkIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#7C4DE0',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
);

export const PencilIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1F9D55',
  strokeWidth = 2.5,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" x2="12" y1="8" y2="12" />
    <Line x1="12" x2="12.01" y1="16" y2="16" />
  </Svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1="12" x2="12.01" y1="17" y2="17" />
  </Svg>
);

export const LogOutIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" x2="9" y1="12" y2="12" />
  </Svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="5" x2="19" y1="12" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({
  size = 14,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <Circle cx="12" cy="13" r="3" />
  </Svg>
);

export const SaveIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Polyline points="17 21 17 13 7 13 7 21" />
    <Polyline points="7 3 7 8 15 8" />
  </Svg>
);

export const InfoIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" x2="12" y1="16" y2="12" />
    <Line x1="12" x2="12.01" y1="8" y2="8" />
  </Svg>
);

export const BarChartIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="12" x2="12" y1="20" y2="10" />
    <Line x1="18" x2="18" y1="20" y2="4" />
    <Line x1="6" x2="6" y1="20" y2="16" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1F9D55',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <Polyline points="17 6 23 6 23 12" />
  </Svg>
);

export const TrendingDownIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <Polyline points="17 18 23 18 23 12" />
  </Svg>
);

export const PiggyBankIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#7C4DE0',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <Path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <Circle cx="13" cy="11" r="1" fill={color} />
  </Svg>
);

export const ArrowLeftRightIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m16 3 4 4-4 4" />
    <Path d="M20 7H4" />
    <Path d="m8 21-4-4 4-4" />
    <Path d="M4 17h16" />
  </Svg>
);

export const LandmarkIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="3" y1="22" x2="21" y2="22" />
    <Line x1="6" y1="18" x2="6" y2="11" />
    <Line x1="10" y1="18" x2="10" y2="11" />
    <Line x1="14" y1="18" x2="14" y2="11" />
    <Line x1="18" y1="18" x2="18" y2="11" />
    <Path d="M12 2 20 7H4l8-5z" />
  </Svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="20" height="14" x="2" y="5" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

export const WalletIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </Svg>
);

export const ReceiptIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <Path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <Path d="M12 17.5v-11" />
  </Svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <Path d="M21 3v5h-5" />
    <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <Path d="M8 16H3v5" />
  </Svg>
);

export const FilterIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </Svg>
);

export const TargetIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="6" />
    <Circle cx="12" cy="12" r="2" />
  </Svg>
);

export const PieChartIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" />
  </Svg>
);

export const FlagIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <Line x1="4" y1="22" x2="4" y2="15" />
  </Svg>
);

export const GripVerticalIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#98A2B3',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="9" cy="12" r="1" fill={color} />
    <Circle cx="9" cy="5" r="1" fill={color} />
    <Circle cx="9" cy="19" r="1" fill={color} />
    <Circle cx="15" cy="12" r="1" fill={color} />
    <Circle cx="15" cy="5" r="1" fill={color} />
    <Circle cx="15" cy="19" r="1" fill={color} />
  </Svg>
);

export const ShieldAlertIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E68A2E',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const ArrowUpRightIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#1F9D55',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="7" y1="17" x2="17" y2="7" />
    <Polyline points="7 7 17 7 17 17" />
  </Svg>
);

export const ArrowDownLeftIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E23D3D',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="17" y1="7" x2="7" y2="17" />
    <Polyline points="17 17 7 17 7 7" />
  </Svg>
);

export const DownloadIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <Line x1="5" y1="3" x2="5" y2="7" />
    <Line x1="19" y1="17" x2="19" y2="21" />
  </Svg>
);

export const CheckCheckIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M18 6 7 17l-5-5" />
    <Path d="m22 10-7.5 7.5L13 16" />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const LightbulbIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#E68A2E',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <Path d="M9 18h6" />
    <Path d="M10 22h4" />
  </Svg>
);

export const RepeatIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="m17 1 4 4-4 4" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <Path d="m7 23-4-4 4-4" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </Svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#7C4DE0',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
);

export const UploadIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const KeyRoundIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
    <Circle cx="16.5" cy="7.5" r=".5" fill={color} />
  </Svg>
);

export const FileTextIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Line x1="10" y1="9" x2="8" y2="9" />
  </Svg>
);

export const GlobeIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

export const AwardIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx="12" cy="8" r="7" />
    <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </Svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#2554EE',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);

export const MinusIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#667085',
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);


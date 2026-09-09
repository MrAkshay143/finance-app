import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@finance/shared-ui-tokens';

export interface FamDonutRingProps {
  grade?: string; // 'A+' | 'B' | 'C' | 'N/A' | 'NA'
  progressPercentage?: number;
  score?: number;
  statusLabel?: string;
  size?: number;
  strokeWidth?: number;
}

export const FamDonutRing: React.FC<FamDonutRingProps> = ({
  grade = 'N/A',
  progressPercentage,
  score,
  statusLabel,
  size = 110,
  strokeWidth = 9,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 5;
  const segmentLength = Math.max(0, (circumference - 3 * gap) / 3);

  const displayProgress =
    progressPercentage !== undefined
      ? Math.round(progressPercentage)
      : score !== undefined
      ? Math.round(score)
      : 0;

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A+':
      case 'A':
        return colors.success;
      case 'B':
        return colors.primary;
      case 'C':
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const gradeColor = getGradeColor(grade);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        {/* Segment 1: Income (Green) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.success}
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
        {/* Segment 2: Expense (Red) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.danger}
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset={-(segmentLength + gap)}
          strokeLinecap="round"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
        {/* Segment 3: Investment (Purple) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.investment}
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset={-2 * (segmentLength + gap)}
          strokeLinecap="round"
          origin={`${size / 2}, ${size / 2}`}
          rotation="-90"
        />
      </Svg>

      {/* Centered Grade & Progress Info */}
      <View style={styles.centerOverlay} pointerEvents="none">
        <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        <Text style={styles.progressText}>{displayProgress}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: -1,
  },
});

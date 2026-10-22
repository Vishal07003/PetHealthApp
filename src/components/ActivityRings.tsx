import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

interface ActivityRingsProps {
  scorePercent: number; // 0 - 100
  size?: number;
  label?: string;
  subLabel?: string;
}

/**
 * Precision circular gauge matching the "Clinical Bio-Care" design system.
 * Features a high-contrast clinical teal arc, central percentage badge, and clean metric readout.
 */
export const ActivityRings: React.FC<ActivityRingsProps> = ({
  scorePercent,
  size = 180,
  label = 'Goal Met',
  subLabel = 'IMU Motion Score',
}) => {
  const p = Math.min(Math.max(scorePercent, 5), 100);
  const strokeWidth = 12;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer subtle clinical track */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#E8F2EF',
          },
        ]}
      />

      {/* Progress Arc */}
      <View
        style={[
          styles.progressArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.secondary,
            borderRightColor: p > 25 ? Colors.secondary : 'transparent',
            borderBottomColor: p > 50 ? Colors.primary : 'transparent',
            borderLeftColor: p > 75 ? Colors.primary : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Center Metrics Readout */}
      <View style={styles.centerBox}>
        <Text style={styles.scoreText}>{Math.round(p)}%</Text>
        <Text style={styles.centerLabel}>{label}</Text>
        <Text style={styles.centerSubLabel}>{subLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  track: {
    position: 'absolute',
  },
  progressArc: {
    position: 'absolute',
    borderTopColor: 'transparent',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  centerSubLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
});

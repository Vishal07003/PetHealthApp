import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

interface ActivityRingsProps {
  movePercent: number; // 0 - 100
  exercisePercent: number; // 0 - 100
  restPercent: number; // 0 - 100
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

/**
 * Concentric activity rings component inspired by modern fitness/health apps.
 * Implemented using pure React Native curved border segments for zero native binary dependencies.
 */
export const ActivityRings: React.FC<ActivityRingsProps> = ({
  movePercent,
  exercisePercent,
  restPercent,
  size = 180,
  centerLabel = 'Active Score',
  centerValue,
}) => {
  // Clamp percentages between 5 and 100 for display
  const p1 = Math.min(Math.max(movePercent, 0), 100);
  const p2 = Math.min(Math.max(exercisePercent, 0), 100);
  const p3 = Math.min(Math.max(restPercent, 0), 100);

  const ring1Size = size;
  const ring2Size = size - 32;
  const ring3Size = size - 64;

  const strokeWidth = 10;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Ring: Move / Active Energy (Accent Coral) */}
      <View
        style={[
          styles.track,
          {
            width: ring1Size,
            height: ring1Size,
            borderRadius: ring1Size / 2,
            borderWidth: strokeWidth,
            borderColor: '#FFE3DC',
          },
        ]}
      />
      <View
        style={[
          styles.progressArc,
          {
            width: ring1Size,
            height: ring1Size,
            borderRadius: ring1Size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.secondary,
            borderRightColor: p1 > 25 ? Colors.secondary : 'transparent',
            borderBottomColor: p1 > 50 ? Colors.secondary : 'transparent',
            borderLeftColor: p1 > 75 ? Colors.secondary : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Middle Ring: Exercise / Running Minutes (Primary Teal) */}
      <View
        style={[
          styles.track,
          {
            width: ring2Size,
            height: ring2Size,
            borderRadius: ring2Size / 2,
            borderWidth: strokeWidth,
            borderColor: '#D4EBE5',
          },
        ]}
      />
      <View
        style={[
          styles.progressArc,
          {
            width: ring2Size,
            height: ring2Size,
            borderRadius: ring2Size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.primary,
            borderRightColor: p2 > 25 ? Colors.primary : 'transparent',
            borderBottomColor: p2 > 50 ? Colors.primary : 'transparent',
            borderLeftColor: p2 > 75 ? Colors.primary : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Inner Ring: Rest / Sleep Duration (Accent Purple) */}
      <View
        style={[
          styles.track,
          {
            width: ring3Size,
            height: ring3Size,
            borderRadius: ring3Size / 2,
            borderWidth: strokeWidth,
            borderColor: '#E7E7F8',
          },
        ]}
      />
      <View
        style={[
          styles.progressArc,
          {
            width: ring3Size,
            height: ring3Size,
            borderRadius: ring3Size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.accent,
            borderRightColor: p3 > 25 ? Colors.accent : 'transparent',
            borderBottomColor: p3 > 50 ? Colors.accent : 'transparent',
            borderLeftColor: p3 > 75 ? Colors.accent : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />

      {/* Center Label */}
      <View style={styles.centerBox}>
        <Text style={styles.centerValue}>{centerValue || `${Math.round(p1)}%`}</Text>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
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
  centerValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

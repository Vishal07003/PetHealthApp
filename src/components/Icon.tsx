import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/theme';

export type IconName =
  | 'home'
  | 'activity'
  | 'devices'
  | 'profile'
  | 'plus'
  | 'chevron-right'
  | 'chevron-left'
  | 'bluetooth'
  | 'battery'
  | 'flame'
  | 'moon'
  | 'heart'
  | 'check'
  | 'alert'
  | 'refresh'
  | 'clock'
  | 'shield';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Clean, lightweight geometric vector outline icons built directly with pure React Native components.
 * Guarantees 100% compatibility across all React Native/Fabric/Hermes versions without requiring native binary links.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = Colors.text,
  style,
}) => {
  const s = size;
  const stroke = 2;

  switch (name) {
    case 'home':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          {/* Roof roof-like triangle / peaked border */}
          <View
            style={{
              width: s * 0.75,
              height: s * 0.75,
              borderWidth: stroke,
              borderColor: color,
              borderTopWidth: stroke,
              borderRadius: 3,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: s * 0.05,
            }}
          />
          {/* Bottom house base */}
          <View
            style={{
              width: s * 0.65,
              height: s * 0.5,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              position: 'absolute',
              bottom: s * 0.12,
            }}
          />
        </View>
      );

    case 'activity':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }, style]}>
          {/* 3 Activity Pulse bars */}
          <View style={{ width: stroke * 1.5, height: s * 0.45, backgroundColor: color, borderRadius: 1.5, marginHorizontal: 2 }} />
          <View style={{ width: stroke * 1.5, height: s * 0.8, backgroundColor: color, borderRadius: 1.5, marginHorizontal: 2 }} />
          <View style={{ width: stroke * 1.5, height: s * 0.6, backgroundColor: color, borderRadius: 1.5, marginHorizontal: 2 }} />
          <View style={{ width: stroke * 1.5, height: s * 0.35, backgroundColor: color, borderRadius: 1.5, marginHorizontal: 2 }} />
        </View>
      );

    case 'devices':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          {/* Collar ring / Smart band shape */}
          <View
            style={{
              width: s * 0.85,
              height: s * 0.85,
              borderRadius: s * 0.425,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Sensor unit center */}
            <View
              style={{
                width: s * 0.35,
                height: s * 0.35,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'profile':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          {/* Head */}
          <View
            style={{
              width: s * 0.4,
              height: s * 0.4,
              borderRadius: s * 0.2,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: s * 0.75,
              height: s * 0.35,
              borderTopLeftRadius: s * 0.35,
              borderTopRightRadius: s * 0.35,
              borderWidth: stroke,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'plus':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ width: s * 0.7, height: stroke, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
          <View style={{ width: stroke, height: s * 0.7, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
        </View>
      );

    case 'chevron-right':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.35,
              height: s * 0.35,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginLeft: -s * 0.1,
            }}
          />
        </View>
      );

    case 'chevron-left':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.35,
              height: s * 0.35,
              borderBottomWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginRight: -s * 0.1,
            }}
          />
        </View>
      );

    case 'bluetooth':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ width: stroke, height: s * 0.8, backgroundColor: color }} />
          <View
            style={{
              width: s * 0.35,
              height: s * 0.35,
              borderRightWidth: stroke,
              borderTopWidth: stroke,
              borderColor: color,
              position: 'absolute',
              top: s * 0.1,
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              width: s * 0.35,
              height: s * 0.35,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              position: 'absolute',
              bottom: s * 0.1,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'battery':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }, style]}>
          <View
            style={{
              width: s * 0.75,
              height: s * 0.45,
              borderRadius: 3,
              borderWidth: stroke,
              borderColor: color,
              padding: 1.5,
              justifyContent: 'center',
            }}
          >
            <View style={{ width: '65%', height: '100%', backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View style={{ width: stroke * 1.2, height: s * 0.2, backgroundColor: color, borderTopRightRadius: 1, borderBottomRightRadius: 1 }} />
        </View>
      );

    case 'flame':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.55,
              height: s * 0.7,
              borderBottomLeftRadius: s * 0.275,
              borderBottomRightRadius: s * 0.275,
              borderTopLeftRadius: s * 0.4,
              borderTopRightRadius: 2,
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-10deg' }],
            }}
          />
        </View>
      );

    case 'moon':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.7,
              height: s * 0.7,
              borderRadius: s * 0.35,
              borderWidth: stroke,
              borderColor: color,
              borderRightWidth: 0,
              borderTopWidth: 0,
              transform: [{ rotate: '20deg' }],
            }}
          />
        </View>
      );

    case 'heart':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.55,
              height: s * 0.55,
              borderWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: s * 0.275,
              borderTopRightRadius: s * 0.275,
              transform: [{ rotate: '-45deg' }],
              position: 'absolute',
              top: s * 0.2,
            }}
          />
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.35,
              height: s * 0.6,
              borderBottomWidth: stroke * 1.2,
              borderRightWidth: stroke * 1.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -s * 0.1,
            }}
          />
        </View>
      );

    case 'clock':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.8,
              height: s * 0.8,
              borderRadius: s * 0.4,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: stroke, height: s * 0.25, backgroundColor: color, position: 'absolute', top: s * 0.12 }} />
            <View style={{ width: s * 0.22, height: stroke, backgroundColor: color, position: 'absolute', right: s * 0.14 }} />
          </View>
        </View>
      );

    case 'alert':
    default:
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.8,
              height: s * 0.8,
              borderRadius: s * 0.4,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: stroke, height: s * 0.25, backgroundColor: color, marginBottom: 2 }} />
            <View style={{ width: stroke * 1.2, height: stroke * 1.2, borderRadius: stroke * 0.6, backgroundColor: color }} />
          </View>
        </View>
      );
  }
};

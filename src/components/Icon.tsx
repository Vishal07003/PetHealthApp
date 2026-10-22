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
  | 'shield'
  | 'search'
  | 'filter'
  | 'download'
  | 'settings'
  | 'bell'
  | 'syringe'
  | 'scale'
  | 'pill'
  | 'file-text';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Clinical Bio-Care precision geometric vector icons.
 * Pure React Native implementation for zero native binary dependencies and 100% reliability.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = Colors.text,
  style,
}) => {
  const s = size;
  const stroke = 1.8;

  switch (name) {
    case 'home':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.72,
              height: s * 0.72,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: s * 0.05,
            }}
          />
          <View
            style={{
              width: s * 0.62,
              height: s * 0.48,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
              position: 'absolute',
              bottom: s * 0.12,
            }}
          />
        </View>
      );

    case 'activity':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }, style]}>
          <View style={{ width: stroke * 1.4, height: s * 0.38, backgroundColor: color, borderRadius: 1, marginHorizontal: 1.5 }} />
          <View style={{ width: stroke * 1.4, height: s * 0.75, backgroundColor: color, borderRadius: 1, marginHorizontal: 1.5 }} />
          <View style={{ width: stroke * 1.4, height: s * 0.55, backgroundColor: color, borderRadius: 1, marginHorizontal: 1.5 }} />
          <View style={{ width: stroke * 1.4, height: s * 0.3, backgroundColor: color, borderRadius: 1, marginHorizontal: 1.5 }} />
        </View>
      );

    case 'devices':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.82,
              height: s * 0.82,
              borderRadius: s * 0.41,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.3,
                height: s * 0.3,
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
          <View
            style={{
              width: s * 0.38,
              height: s * 0.38,
              borderRadius: s * 0.19,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: s * 0.72,
              height: s * 0.32,
              borderTopLeftRadius: s * 0.36,
              borderTopRightRadius: s * 0.36,
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
          <View style={{ width: s * 0.65, height: stroke, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
          <View style={{ width: stroke, height: s * 0.65, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
        </View>
      );

    case 'chevron-right':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.32,
              height: s * 0.32,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginLeft: -s * 0.08,
            }}
          />
        </View>
      );

    case 'chevron-left':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.32,
              height: s * 0.32,
              borderBottomWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginRight: -s * 0.08,
            }}
          />
        </View>
      );

    case 'bluetooth':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ width: stroke, height: s * 0.78, backgroundColor: color }} />
          <View
            style={{
              width: s * 0.32,
              height: s * 0.32,
              borderRightWidth: stroke,
              borderTopWidth: stroke,
              borderColor: color,
              position: 'absolute',
              top: s * 0.12,
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              width: s * 0.32,
              height: s * 0.32,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              position: 'absolute',
              bottom: s * 0.12,
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
              width: s * 0.72,
              height: s * 0.42,
              borderRadius: 3,
              borderWidth: stroke,
              borderColor: color,
              padding: 1.5,
              justifyContent: 'center',
            }}
          >
            <View style={{ width: '70%', height: '100%', backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View style={{ width: stroke, height: s * 0.18, backgroundColor: color, borderTopRightRadius: 1, borderBottomRightRadius: 1 }} />
        </View>
      );

    case 'download':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ width: stroke, height: s * 0.5, backgroundColor: color, position: 'absolute', top: s * 0.15 }} />
          <View
            style={{
              width: s * 0.3,
              height: s * 0.3,
              borderBottomWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              position: 'absolute',
              top: s * 0.35,
            }}
          />
          <View style={{ width: s * 0.7, height: stroke, backgroundColor: color, position: 'absolute', bottom: s * 0.15 }} />
        </View>
      );

    case 'syringe':
    case 'pill':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.65,
              height: s * 0.32,
              borderRadius: s * 0.16,
              borderWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: stroke, height: '100%', backgroundColor: color }} />
          </View>
        </View>
      );

    case 'scale':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.75,
              height: s * 0.65,
              borderRadius: 4,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'flex-start',
              alignItems: 'center',
              paddingTop: 2,
            }}
          >
            <View style={{ width: s * 0.35, height: s * 0.2, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: stroke, borderColor: color }} />
          </View>
        </View>
      );

    case 'file-text':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.62,
              height: s * 0.78,
              borderRadius: 3,
              borderWidth: stroke,
              borderColor: color,
              padding: 2,
              justifyContent: 'space-around',
            }}
          >
            <View style={{ width: '70%', height: stroke, backgroundColor: color }} />
            <View style={{ width: '85%', height: stroke, backgroundColor: color }} />
            <View style={{ width: '50%', height: stroke, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.32,
              height: s * 0.58,
              borderBottomWidth: stroke * 1.3,
              borderRightWidth: stroke * 1.3,
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
              width: s * 0.78,
              height: s * 0.78,
              borderRadius: s * 0.39,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: stroke, height: s * 0.24, backgroundColor: color, position: 'absolute', top: s * 0.14 }} />
            <View style={{ width: s * 0.2, height: stroke, backgroundColor: color, position: 'absolute', right: s * 0.15 }} />
          </View>
        </View>
      );

    case 'shield':
    default:
      return (
        <View style={[{ width: s, height: s, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View
            style={{
              width: s * 0.75,
              height: s * 0.75,
              borderRadius: s * 0.375,
              borderWidth: stroke,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: stroke, height: s * 0.24, backgroundColor: color, marginBottom: 2 }} />
            <View style={{ width: stroke * 1.2, height: stroke * 1.2, borderRadius: stroke * 0.6, backgroundColor: color }} />
          </View>
        </View>
      );
  }
};

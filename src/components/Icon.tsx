import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/theme';

// Lucide icon components
import {
  House,
  Activity,
  Smartphone,
  UserRound,
  Plus,
  ChevronRight,
  ChevronLeft,
  Bluetooth,
  Battery,
  Flame,
  Moon,
  Heart,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  Shield,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  Syringe,
  Scale,
  Pill,
  FileText,
  PawPrint,
  Dog,
  Cat,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';

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
  | 'file-text'
  | 'paw'
  | 'dog'
  | 'cat'
  | 'camera'
  | 'image';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Standard Lucide React Native vector icons wrapper.
 * Provides backwards-compatible typed API matching the existing Pet Health design system.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = Colors.text,
  style,
}) => {
  const strokeWidth = 2;

  let IconComponent: React.ElementType;

  switch (name) {
    case 'home':
      IconComponent = House;
      break;
    case 'activity':
      IconComponent = Activity;
      break;
    case 'devices':
      IconComponent = Smartphone;
      break;
    case 'profile':
      IconComponent = UserRound;
      break;
    case 'plus':
      IconComponent = Plus;
      break;
    case 'chevron-right':
      IconComponent = ChevronRight;
      break;
    case 'chevron-left':
      IconComponent = ChevronLeft;
      break;
    case 'bluetooth':
      IconComponent = Bluetooth;
      break;
    case 'battery':
      IconComponent = Battery;
      break;
    case 'flame':
      IconComponent = Flame;
      break;
    case 'moon':
      IconComponent = Moon;
      break;
    case 'heart':
      IconComponent = Heart;
      break;
    case 'check':
      IconComponent = Check;
      break;
    case 'alert':
      IconComponent = AlertTriangle;
      break;
    case 'refresh':
      IconComponent = RefreshCw;
      break;
    case 'clock':
      IconComponent = Clock;
      break;
    case 'shield':
      IconComponent = Shield;
      break;
    case 'search':
      IconComponent = Search;
      break;
    case 'filter':
      IconComponent = Filter;
      break;
    case 'download':
      IconComponent = Download;
      break;
    case 'settings':
      IconComponent = Settings;
      break;
    case 'bell':
      IconComponent = Bell;
      break;
    case 'syringe':
      IconComponent = Syringe;
      break;
    case 'scale':
      IconComponent = Scale;
      break;
    case 'pill':
      IconComponent = Pill;
      break;
    case 'file-text':
      IconComponent = FileText;
      break;
    case 'paw':
      IconComponent = PawPrint;
      break;
    case 'dog':
      IconComponent = Dog;
      break;
    case 'cat':
      IconComponent = Cat;
      break;
    case 'camera':
      IconComponent = Camera;
      break;
    case 'image':
      IconComponent = ImageIcon;
      break;
    default:
      IconComponent = Shield;
      break;
  }

  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
    </View>
  );
};

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/theme';
import { Icon, IconName } from './Icon';

export type MainTabType = 'home' | 'activity' | 'devices' | 'profile';

interface BottomTabBarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const tabs: Array<{ id: MainTabType; label: string; icon: IconName }> = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'devices', label: 'Devices', icon: 'devices' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? Colors.primary : Colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => onTabChange(tab.id)}
            style={styles.tabBtn}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Icon name={tab.icon} size={20} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 64,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  activeIconWrapper: {
    backgroundColor: Colors.primaryLight,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

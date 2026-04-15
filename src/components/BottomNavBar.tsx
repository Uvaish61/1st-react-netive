import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../contexts/ThemeContext';

type TabKey = 'Home' | 'AddTask' | 'TaskStats' | 'ProgressReport' | 'Profile';

type BottomNavBarProps = {
  navigation: any;
  activeTab: TabKey;
};

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'Home', label: 'Dashboard', icon: 'home-outline' },
  { key: 'AddTask', label: 'Add Task', icon: 'add-circle-outline' },
  { key: 'TaskStats', label: 'Stats', icon: 'bar-chart-outline' },
  { key: 'ProgressReport', label: 'Progress', icon: 'analytics-outline' },
  { key: 'Profile', label: 'Profile', icon: 'person-circle-outline' },
];

const BottomNavItem: React.FC<{
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 90 }),
      withTiming(1, { duration: 140 }),
    );
    onPress();
  };

  return (
    <Animated.View style={[styles.itemWrap, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.95}
        style={[styles.item, isActive && styles.itemActive]}
        onPress={handlePress}
      >
        <Icon
          name={tab.icon}
          size={18}
          color={isActive ? '#FFFFFF' : '#B8BFCC'}
        />
        <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>{tab.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ navigation, activeTab }) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.outer}>
      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <BottomNavItem
              key={tab.key}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(tab.key);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default BottomNavBar;

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
  },
  bar: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  itemWrap: {
    flex: 1,
  },
  item: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  itemActive: {
    backgroundColor: '#4CAF50',
  },
  itemLabel: {
    color: '#B8BFCC',
    fontSize: 11,
    fontWeight: '600',
  },
  itemLabelActive: {
    color: '#FFFFFF',
  },
});

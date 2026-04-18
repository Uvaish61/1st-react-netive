import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import AddTaskScreen from '../../screens/AddTaskScreen';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import ProgressReportScreen from '../../screens/ProgressReportScreen';
import TaskStatsScreen from '../../screens/TaskStatsScreen';
import { useAppTheme } from '../../contexts/ThemeContext';

type TabParamList = {
  Home: undefined;
  AddTask: { mode?: 'create' | 'edit'; todo?: unknown } | undefined;
  TaskStats: undefined;
  ProgressReport: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const tabs = {
  Home: { label: 'Home', icon: 'home-outline' },
  AddTask: { label: 'Add', icon: 'add-circle-outline' },
  TaskStats: { label: 'Stats', icon: 'bar-chart-outline' },
  ProgressReport: { label: 'Report', icon: 'analytics-outline' },
  Profile: { label: 'Me', icon: 'person-circle-outline' },
} as const;

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[
        styles.bar,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = tabs[route.name as keyof typeof tabs];

          if (!tab) {
            return null;
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              testID={descriptors[route.key].options.tabBarButtonTestID}
              activeOpacity={0.92}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <View style={[styles.tabInner, isFocused && styles.tabInnerActive]}>
                <Icon
                  name={tab.icon}
                  size={20}
                  color={isFocused ? '#FFFFFF' : colors.subText}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: colors.subText },
                  isFocused && styles.tabLabelActive,
                ]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AddTask" component={AddTaskScreen} />
      <Tab.Screen name="TaskStats" component={TaskStatsScreen} />
      <Tab.Screen name="ProgressReport" component={ProgressReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: 2,
  },
  tabInner: {
    minHeight: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    gap: 2,
  },
  tabInnerActive: {
    backgroundColor: '#4CAF50',
  },
  tabLabel: {
    color: '#B8BFCC',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});

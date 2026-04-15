import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type TabKey = 'Home' | 'AddTask' | 'TaskStats' | 'ProgressReport';

type Props = {
  navigation: any;
  activeTab: TabKey;
};

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'Home', label: 'Dashboard', icon: 'home-outline' },
  { key: 'AddTask', label: 'Add Task', icon: 'add-circle-outline' },
  { key: 'TaskStats', label: 'Stats', icon: 'bar-chart-outline' },
  { key: 'ProgressReport', label: 'Progress', icon: 'analytics-outline' },
];

const MainScreensTabs: React.FC<Props> = ({ navigation, activeTab }) => {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => {
              if (!isActive) {
                navigation.navigate(tab.key);
              }
            }}
          >
            <Icon name={tab.icon} size={14} color={isActive ? '#FFFFFF' : '#B8BFCC'} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MainScreensTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#232730',
    borderWidth: 1,
    borderColor: '#2E333D',
    gap: 5,
  },
  tabButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabLabel: {
    color: '#B8BFCC',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});

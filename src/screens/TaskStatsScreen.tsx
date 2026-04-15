import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { loadTodos } from '../storage/todo.storage';
import { Todo } from '../types/todo.types';
import BottomNavBar from '../components/BottomNavBar';
import { useAppTheme } from '../contexts/ThemeContext';

type MetricProps = {
  label: string;
  value: number;
  color: string;
  delay: number;
};

const getDueDateTime = (todo: Pick<Todo, 'dueDate' | 'dueTime'>) => {
  if (!todo.dueDate) {
    return null;
  }

  const dueDateTime = new Date(todo.dueDate);

  if (todo.dueTime) {
    const dueTime = new Date(todo.dueTime);
    dueDateTime.setHours(
      dueTime.getHours(),
      dueTime.getMinutes(),
      dueTime.getSeconds(),
      dueTime.getMilliseconds(),
    );
  } else {
    dueDateTime.setHours(23, 59, 59, 999);
  }

  return dueDateTime;
};

const getTodoStatus = (todo: Todo) => {
  if (todo.completed) {
    return 'completed';
  }

  const dueDateTime = getDueDateTime(todo);

  if (!dueDateTime) {
    return 'pending';
  }

  return dueDateTime.getTime() < Date.now() ? 'overdue' : 'pending';
};

const MetricBar: React.FC<MetricProps> = ({ label, value, color, delay }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(Math.max(8, value), { duration: 800 }));
  }, [delay, value, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.metricItem}>
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <Animated.View style={[styles.metricFill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
};

const TaskStatsScreen: React.FC<any> = ({ navigation }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { colors, isDark } = useAppTheme();
  const cardShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.12,
    shadowRadius: 10,
    elevation: isDark ? 8 : 5,
  };
  const pillShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.22 : 0.09,
    shadowRadius: 6,
    elevation: isDark ? 4 : 3,
  };

  const loadData = useCallback(async () => {
    const localTodos = await loadTodos();
    setTodos(Array.isArray(localTodos) ? localTodos : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const stats = useMemo(() => {
    const total = todos.length;
    const pending = todos.filter(todo => getTodoStatus(todo) === 'pending').length;
    const completed = todos.filter(todo => todo.completed).length;
    const overdue = todos.filter(todo => getTodoStatus(todo) === 'overdue').length;

    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const onTrack = total ? Math.round(((pending + completed) / total) * 100) : 0;
    const overdueRate = total ? Math.round((overdue / total) * 100) : 0;

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate,
      onTrack,
      overdueRate,
    };
  }, [todos]);

  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: 'albums-outline', color: '#60A5FA' },
    { label: 'Pending', value: stats.pending, icon: 'time-outline', color: '#F59E0B' },
    { label: 'Completed', value: stats.completed, icon: 'checkmark-done-outline', color: '#34D399' },
    { label: 'Overdue', value: stats.overdue, icon: 'alert-circle-outline', color: '#F87171' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadowStyle]} onPress={() => navigation.navigate('Home')}>
          <Icon name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Task Stats</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Performance Snapshot</Text>
        <Text style={[styles.heroSubTitle, { color: colors.subText }]}>Your productivity pattern in one view</Text>

        <View style={styles.ringWrap}>
          <View style={[styles.ringOuter, { borderColor: colors.filterActive }]}>
            <View style={[styles.ringInner, { backgroundColor: colors.filterBg }]}>
              <Text style={[styles.ringValue, { color: colors.text }]}>{stats.completionRate}%</Text>
              <Text style={[styles.ringLabel, { color: colors.subText }]}>Completion</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map(item => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
            <View style={[styles.statIcon, { backgroundColor: `${item.color}22` }]}>
              <Icon name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: colors.subText }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
        <Text style={[styles.reportTitle, { color: colors.text }]}>Progress Report</Text>
        <Text style={[styles.reportSub, { color: colors.subText }]}>Animated insight bars</Text>

        <MetricBar label="Completion" value={stats.completionRate} color="#22C55E" delay={0} />
        <MetricBar label="On Track" value={stats.onTrack} color="#38BDF8" delay={100} />
        <MetricBar label="Overdue Ratio" value={stats.overdueRate} color="#F87171" delay={200} />
      </View>
      </ScrollView>
      <BottomNavBar navigation={navigation} activeTab="TaskStats" />
    </View>
  );
};

export default TaskStatsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 104,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#181B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  heroCard: {
    borderRadius: 18,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroSubTitle: {
    color: '#B8BFCC',
    fontSize: 13,
    marginTop: 3,
    marginBottom: 14,
  },
  ringWrap: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#232730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  ringLabel: {
    color: '#B8BFCC',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
    padding: 14,
    marginBottom: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: '#B8BFCC',
    marginTop: 4,
  },
  reportCard: {
    borderRadius: 16,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
    padding: 16,
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  reportSub: {
    color: '#B8BFCC',
    marginTop: 3,
    marginBottom: 12,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    color: '#D0D7E4',
    fontSize: 13,
  },
  metricValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2E333D',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 999,
  },
});

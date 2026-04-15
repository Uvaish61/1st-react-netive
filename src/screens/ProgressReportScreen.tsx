import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { loadTodos } from '../storage/todo.storage';
import { Todo } from '../types/todo.types';
import BottomNavBar from '../components/BottomNavBar';
import { useAppTheme } from '../contexts/ThemeContext';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ProgressBar: React.FC<{ value: number; color: string; delay: number }> = ({ value, color, delay }) => {
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withDelay(delay, withTiming(value, { duration: 750 }));
  }, [delay, value, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
};

const ProgressReportScreen: React.FC<any> = ({ navigation }) => {
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

  const data = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const counts = new Array(7).fill(0);
    const completedCounts = new Array(7).fill(0);

    todos.forEach(todo => {
      const sourceDate = todo.dueDate || todo.completedAt;
      if (!sourceDate) {
        return;
      }

      const date = new Date(sourceDate);
      if (date < start) {
        return;
      }

      const dayGap = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (dayGap < 0 || dayGap > 6) {
        return;
      }

      counts[dayGap] += 1;
      if (todo.completed) {
        completedCounts[dayGap] += 1;
      }
    });

    const maxValue = Math.max(1, ...counts);
    const weekTotal = counts.reduce((sum, value) => sum + value, 0);
    const weekCompleted = completedCounts.reduce((sum, value) => sum + value, 0);
    const weeklyRate = weekTotal ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    const bars = counts.map((value, index) => ({
      day: dayNames[(start.getDay() + index) % 7],
      value,
      completed: completedCounts[index],
      heightPercent: Math.max(12, Math.round((value / maxValue) * 100)),
    }));

    return {
      weekTotal,
      weekCompleted,
      weeklyRate,
      bars,
    };
  }, [todos]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadowStyle]} onPress={() => navigation.navigate('Home')}>
          <Icon name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Progress Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
        <Text style={[styles.heroHeading, { color: colors.subText }]}>This Week Focus</Text>
        <Text style={[styles.heroRate, { color: colors.text }]}>{data.weeklyRate}%</Text>
        <Text style={[styles.heroMeta, { color: colors.subText }]}>
          {data.weekCompleted} complete out of {data.weekTotal} planned tasks
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Activity</Text>
          <Icon name="pulse-outline" size={18} color="#7DD3FC" />
        </View>

        <View style={styles.barsRow}>
          {data.bars.map((item, index) => (
            <View key={item.day} style={styles.barItem}>
              <View style={styles.barTrack}>
                <Animated.View
                  entering={FadeInDown.delay(100 + index * 70).duration(450)}
                  style={[styles.barFill, { height: `${item.heightPercent}%` }]}
                />
              </View>
              <Text style={[styles.barDay, { color: colors.subText }]}>{item.day}</Text>
              <Text style={[styles.barValue, { color: colors.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)} style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
        <Text style={[styles.insightTitle, { color: colors.text }]}>Performance Mix</Text>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.subText }]}>Completion Strength</Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>{data.weeklyRate}%</Text>
        </View>
        <ProgressBar value={data.weeklyRate} color="#22C55E" delay={0} />

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.subText }]}>Planning Load</Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>{Math.min(100, data.weekTotal * 10)}%</Text>
        </View>
        <ProgressBar value={Math.min(100, data.weekTotal * 10)} color="#38BDF8" delay={120} />

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.subText }]}>Execution Consistency</Text>
          <Text style={[styles.metricVal, { color: colors.text }]}>{Math.min(100, data.weekCompleted * 14)}%</Text>
        </View>
        <ProgressBar value={Math.min(100, data.weekCompleted * 14)} color="#A78BFA" delay={240} />
      </Animated.View>
      </ScrollView>
      <BottomNavBar navigation={navigation} activeTab="ProgressReport" />
    </View>
  );
};

export default ProgressReportScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 108,
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
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
  },
  heroHeading: {
    color: '#B8BFCC',
    fontSize: 14,
    fontWeight: '600',
  },
  heroRate: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
  },
  heroMeta: {
    color: '#B8BFCC',
    marginTop: 2,
    fontSize: 13,
  },
  chartCard: {
    borderRadius: 18,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
    padding: 16,
    marginBottom: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  barItem: {
    alignItems: 'center',
    width: '13%',
  },
  barTrack: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#2E333D',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#60A5FA',
  },
  barDay: {
    color: '#B8BFCC',
    marginTop: 6,
    fontSize: 11,
  },
  barValue: {
    color: '#E7ECF6',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },
  insightCard: {
    borderRadius: 18,
    backgroundColor: '#181B20',
    borderWidth: 1,
    borderColor: '#2E333D',
    padding: 16,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    color: '#D0D7E4',
    fontSize: 13,
  },
  metricVal: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2E333D',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});

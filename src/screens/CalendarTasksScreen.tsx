import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAppTheme } from '../contexts/ThemeContext';

const previewDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarTasksScreen: React.FC<any> = ({ navigation }) => {
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadowStyle]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Calendar View</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
          <View style={styles.heroIconWrap}>
            <Icon name="calendar-clear-outline" size={22} color="#38BDF8" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Plan by date</Text>
            <Text style={[styles.heroSubTitle, { color: colors.subText }]}>
              Switch from list mode to date-focused planning.
            </Text>
          </View>
        </View>

        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Week Preview</Text>
          <View style={styles.weekRow}>
            {previewDays.map((day, index) => (
              <View
                key={day}
                style={[
                  styles.dayPill,
                  { backgroundColor: index === 2 ? colors.filterActive : colors.filterBg },
                ]}
              >
                <Text style={[styles.dayLabel, { color: index === 2 ? '#FFFFFF' : colors.text }]}>{day}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.previewText, { color: colors.subText }]}>
            Date-based task listing next subtask me yahin render hogi.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default CalendarTasksScreen;

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#38BDF822',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroSubTitle: {
    marginTop: 4,
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    minWidth: 62,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewText: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 20,
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';

import { Todo } from '../types/todo.types';
import { loadTodos, saveTodo } from '../storage/todo.storage';
import { cancelTodoReminder, syncTodoReminders } from '../utils/todoNotifications';
import notifee, { EventType } from '@notifee/react-native';
import BottomNavBar from '../components/BottomNavBar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useAppTheme } from '../contexts/ThemeContext';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type CategoryType = 'Work' | 'Personal' | 'Study';
type RepeatType = 'none' | 'daily' | 'weekly';
type SortType = 'dueDate' | 'priority' | 'title' | 'createdAt';

const DEFAULT_PRIORITY = 'Medium';
const DEFAULT_CATEGORY: CategoryType = 'Personal';
const DEFAULT_REPEAT: RepeatType = 'none';

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const getDueDateTime = (todo: Pick<Todo, 'dueDate' | 'dueTime'>) => {
  if (!todo.dueDate) {
    return null;
  }

  const dueDateTime = new Date(todo.dueDate);

  if (todo.dueTime) {
    const time = new Date(todo.dueTime);
    dueDateTime.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    );
  } else {
    dueDateTime.setHours(23, 59, 59, 999);
  }

  return dueDateTime;
};

const getTodoStatus = (todo: Todo): Exclude<FilterType, 'all'> => {
  if (todo.completed) {
    return 'completed';
  }

  const dueDateTime = getDueDateTime(todo);

  if (!dueDateTime) {
    return 'pending';
  }

  return dueDateTime.getTime() < Date.now() ? 'overdue' : 'pending';
};

const normalizeTodo = (todo: Todo): Todo => ({
  ...todo,
  completed: typeof todo.completed === 'boolean' ? todo.completed : false,
  dueDate: todo.dueDate || null,
  dueTime: todo.dueTime || null,
  completedAt: todo.completedAt || null,
  priority: todo.priority || DEFAULT_PRIORITY,
  category: (todo.category as CategoryType) || DEFAULT_CATEGORY,
  repeat: (todo.repeat as RepeatType) || DEFAULT_REPEAT,
  status: todo.completed ? 'completed' : getTodoStatus(todo),
});

const sortTodosByDueDate = (left: Todo, right: Todo) => {
  const leftDueDate = getDueDateTime(left);
  const rightDueDate = getDueDateTime(right);

  if (!leftDueDate && !rightDueDate) {
    return Number(right.id) - Number(left.id);
  }

  if (!leftDueDate) {
    return 1;
  }

  if (!rightDueDate) {
    return -1;
  }

  return leftDueDate.getTime() - rightDueDate.getTime();
};

const sortTodos = (a: Todo, b: Todo, sortBy: SortType, sortOrder: 'asc' | 'desc'): number => {
  let result: number;

  switch (sortBy) {
    case 'priority':
      result = (PRIORITY_ORDER[a.priority || DEFAULT_PRIORITY] ?? 1) - (PRIORITY_ORDER[b.priority || DEFAULT_PRIORITY] ?? 1);
      break;
    case 'title':
      result = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      break;
    case 'createdAt':
      result = Number(b.id) - Number(a.id);
      break;
    case 'dueDate':
    default:
      result = sortTodosByDueDate(a, b);
  }

  return sortOrder === 'desc' ? -result : result;
};

const removeLegacyRecurringClones = (items: Todo[]) => {
  const byId = new Map(items.map(item => [item.id, item]));

  return items.filter(item => {
    const separatorIndex = item.id.indexOf('-');

    if (separatorIndex <= 0) {
      return true;
    }

    const parentId = item.id.slice(separatorIndex + 1);
    const parent = byId.get(parentId);

    if (!parent) {
      return true;
    }

    // Cleanup old auto-generated next task created by previous completion logic.
    const sameTitle = parent.title === item.title;
    const parentCompleted = parent.completed;
    const childPending = !item.completed;

    return !(sameTitle && parentCompleted && childPending);
  });
};

const HomeScreen: React.FC<any> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; id?: string; bulk?: boolean }>({ visible: false });
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [newNotifCount, setNewNotifCount] = useState(0);
  const { isDark, colors, toggleTheme } = useAppTheme();

  const animations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const bellAnim = useRef(new Animated.Value(0)).current;

  const saveTodosWithSideEffects = async (nextTodos: Todo[]) => {
    const cleanedTodos = removeLegacyRecurringClones(nextTodos);
    setTodos(cleanedTodos);
    await saveTodo(cleanedTodos);
    await syncTodoReminders(cleanedTodos);
  };

  const refreshStatuses = useCallback(async (sourceTodos?: Todo[]) => {
    const baseTodos = sourceTodos || todos;
    const normalizedTodos = baseTodos.map(normalizeTodo);
    const hasChanges = normalizedTodos.some(
      (todo, index) =>
        todo.status !== baseTodos[index]?.status ||
        todo.priority !== baseTodos[index]?.priority ||
        todo.category !== baseTodos[index]?.category,
    );

    if (!sourceTodos && !hasChanges) {
      return;
    }

    if (hasChanges) {
      setTodos(normalizedTodos);
      await saveTodo(normalizedTodos);
    } else if (sourceTodos) {
      setTodos(normalizedTodos);
    }

    await syncTodoReminders(normalizedTodos);
  }, [todos]);

  const reloadTodos = useCallback(async () => {
    const localTodos = await loadTodos();
    const sanitizedTodos = Array.isArray(localTodos)
      ? removeLegacyRecurringClones(localTodos)
      : [];

    const normalizedTodos = sanitizedTodos.map(normalizeTodo);

    if (Array.isArray(localTodos) && sanitizedTodos.length !== localTodos.length) {
      await saveTodo(normalizedTodos);
    }

    await refreshStatuses(normalizedTodos);
  }, [refreshStatuses]);

  useFocusEffect(
    useCallback(() => {
      reloadTodos();
    }, [reloadTodos]),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshStatuses();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [refreshStatuses]);

  const getAnimation = (id: string) => {
    if (!animations[id]) {
      animations[id] = new Animated.Value(1);
    }

    return animations[id];
  };

  const filteredTodos = useMemo(
    () =>
      todos.filter(todo => {
        const matchesSearch = todo.title
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());

        const currentStatus = getTodoStatus(todo);
        const matchesFilter =
          activeFilter === 'all' ? true : currentStatus === activeFilter;

        return matchesSearch && matchesFilter;
      }),
    [activeFilter, searchQuery, todos],
  );

  const summary = useMemo(
    () => ({
      total: todos.length,
      pending: todos.filter(todo => getTodoStatus(todo) === 'pending').length,
      overdue: todos.filter(todo => getTodoStatus(todo) === 'overdue').length,
      completed: todos.filter(todo => todo.completed).length,
    }),
    [todos],
  );

  const completionRate = useMemo(() => {
    if (!summary.total) {
      return 0;
    }

    return Math.round((summary.completed / summary.total) * 100);
  }, [summary.completed, summary.total]);

  const activeTodos = useMemo(
    () => filteredTodos.filter(todo => !todo.completed).sort((a, b) => sortTodos(a, b, sortBy, sortOrder)),
    [filteredTodos, sortBy, sortOrder],
  );

  const completedTodos = useMemo(
    () =>
      filteredTodos
        .filter(todo => todo.completed)
        .sort((left, right) => {
          const leftCompleted = left.completedAt ? new Date(left.completedAt).getTime() : 0;
          const rightCompleted = right.completedAt ? new Date(right.completedAt).getTime() : 0;
          return rightCompleted - leftCompleted;
        }),
    [filteredTodos],
  );

  const upcomingTasks = useMemo(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return activeTodos.filter(todo => {
      const dt = getDueDateTime(todo);
      if (!dt) { return false; }
      const diff = dt.getTime() - now;
      return diff > 0 && diff <= oneHour;
    });
  }, [activeTodos]);

  const badgeCount = upcomingTasks.length + newNotifCount;

  const bellRotation = bellAnim.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-15deg', '15deg'],
  });

  const ringBell = useCallback(() => {
    bellAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bellAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(bellAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [bellAnim]);

  const handleBellPress = useCallback(() => {
    ringBell();
    setNewNotifCount(0);
    setShowNotifPanel(true);
  }, [ringBell]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.DELIVERED) {
        ringBell();
        setNewNotifCount(prev => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [ringBell]);

  const showCompletedSection = activeFilter === 'all';
  const listData = showCompletedSection ? activeTodos : filteredTodos.sort(sortTodosByDueDate);

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id];

      if (!next.length) {
        setSelectionMode(false);
      }

      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const selectAll = () => {
    setSelectedIds(listData.map(todo => todo.id));
  };

  const bulkComplete = async () => {
    const updated = todos.map(todo =>
      selectedIds.includes(todo.id) && !todo.completed
        ? normalizeTodo({ ...todo, completed: true, completedAt: new Date().toISOString(), status: 'completed' })
        : todo,
    );

    await saveTodosWithSideEffects(updated);
    exitSelectionMode();
  };

  const bulkDelete = () => {
    setDeleteModal({ visible: true, bulk: true });
  };

  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    await cancelTodoReminder(id);
    await saveTodosWithSideEffects(updatedTodos);
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ visible: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.bulk) {
      const updated = todos.filter(todo => !selectedIds.includes(todo.id));
      setDeleteModal({ visible: false });
      await saveTodosWithSideEffects(updated);
      exitSelectionMode();
    } else if (deleteModal.id) {
      const id = deleteModal.id;
      setDeleteModal({ visible: false });
      await deleteTodo(id);
    }
  };

  const toggleComplete = async (id: string) => {
    const anim = getAnimation(id);

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.8,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    const updatedTodos = todos.map(todo => {
      if (todo.id !== id) {
        return todo;
      }

      const nextCompleted = !todo.completed;

      return normalizeTodo({
        ...todo,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : null,
        status: nextCompleted ? 'completed' : 'pending',
      });
    });

    await saveTodosWithSideEffects(updatedTodos);
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity style={styles.deleteSwipe} onPress={() => confirmDelete(id)}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const theme = colors;
  const cardShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.32 : 0.14,
    shadowRadius: 10,
    elevation: isDark ? 8 : 5,
  };
  const pillShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.24 : 0.1,
    shadowRadius: 6,
    elevation: isDark ? 4 : 3,
  };
  const todoCardShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.34 : 0.16,
    shadowRadius: 12,
    elevation: isDark ? 10 : 6,
  };

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const anim = getAnimation(item.id);
    const currentStatus = getTodoStatus(item);
    const hasReminder = Boolean(item.dueDate && item.dueTime && !item.completed);
    const isSelected = selectedIds.includes(item.id);
    const statusRailBg =
      currentStatus === 'completed'
        ? isDark
          ? '#1F3B2A'
          : '#DCFCE7'
        : currentStatus === 'overdue'
          ? isDark
            ? '#3F2326'
            : '#FEE2E2'
          : isDark
            ? '#27303C'
            : '#E2E8F0';
    const statusRailText =
      currentStatus === 'completed'
        ? '#22C55E'
        : currentStatus === 'overdue'
          ? '#EF4444'
          : isDark
            ? '#94A3B8'
            : '#475569';
    const statusIcon =
      currentStatus === 'completed'
        ? 'checkmark-done-outline'
        : currentStatus === 'overdue'
          ? 'alert-circle-outline'
          : 'time-outline';

    return (
      <Swipeable enabled={!selectionMode} renderRightActions={() => renderRightActions(item.id)}>
        <Animated.View
          style={[
            styles.todoItem,
            {
              backgroundColor: theme.card,
              transform: [{ scale: anim }],
              opacity: anim,
            },
            todoCardShadowStyle,
            isSelected && styles.todoItemSelected,
          ]}
        >
          <View style={styles.todoMainContent}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                selectionMode
                  ? isSelected
                    ? styles.checkboxSelected
                    : null
                  : item.completed && styles.checkboxChecked,
              ]}
              onPress={() =>
                selectionMode ? toggleSelection(item.id) : toggleComplete(item.id)
              }
              onLongPress={() => enterSelectionMode(item.id)}
            >
              {selectionMode && isSelected && (
                <Icon name="checkmark" size={12} color="#fff" />
              )}
            </TouchableOpacity>

            <View style={styles.todoBody}>
              <View style={styles.todoHeaderRow}>
                <Text style={[styles.todoTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.filterBg }]}
                    onPress={() => navigation.navigate('AddTask', { mode: 'edit', todo: item })}
                  >
                    <Icon name="create-outline" size={16} color={theme.text} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.filterBg }]}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Icon name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.todoMeta, { color: theme.subText }]}>Status: {currentStatus}</Text>
              <Text style={[styles.todoMeta, { color: theme.subText }]}>
                Priority: {item.priority || DEFAULT_PRIORITY} | Category: {item.category || DEFAULT_CATEGORY}
              </Text>
              <Text style={[styles.todoMeta, { color: theme.subText }]}>Repeat: {item.repeat || DEFAULT_REPEAT}</Text>
              {hasReminder && <Text style={[styles.todoMeta, { color: theme.subText }]}>Reminder scheduled</Text>}

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {item.tags.map(tag => (
                    <View key={tag.id} style={[styles.tagBadge, { backgroundColor: tag.color }]}>
                      <Text style={styles.tagBadgeText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.notes && (
                <TouchableOpacity
                  onPress={() =>
                    setExpandedNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  style={styles.notesRow}
                >
                  <Icon name="document-text-outline" size={13} color={theme.subText} />
                  <Text
                    style={[styles.notesText, { color: theme.subText }]}
                    numberOfLines={expandedNotes[item.id] ? undefined : 1}
                  >
                    {item.notes}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.statusRail, { backgroundColor: statusRailBg }]}>
            <Icon name={statusIcon} size={20} color={statusRailText} />
            <Text style={[styles.statusRailLabel, { color: statusRailText }]}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Text>
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={[styles.container, { backgroundColor: theme.bg }]}> 
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: theme.card }, pillShadowStyle]}
          onPress={() => navigation.navigate('TaskStats')}
        >
          <Icon name="bar-chart-outline" size={18} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: theme.card }, pillShadowStyle]}
          onPress={() => navigation.navigate('ProgressReport')}
        >
          <Icon name="analytics-outline" size={18} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: theme.card }, pillShadowStyle]}
          onPress={toggleTheme}
        >
          <Icon name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: theme.card }]}>
          <Text style={[styles.selectionCount, { color: theme.text }]}>
            {selectedIds.length} selected
          </Text>
          <TouchableOpacity style={styles.selectionBarBtn} onPress={selectAll}>
            <Icon name="checkmark-done-outline" size={16} color={theme.text} />
            <Text style={[styles.selectionBarBtnText, { color: theme.text }]}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionBarBtn} onPress={exitSelectionMode}>
            <Icon name="close-outline" size={18} color={theme.text} />
            <Text style={[styles.selectionBarBtnText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.title, { color: theme.text }]}>My Task</Text>

      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }, cardShadowStyle]}> 
        <View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Focus Dashboard</Text>
          <Text style={[styles.heroSubText, { color: theme.subText }]}>Today completion: {completionRate}%</Text>
        </View>
        <TouchableOpacity style={styles.heroAction} onPress={() => navigation.navigate('AddTask', { mode: 'create' })}>
          <Icon name="add" size={16} color="#fff" />
          <Text style={styles.heroActionText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadowStyle]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.total}</Text>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadowStyle]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.pending}</Text>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadowStyle]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.completed}</Text>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>Completed</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, cardShadowStyle]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.overdue}</Text>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>Overdue</Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border }, cardShadowStyle]}> 
        <Icon name="search-outline" size={18} color={theme.subText} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRowContainer}>
        <View style={[styles.filterRow, { flex: 1 }]}> 
          {(['all', 'pending', 'completed', 'overdue'] as FilterType[]).map(filter => {
            const isActive = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  pillShadowStyle,
                  {
                    backgroundColor: isActive ? theme.filterActive : theme.filterBg,
                  },
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : theme.text }]}> 
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: theme.filterBg }, pillShadowStyle]}
          onPress={() => setShowSortModal(true)}
        >
          <Icon
            name={sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
            size={18}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>No tasks found for this filter.</Text>
        }
        renderItem={renderTodoItem}
        ListFooterComponent={
          showCompletedSection && completedTodos.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Completed Tasks ({completedTodos.length})</Text>
              {completedTodos.map(todo => (
                <View key={todo.id}>{renderTodoItem({ item: todo })}</View>
              ))}
            </View>
          ) : null
        }
      />

      <Modal visible={showSortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }, cardShadowStyle]}> 
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sort By</Text>
            {(
              [
                { key: 'dueDate', label: 'Due Date', icon: 'calendar-outline' },
                { key: 'priority', label: 'Priority', icon: 'flag-outline' },
                { key: 'title', label: 'Title (A-Z)', icon: 'text-outline' },
                { key: 'createdAt', label: 'Created Date', icon: 'time-outline' },
              ] as { key: SortType; label: string; icon: string }[]
            ).map(option => {
              const isActive = sortBy === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    { borderBottomColor: theme.border },
                    isActive && { backgroundColor: theme.filterBg, borderRadius: 8 },
                  ]}
                  onPress={() => {
                    setSortBy(option.key);
                    setShowSortModal(false);
                  }}
                >
                  <Icon name={option.icon} size={18} color={isActive ? '#4CAF50' : theme.text} />
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: isActive ? '#4CAF50' : theme.text, fontWeight: isActive ? '700' : '500' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive && <Icon name="checkmark-outline" size={18} color="#4CAF50" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.sortOrderToggle, { backgroundColor: theme.filterBg }]}
              onPress={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            >
              <Icon
                name={sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                size={16}
                color={theme.text}
              />
              <Text style={[styles.sortOptionText, { color: theme.text }]}>
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectionMode && selectedIds.length > 0 && (
        <View style={[styles.bulkActionBar, { backgroundColor: theme.card }, cardShadowStyle]}> 
          <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: '#4CAF50' }]} onPress={bulkComplete}>
            <Icon name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.bulkBtnText}>Complete All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkBtn, { backgroundColor: '#ef4444' }]} onPress={bulkDelete}>
            <Icon name="trash-outline" size={18} color="#fff" />
            <Text style={styles.bulkBtnText}>Delete All</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomNavBar navigation={navigation} activeTab="Home" />

      <DeleteConfirmModal
        visible={deleteModal.visible}
        title={deleteModal.bulk ? `Delete ${selectedIds.length} Task${selectedIds.length !== 1 ? 's' : ''}` : 'Delete Task'}
        message={deleteModal.bulk ? 'All selected tasks will be permanently removed.' : 'This action cannot be undone.'}
        onCancel={() => setDeleteModal({ visible: false })}
        onConfirm={handleDeleteConfirm}
      />
    </View>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 92,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 6,
  },
  topBarBtn: {
    padding: 8,
    borderRadius: 10,
  },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 10 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroSubText: {
    marginTop: 4,
    fontSize: 13,
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  heroActionText: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  summaryCard: {
    minWidth: 74,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
  },
  filterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sortOrderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  todoItem: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  todoMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  todoBody: {
    flex: 1,
  },
  todoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  todoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    flex: 1,
  },
  todoMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  deleteSwipe: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginBottom: 10,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  statusRail: {
    width: 82,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  statusRailLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  completedSection: {
    marginTop: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tagBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  tagBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor:'rgba(239, 83, 80, 0.15)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  selectionBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectionBarBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todoItemSelected: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bulkBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

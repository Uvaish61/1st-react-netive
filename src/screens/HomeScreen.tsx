import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';

import { Tag, Todo } from '../types/todo.types';
import { loadTodos, saveTodo } from '../storage/todo.storage';
import {
  cancelTodoReminder,
  syncTodoReminders,
} from '../utils/todoNotifications';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type PriorityType = 'High' | 'Medium' | 'Low';
type CategoryType = 'Work' | 'Personal' | 'Study';
type RepeatType = 'none' | 'daily' | 'weekly';
type SortType = 'dueDate' | 'priority' | 'title' | 'createdAt';

const DEFAULT_PRIORITY: PriorityType = 'Medium';
const DEFAULT_CATEGORY: CategoryType = 'Personal';
const DEFAULT_REPEAT: RepeatType = 'none';

const TAG_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

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
  priority: (todo.priority as PriorityType) || DEFAULT_PRIORITY,
  category: (todo.category as CategoryType) || DEFAULT_CATEGORY,
  repeat: (todo.repeat as RepeatType) || DEFAULT_REPEAT,
  status: todo.completed ? 'completed' : getTodoStatus(todo),
});

const getNextRecurringDate = (todo: Todo) => {
  if (!todo.dueDate || !todo.repeat || todo.repeat === 'none') {
    return null;
  }

  const nextDate = new Date(todo.dueDate);

  if (todo.repeat === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (todo.repeat === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate.toISOString();
};

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

const sortTodos = (a: Todo, b: Todo, sortBy: SortType): number => {
  switch (sortBy) {
    case 'priority':
      return (PRIORITY_ORDER[a.priority || 'Medium'] ?? 1) - (PRIORITY_ORDER[b.priority || 'Medium'] ?? 1);
    case 'title':
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    case 'createdAt':
      return Number(b.id) - Number(a.id);
    case 'dueDate':
    default:
      return sortTodosByDueDate(a, b);
  }
};

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

const HomeScreen: React.FC<any> = () => {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [priority, setPriority] = useState<PriorityType>(DEFAULT_PRIORITY);
  const [category, setCategory] = useState<CategoryType>(DEFAULT_CATEGORY);
  const [repeat, setRepeat] = useState<RepeatType>(DEFAULT_REPEAT);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('dueDate');

  const animations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const resetForm = () => {
    setEditingTodoId(null);
    setInput('');
    setDueDate(null);
    setDueTime(null);
    setPriority(DEFAULT_PRIORITY);
    setCategory(DEFAULT_CATEGORY);
    setRepeat(DEFAULT_REPEAT);
    setSelectedTags([]);
    setTagInput('');
    setSelectedTagColor(TAG_COLORS[0]);
    setNotes('');
    setShowNotesInput(false);
  };

  const addTag = () => {
    const name = tagInput.trim();
    if (!name) return;
    if (selectedTags.find(t => t.name.toLowerCase() === name.toLowerCase())) return;
    setSelectedTags(prev => [...prev, { id: Date.now().toString(), name, color: selectedTagColor }]);
    setTagInput('');
  };

  const removeTag = (id: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== id));
  };

  const enterSelectionMode = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length === 0) setSelectionMode(false);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const selectAll = () => {
    setSelectedIds(listData.map(t => t.id));
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
    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${selectedIds.length} task(s)?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = todos.filter(todo => !selectedIds.includes(todo.id));
            await saveTodosWithSideEffects(updated);
            exitSelectionMode();
          },
        },
      ],
    );
  };

  const saveTodosWithSideEffects = async (nextTodos: Todo[]) => {
    setTodos(nextTodos);
    await saveTodo(nextTodos);
    await syncTodoReminders(nextTodos);
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

  const activeTodos = useMemo(
    () => filteredTodos.filter(todo => !todo.completed).sort(sortTodosByDueDate),
    [filteredTodos],
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

  useEffect(() => {
    const fetchTodos = async () => {
      const localTodos = await loadTodos();
      const normalizedTodos = Array.isArray(localTodos)
        ? localTodos.map(normalizeTodo)
        : [];

      await refreshStatuses(normalizedTodos);
    };

    fetchTodos();
  }, [refreshStatuses]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshStatuses();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [refreshStatuses]);

  const addTodo = async () => {
    if (input.trim() === '') {
      return;
    }

    if (editingTodoId) {
      const updatedTodos = todos.map(todo =>
        todo.id === editingTodoId
          ? normalizeTodo({
              ...todo,
              title: input.trim(),
              dueDate: dueDate ? dueDate.toISOString() : null,
              dueTime: dueTime ? dueTime.toISOString() : null,
              priority,
              category,
              repeat,
              tags: selectedTags,
              notes: notes.trim() || undefined,
            })
          : todo,
      );

      await saveTodosWithSideEffects(updatedTodos);
      resetForm();
      return;
    }

    const newTodo = normalizeTodo({
      id: Date.now().toString(),
      title: input.trim(),
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : null,
      dueTime: dueTime ? dueTime.toISOString() : null,
      status: 'pending',
      completedAt: null,
      priority,
      category,
      repeat,
      tags: selectedTags,
      notes: notes.trim() || undefined,
    });

    await saveTodosWithSideEffects([...todos, newTodo]);
    resetForm();
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setInput(todo.title);
    setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
    setDueTime(todo.dueTime ? new Date(todo.dueTime) : null);
    setPriority(todo.priority || DEFAULT_PRIORITY);
    setCategory(todo.category || DEFAULT_CATEGORY);
    setRepeat(todo.repeat || DEFAULT_REPEAT);
    setSelectedTags(todo.tags || []);
    setNotes(todo.notes || '');
    setShowNotesInput(!!todo.notes);
  };

  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    await cancelTodoReminder(id);
    await saveTodosWithSideEffects(updatedTodos);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => deleteTodo(id) },
    ]);
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

    const completedTodo = updatedTodos.find(todo => todo.id === id);

    if (
      completedTodo?.completed &&
      completedTodo.repeat &&
      completedTodo.repeat !== 'none'
    ) {
      const nextDueDate = getNextRecurringDate(completedTodo);

      if (nextDueDate) {
        updatedTodos.push(
          normalizeTodo({
            ...completedTodo,
            id: `${Date.now()}-${completedTodo.id}`,
            completed: false,
            completedAt: null,
            dueDate: nextDueDate,
            status: 'pending',
          }),
        );
      }
    }

    await saveTodosWithSideEffects(updatedTodos);
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      style={styles.deleteSwipe}
      onPress={() => confirmDelete(id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const theme = darkMode
    ? {
        bg: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        subText: '#BBBBBB',
        input: '#2A2A2A',
        border: '#333333',
        filterBg: '#2A2A2A',
        filterActive: '#4CAF50',
      }
    : {
        bg: '#F8F9FA',
        card: '#FFFFFF',
        text: '#000000',
        subText: '#555',
        input: '#FFFFFF',
        border: '#D1D5DB',
        filterBg: '#E5E7EB',
        filterActive: '#4CAF50',
      };

  const showCompletedSection = activeFilter === 'all';
  const listData = showCompletedSection ? activeTodos : filteredTodos.sort(sortTodosByDueDate);

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const anim = getAnimation(item.id);
    const currentStatus = getTodoStatus(item);
    const hasReminder = Boolean(item.dueDate && item.dueTime && !item.completed);
    const isSelected = selectedIds.includes(item.id);

    return (
      <Swipeable
        enabled={!selectionMode}
        renderRightActions={() => renderRightActions(item.id)}
      >
        <Animated.View
          style={[
            styles.todoItem,
            {
              backgroundColor: theme.card,
              transform: [{ scale: anim }],
              opacity: anim,
            },
            isSelected && styles.todoItemSelected,
          ]}
        >
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

          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text }}>{item.title}</Text>
            <Text style={{ color: theme.subText }}>Status: {currentStatus}</Text>
            <Text style={{ color: theme.subText }}>
              Priority: {item.priority || DEFAULT_PRIORITY} | Category: {item.category || DEFAULT_CATEGORY}
            </Text>
            <Text style={{ color: theme.subText }}>
              Repeat: {item.repeat || DEFAULT_REPEAT}
            </Text>
            {hasReminder && (
              <Text style={{ color: theme.subText }}>Reminder scheduled</Text>
            )}
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

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => startEditing(item)}
            >
              <Icon name="create-outline" size={18} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmDelete(item.id)}>
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity
        style={{ alignSelf: 'flex-end', marginBottom: 10 }}
        onPress={() => setDarkMode(!darkMode)}
      >
        <Text style={{ color: theme.text }}>
          {darkMode ? 'Light' : 'Dark'}
        </Text>
      </TouchableOpacity>

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

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.total}</Text>
          <Text style={{ color: theme.subText }}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.pending}</Text>
          <Text style={{ color: theme.subText }}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.completed}</Text>
          <Text style={{ color: theme.subText }}>Completed</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryCount, { color: theme.text }]}>{summary.overdue}</Text>
          <Text style={{ color: theme.subText }}>Overdue</Text>
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.input, borderColor: theme.border },
        ]}
      >
        <Icon name="search-outline" size={18} color={theme.subText} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed', 'overdue'] as FilterType[]).map(filter => {
          const isActive = activeFilter === filter;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive ? theme.filterActive : theme.filterBg,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFFFFF' : theme.text },
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.optionSection}>
        <Text style={[styles.optionLabel, { color: theme.text }]}>Priority</Text>
        <View style={styles.optionRow}>
          {(['High', 'Medium', 'Low'] as PriorityType[]).map(item => {
            const isActive = priority === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  { backgroundColor: isActive ? theme.filterActive : theme.filterBg },
                ]}
                onPress={() => setPriority(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.optionSection}>
        <Text style={[styles.optionLabel, { color: theme.text }]}>Category</Text>
        <View style={styles.optionRow}>
          {(['Work', 'Personal', 'Study'] as CategoryType[]).map(item => {
            const isActive = category === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  { backgroundColor: isActive ? theme.filterActive : theme.filterBg },
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.optionSection}>
        <Text style={[styles.optionLabel, { color: theme.text }]}>Repeat</Text>
        <View style={styles.optionRow}>
          {(['none', 'daily', 'weekly'] as RepeatType[]).map(item => {
            const isActive = repeat === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionButton,
                  { backgroundColor: isActive ? theme.filterActive : theme.filterBg },
                ]}
                onPress={() => setRepeat(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          placeholder={editingTodoId ? 'Update task...' : 'Add task...'}
          placeholderTextColor={theme.subText}
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>
            {editingTodoId ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {editingTodoId && (
        <TouchableOpacity style={styles.cancelEditButton} onPress={resetForm}>
          <Text style={{ color: theme.text }}>Cancel editing</Text>
        </TouchableOpacity>
      )}

      {/* Notes */}
      <TouchableOpacity
        style={styles.notesToggle}
        onPress={() => setShowNotesInput(v => !v)}
      >
        <Icon name="document-text-outline" size={16} color={theme.subText} />
        <Text style={{ color: theme.subText, fontSize: 13 }}>
          {showNotesInput ? 'Hide note' : 'Add note'}
        </Text>
      </TouchableOpacity>
      {showNotesInput && (
        <TextInput
          style={[styles.notesInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
          placeholder="Write a note..."
          placeholderTextColor={theme.subText}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      )}

      {/* Tags Row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        {selectedTags.map(tag => (
          <TouchableOpacity
            key={tag.id}
            style={[styles.tagBadge, { backgroundColor: tag.color }]}
            onPress={() => removeTag(tag.id)}
          >
            <Text style={styles.tagBadgeText}>{tag.name} ✕</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.tagAddButton, { borderColor: theme.border }]}
          onPress={() => setShowTagModal(true)}
        >
          <Icon name="pricetag-outline" size={14} color={theme.text} />
          <Text style={{ color: theme.text, marginLeft: 4, fontSize: 13 }}>Tags</Text>
        </TouchableOpacity>
      </View>

      {/* Tag Modal */}
      <Modal visible={showTagModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Tag</Text>

            <View style={[styles.tagInputRow, { borderColor: theme.border, backgroundColor: theme.input }]}>
              <TextInput
                style={[styles.tagTextInput, { color: theme.text }]}
                placeholder="Tag name..."
                placeholderTextColor={theme.subText}
                value={tagInput}
                onChangeText={setTagInput}
              />
              <TouchableOpacity style={[styles.tagConfirmBtn, { backgroundColor: selectedTagColor }]} onPress={addTag}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colorRow}>
              {TAG_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, selectedTagColor === color && styles.colorDotSelected]}
                  onPress={() => setSelectedTagColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTagModal(false)}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text>Select Date</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
          <Text>Select Time</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setDueTime(selectedTime);
            }
          }}
        />
      )}

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No tasks found for this filter.
          </Text>
        }
        renderItem={renderTodoItem}
        ListFooterComponent={
          showCompletedSection && completedTodos.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Completed Tasks ({completedTodos.length})
              </Text>
              {completedTodos.map(todo => (
                <View key={todo.id}>{renderTodoItem({ item: todo })}</View>
              ))}
            </View>
          ) : null
        }
      />

      {selectionMode && selectedIds.length > 0 && (
        <View style={[styles.bulkActionBar, { backgroundColor: theme.card }]}>
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
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
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
  inputContainer: { flexDirection: 'row', marginBottom: 10 },
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
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
  optionSection: {
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff' },
  cancelEditButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#ddd',
    padding: 10,
    marginRight: 10,
    borderRadius: 6,
  },
  todoItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 10,
  },
  iconButton: {
    padding: 4,
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
  tagAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  tagTextInput: {
    flex: 1,
    paddingVertical: 10,
  },
  tagConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
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
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
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

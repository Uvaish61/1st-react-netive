import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { Todo } from '../types/todo.types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveTodo, loadTodos } from '../storage/todo.storage';
import { Swipeable } from 'react-native-gesture-handler';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type PriorityType = 'High' | 'Medium' | 'Low';
type CategoryType = 'Work' | 'Personal' | 'Study';

const HomeScreen: React.FC<any> = () => {

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [category, setCategory] = useState<CategoryType>('Personal');

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const animations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getAnimation = (id: string) => {
    if (!animations[id]) {
      animations[id] = new Animated.Value(1);
    }
    return animations[id];
  };

  const getTodoStatus = (todo: Todo): FilterType | 'pending' => {
    if (todo.completed) {
      return 'completed';
    }

    if (!todo.dueDate) {
      return 'pending';
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

    return dueDateTime.getTime() < Date.now() ? 'overdue' : 'pending';
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    const currentStatus = getTodoStatus(todo);
    const matchesFilter =
      activeFilter === 'all' ? true : currentStatus === activeFilter;

    return matchesSearch && matchesFilter;
  });

  // LOAD TODOS
  useEffect(() => {
    const fetchTodos = async () => {
      const localTodos = await loadTodos();

      const validTodos = Array.isArray(localTodos)
        ? localTodos.map(todo => ({
            ...todo,
            completed: typeof todo.completed === 'boolean' ? todo.completed : false,
            dueDate: todo.dueDate || null,
            dueTime: todo.dueTime || null,
            status: (todo.status as 'pending' | 'completed' | 'overdue') || 'pending',
            completedAt: todo.completedAt || null,
            priority: (todo.priority as PriorityType) || 'Medium',
            category: (todo.category as CategoryType) || 'Personal',
          }))
        : [];

      setTodos(validTodos);
    };

    fetchTodos();
  }, []);

  // ADD TODO
  const addTodo = async () => {
    if (input.trim() === '') return;

    if (editingTodoId) {
      const updatedTodos = todos.map(todo =>
        todo.id === editingTodoId
          ? {
              ...todo,
              title: input.trim(),
              dueDate: dueDate ? dueDate.toISOString() : null,
              dueTime: dueTime ? dueTime.toISOString() : null,
              priority,
              category,
            }
          : todo,
      );

      setTodos(updatedTodos);
      await saveTodo(updatedTodos);

      setEditingTodoId(null);
      setInput('');
      setDueDate(null);
      setDueTime(null);
      setPriority('Medium');
      setCategory('Personal');
      return;
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: input.trim(),
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : null,
      dueTime: dueTime ? dueTime.toISOString() : null,
      status: 'pending',
      completedAt: null,
      priority,
      category,
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    await saveTodo(updatedTodos);

    setInput('');
    setDueDate(null);
    setDueTime(null);
    setPriority('Medium');
    setCategory('Personal');
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setInput(todo.title);
    setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
    setDueTime(todo.dueTime ? new Date(todo.dueTime) : null);
    setPriority(todo.priority || 'Medium');
    setCategory(todo.category || 'Personal');
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setInput('');
    setDueDate(null);
    setDueTime(null);
    setPriority('Medium');
    setCategory('Personal');
  };

  // DELETE
  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    await saveTodo(updatedTodos);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => deleteTodo(id) },
    ]);
  };

  // ANIMATION + COMPLETE
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

    const updatedTodos: Todo[] = todos.map((todo): Todo => {
      if (todo.id === id) {
        const now = new Date();
        return {
          ...todo,
          completed: !todo.completed,
          status: !todo.completed ? 'completed' : 'pending',
          completedAt: !todo.completed ? now.toISOString() : null,
        };
      }
      return todo;
    });

    setTodos(updatedTodos);
    await saveTodo(updatedTodos);
  };

  // SWIPE ACTION
  const renderRightActions = (id: string) => (
    <TouchableOpacity
      style={styles.deleteSwipe}
      onPress={() => confirmDelete(id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  // THEME
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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* DARK MODE */}
      <TouchableOpacity
        style={{ alignSelf: 'flex-end', marginBottom: 10 }}
        onPress={() => setDarkMode(!darkMode)}
      >
        <Text style={{ color: theme.text }}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>My Task</Text>

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

      {/* INPUT */}
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
        <TouchableOpacity style={styles.cancelEditButton} onPress={cancelEditing}>
          <Text style={{ color: theme.text }}>Cancel editing</Text>
        </TouchableOpacity>
      )}

      {/* DATE + TIME */}
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
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setDueDate(d);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          onChange={(e, t) => {
            setShowTimePicker(false);
            if (t) setDueTime(t);
          }}
        />
      )}

      {/* LIST */}
      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No tasks found for this filter.
          </Text>
        }
        renderItem={({ item }) => {
          const anim = getAnimation(item.id);
          const currentStatus = getTodoStatus(item);

          return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
              <Animated.View
                style={[
                  styles.todoItem,
                  {
                    backgroundColor: theme.card,
                    transform: [{ scale: anim }],
                    opacity: anim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                  onPress={() => toggleComplete(item.id)}
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: theme.subText }}>
                    Status: {currentStatus}
                  </Text>
                  <Text style={{ color: theme.subText }}>
                    Priority: {item.priority || 'Medium'} | Category: {item.category || 'Personal'}
                  </Text>
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
        }}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },

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

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});

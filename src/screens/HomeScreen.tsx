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

import { Todo } from '../types/todo.types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveTodo, loadTodos } from '../storage/todo.storage';

const HomeScreen: React.FC<any> = () => {

  const [input, setInput] = useState('');
  const [todos, setTodos] = useState<Todo[]>([];

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(false);

  // 🎬 Animation map
  const animations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getAnimation = (id: string) => {
    if (!animations[id]) {
      animations[id] = new Animated.Value(1);
    }
    return animations[id];
  };

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
          }))
        : [];

      setTodos(validTodos);
    };

    fetchTodos();
  }, []);

  // AUTO OVERDUE
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const updatedTodos = todos.map(todo => {
        if (!todo.completed && todo.dueDate && todo.dueTime) {
          const due = new Date(todo.dueDate);
          const time = new Date(todo.dueTime);

          due.setHours(time.getHours());
          due.setMinutes(time.getMinutes());

          if (now > due) {
            return { ...todo, status: 'overdue' };
          }
        }
        return todo;
      });

      setTodos(updatedTodos);
    }, 60000);

    return () => clearInterval(interval);
  }, [todos]);

  // ADD / EDIT
  const addTodo = async () => {
    if (input.trim() === '') return;

    if (editingId) {
      const updatedTodos = todos.map(todo =>
        todo.id === editingId ? { ...todo, title: input } : todo
      );

      setTodos(updatedTodos);
      await saveTodo(updatedTodos);
      setEditingId(null);
    } else {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title: input,
        completed: false,
        dueDate: dueDate ? dueDate.toISOString() : null,
        dueTime: dueTime ? dueTime.toISOString() : null,
        status: 'pending',
        completedAt: null,
      };

      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      await saveTodo(updatedTodos);
    }

    setInput('');
    setDueDate(null);
    setDueTime(null);
  };

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

  // 🎬 TOGGLE WITH ANIMATION
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

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setDueTime(selectedTime);
  };

  const filteredTodos = todos
    .filter(todo =>
      todo.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter(todo => {
      if (filter === 'completed') return todo.completed;
      if (filter === 'pending') return !todo.completed;
      return true;
    });

  const theme = darkMode
    ? {
        bg: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        subText: '#BBBBBB',
        input: '#2A2A2A',
      }
    : {
        bg: '#F8F9FA',
        card: '#FFFFFF',
        text: '#000000',
        subText: '#555',
        input: '#FFFFFF',
      };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      <TouchableOpacity
        style={{ alignSelf: 'flex-end', marginBottom: 10 }}
        onPress={() => setDarkMode(!darkMode)}
      >
        <Text style={{ color: theme.text }}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>My Task</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          placeholder="Add task..."
          placeholderTextColor={theme.subText}
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>
            {editingId ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const anim = getAnimation(item.id);

          return (
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
                  Status: {item.status}
                </Text>
              </View>

              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <Text style={{ color: 'red' }}>Delete</Text>
              </TouchableOpacity>
            </Animated.View>
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

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
  },

  addButtonText: { color: '#fff' },

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
});
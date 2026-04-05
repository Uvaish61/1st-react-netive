import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

import { Todo } from '../types/todo.types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveTodo, loadTodos } from '../storage/todo.storage';

const HomeScreen: React.FC<any> = ({ navigation }) => {

  const [input, setInput] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ✅ NEW STATES
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // ✅ AUTO OVERDUE CHECK
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

  // ADD / EDIT TODO
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

  // TOGGLE COMPLETE
  const toggleComplete = async (id: string) => {
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

  // DATE / TIME HANDLER
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setDueTime(selectedTime);
  };

  // FILTERED DATA
  const filteredTodos = todos
    .filter(todo =>
      todo.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter(todo => {
      if (filter === 'completed') return todo.completed;
      if (filter === 'pending') return !todo.completed;
      return true;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Task</Text>

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add new task..."
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>
            {editingId ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <TextInput
        style={styles.input}
        placeholder="Search tasks..."
        value={search}
        onChangeText={setSearch}
      />

      {/* FILTER */}
      <View style={styles.filterContainer}>
        {['all', 'completed', 'pending'].map(item => (
          <TouchableOpacity key={item} onPress={() => setFilter(item as any)}>
            <Text style={filter === item ? styles.activeFilter : styles.filterText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DATE TIME */}
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text>Select Date</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
          <Text>Select Time</Text>
        </TouchableOpacity>
      </View>

      {dueDate && <Text>📅 {dueDate.toLocaleDateString()}</Text>}
      {dueTime && <Text>⏰ {dueTime.toLocaleTimeString()}</Text>}

      {showDatePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="date" onChange={onChangeDate} />
      )}

      {showTimePicker && (
        <DateTimePicker value={dueTime || new Date()} mode="time" onChange={onChangeTime} />
      )}

      {/* LIST */}
      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity
              style={[styles.checkbox, item.completed && styles.checkboxChecked]}
              onPress={() => toggleComplete(item.id)}
            >
              {item.completed && <Text style={{ color: '#fff' }}>✓</Text>}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={item.completed && { textDecorationLine: 'line-through' }}>
                {item.title}
              </Text>

              <Text>Status: {item.status}</Text>
            </View>

            <TouchableOpacity onPress={() => {
              setInput(item.title);
              setEditingId(item.id);
            }}>
              <Text style={{ color: 'blue' }}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmDelete(item.id)}>
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8F9FA' },

  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },

  inputContainer: { flexDirection: 'row', marginBottom: 10 },

  input: {
    flex: 1,
    backgroundColor: '#fff',
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

  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },

  filterText: { color: '#555' },

  activeFilter: { color: '#4CAF50', fontWeight: 'bold' },

  dateButton: {
    backgroundColor: '#ddd',
    padding: 10,
    marginRight: 10,
    borderRadius: 6,
  },

  todoItem: {
    backgroundColor: '#fff',
    padding: 10,
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
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import { Todo } from '../types/todo.types';

//  ADDED: datetime picker import
import DateTimePicker from '@react-native-community/datetimepicker';

import { saveTodo, loadTodos } from '../storage/todo.storage';

const HomeScreen: React.FC = () => {
  // STATE: task input
  const [input, setInput] = useState<string>('');

  // STATE: todo list
  const [todos, setTodos] = useState<Todo[]>([]);

  // ADDED: store selected date
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // 🔧 FIXED: typo setDuteTime → setDueTime
  const [dueTime, setDueTime] = useState<Date | null>(null);

  // 🔧 FIXED: state name should start lowercase
  const [showDatePicker, setShowDatePicker] = useState(false);

  //  ADDED: separate time picker
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load todos from AsyncStorage when app starts
  useEffect(() => {
    const fetchTodos = async () => {
      const localTodos = await loadTodos();

      const validTodos = Array.isArray(localTodos)
        ? localTodos.map(todo => ({
            ...todo,

            completed:
              typeof todo.completed === 'boolean' ? todo.completed : false,

            dueDate: todo.dueDate || null,
            dueTime: todo.dueTime || null,
            // 🔧 FIXED: cast status to allowed Todo type
            status:
              (todo.status as 'pending' | 'completed' | 'overdue') || 'pending',
            // 🔧 FIXED: prevents crash for old stored todos
            completedAt: todo.completedAt || null,
          }))
        : [];

      setTodos(validTodos);
    };

    fetchTodos();
  }, []);

  // ADD NEW TODO
  const addTodo = async () => {
    if (input.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now().toString(),

      title: input,

      completed: false,

      // 🔧 FIXED: store selected deadline instead of null
      dueDate: dueDate ? dueDate.toISOString() : null,
      // 🔧 FIXED: store selected time
      dueTime: dueTime ? dueTime.toISOString() : null,

      status: 'pending',

      completedAt: null,
    };

    const updatedTodos = [...todos, newTodo];

    setTodos(updatedTodos);

    await saveTodo(updatedTodos);

    setInput('');

    // ➕ ADDED: reset date/time after adding task
    setDueDate(null);
    setDueTime(null);
  };

  // DELETE TODO
  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);

    setTodos(updatedTodos);

    await saveTodo(updatedTodos);
  };

  // TOGGLE TASK COMPLETION 
  const toggleComplete = async (id: string) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === id) {
        const now = new Date();
        let completionType: 'early' | 'ontime' | 'late' | undefined;

        if (todo.dueDate && todo.dueTime) {
          const due = new Date(todo.dueDate);
          const time = new Date(todo.dueTime!);

          due.setHours(time.getHours());
          due.setMinutes(time.getMinutes());

          if (now < due) completionType = 'early';
          else if (now.getTime() === due.getTime()) completionType = 'ontime';
          else completionType = 'late';
        }
        return {
          ...todo,
          completed: !todo.completed,
          status: !todo.completed ? 'completed' : 'pending',
          completedAt: !todo.completed ? now.toISOString() : null,
          completionType: !todo.completed ? completionType : undefined,
        };
      }
      return todo;
    });
    setTodos(updatedTodos);
    await saveTodo(updatedTodos);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      setDueTime(selectedTime);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Task</Text>

      {/* INPUT AREA */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add new task..."
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ➕ ADDED: date & time selector UI */}
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>Select Date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text>Select Time</Text>
        </TouchableOpacity>
      </View>

      {/* ➕ ADDED: DATE PICKER */}

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {/* ➕ ADDED: TIME PICKER */}

      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}

      {/* TASK LIST */}

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No task yet. Add one</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
              ]}
              onPress={() => toggleComplete(item.id)}
            >
              {item.completed && <Text style={styles.tick}>✓</Text>}
            </TouchableOpacity>

            <View style={styles.todoContent}>
              <View style={styles.textWrapper}>
                <Text
                  style={[
                    styles.todoText,
                    item.completed && styles.completedText,
                  ]}
                >
                  {item?.title || 'Untitled Task'}
                </Text>

                {item.completed && <View style={styles.completeLine} />}
              </View>

              {/* STATUS */}

              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'pending' && styles.pendingStatus,
                    item.status === 'completed' && styles.completedStatus,
                    item.status === 'overdue' && styles.overdueStatus,
                  ]}
                >
                  Status: {item.status}
                </Text>
                {item.dueDate && item.dueTime && (
                  <Text style={styles.deadlineText}>
                    Due: {new Date(item.dueDate!).toLocaleDateString()} •{' '}
                    {new Date(item.dueTime!).toLocaleTimeString()}
                  </Text>
                )}

                {item.completedAt && (
                  <Text style={styles.completedTime}>
                    Completed: {new Date(item.completedAt).toLocaleString()}
                  </Text>
                )}
                {item.completionType === 'early' && (
                  <Text style={{ color: '#22c55e', fontSize: 12 }}>
                    Completed Early
                  </Text>
                )}
                {item.completionType === 'ontime' && (
                  <Text style={{ color: '#3b82f6', fontSize: 12 }}>
                    Completed On Time
                  </Text>
                )}
                {item.completionType === 'late' && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>
                    Completed Late
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default HomeScreen;

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  addButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // ➕ ADDED
  dateButton: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
  },

  todoItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },

  tick: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  todoContent: {
    flex: 1,
  },

  todoText: {
    fontSize: 16,
  },

  textWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  completedText: {
    opacity: 0.4,
  },

  completeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22c55e',
    top: '50%',
  },

  deleteText: {
    color: '#FF5252',
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },

  statusContainer: {
    marginTop: 4,
  },

  statusText: {
    fontSize: 12,
    color: '#666',
  },

  deadlineText: {
    fontSize: 12,
    color: '#888',
  },

  completedTime: {
    fontSize: 12,
    color: '#22c55e',
  },
  pendingStatus: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  completedStatus: {
    color: '#22c55e',
    fontWeight: '600',
  },
  overdueStatus: {
    color: '#ef4444',
    fontWeight: '600',
  },
});

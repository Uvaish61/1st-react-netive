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
import { saveTodo, loadTodos } from '../storage/todo.storage';
import { TouchableNativeFeedback } from 'react-native/types_generated/index';


const HomeScreen: React.FC = () => {

  // State to store input text
  const [input, setInput] = useState<string>('');

  // State to store todo list
  const [todos, setTodos] = useState<Todo[]>([]);
  //Load todos from AsyncStorage on app start
  useEffect(() => {
    const fetchTodos = async () => {
      const localTodos = await loadTodos();
      console.log("local todos:", localTodos);
      const validTodos = Array.isArray(localTodos)
        ? localTodos.map((todo) => ({
          ...todo,
          completed:
            typeof todo.completed === 'boolean'
              ? todo.completed
              : false, // Default for old stored todos
        }))
        : [];

      setTodos(validTodos); // MODIFIED: use validated data
    };

    fetchTodos();
  }, []);

  // Add new todo
  const addTodo = async () => {
    if (input.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: input,
      completed: false
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);

    console.log("todos:", updatedTodos);
    await saveTodo(updatedTodos);
    setInput('');
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    await saveTodo(updatedTodos);
  };
  const toggleComplete = async (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    );

    setTodos(updatedTodos);
    await saveTodo(updatedTodos);
  };



  return (
    <View style={styles.container}> {/* FIXED: style → styles */}

      <Text style={styles.title}>My Task</Text>

      <View style={styles.inputContainer}> {/* FIXED */}

        <TextInput
          style={styles.input}
          placeholder="Add new task..."
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.addButton} onPress={addTodo}> {/* FIXED */}
          <Text style={styles.addButtonText}>Add</Text> {/* FIXED */}
        </TouchableOpacity>

      </View>

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            No task yet. Add one
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>

            {/* 🔥 ADDED: Tick rendering inside checkbox */}
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked
              ]}
              onPress={() => toggleComplete(item.id)}
            >
              {item.completed && (
                <Text style={styles.tick}>✓</Text>  {/* 🔥 ADDED */}
              )}
            </TouchableOpacity>

            <View style={styles.todoContent}>
              {/* 🔥 ADDED: Conditional styling for completed task */}
              <Text
                style={[
                  styles.todoText,
                  item.completed && styles.completedText  // 🔥 ADDED
                ]}
              >
                {item?.title || "Untitled Task"}
              </Text>
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

// FIXED: styleSheet → StyleSheet
// FIXED: style → styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold', // FIXED: added comma below
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF', // FIXED: added comma
    padding: 12,
    borderRadius: 8, // FIXED: spelling
    borderWidth: 1,
    borderColor: '#E0E0E0', // FIXED: added comma
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


  todoItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4CAF50',
  borderRadius: 6,
    marginRight: 12,
    borderRadius: 6,
    marginRight: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  TouchableNativeFeedback: {
    color:'#FFFFFF',
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todoText: {
    fontSize: 16,
  },

  completedText: {
    textDecorationLine: 'line-through',
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
});
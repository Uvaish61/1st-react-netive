import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Todo } from '../types/todo.types';

const HomeScreen: React.FC = () => {

  // State to store input text
  const [input, setInput] = useState<string>('');

  // State to store todo list
  const [todos, setTodos] = useState<Todo[]>([]);

  // Add new todo
  const addTodo = () => {
    if (input.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: input,
    };

    setTodos(prev => [newTodo, ...prev]);
    setInput('');
  };

  // Delete todo
  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
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
        renderItem={({ item }) => (
          <View style={styles.todoItem}> {/* FIXED */}
            <Text style={styles.todoText}>{item.title}</Text>

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
    justifyContent: 'space-between',
  },
  todoText: {
    fontSize: 16,
  },
  deleteText: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
});
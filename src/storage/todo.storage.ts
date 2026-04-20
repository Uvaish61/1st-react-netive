import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subtask, Todo } from '../types/todo.types';

const STORAGE_KEY = 'TODOS-STORAGE';

const normalizeSubtask = (subtask: Partial<Subtask>, index: number): Subtask => ({
    id: typeof subtask.id === 'string' && subtask.id.trim() ? subtask.id : `subtask-${index}-${Date.now()}`,
    title: typeof subtask.title === 'string' ? subtask.title : '',
    completed: typeof subtask.completed === 'boolean' ? subtask.completed : false,
});

const normalizeTodo = (todo: Partial<Todo>): Todo => ({
    id: typeof todo.id === 'string' ? todo.id : Date.now().toString(),
    title: typeof todo.title === 'string' ? todo.title : '',
    completed: typeof todo.completed === 'boolean' ? todo.completed : false,
    dueDate: todo.dueDate || null,
    dueTime: todo.dueTime || null,
    status: todo.status === 'completed' || todo.status === 'overdue' ? todo.status : 'pending',
    completedAt: todo.completedAt || null,
    priority: todo.priority,
    category: todo.category,
    repeat: todo.repeat,
    completionType: todo.completionType,
    tags: Array.isArray(todo.tags) ? todo.tags : [],
    notes: typeof todo.notes === 'string' ? todo.notes : undefined,
    subtasks: Array.isArray(todo.subtasks)
        ? todo.subtasks.map(normalizeSubtask)
        : [],
});

// Save todos to device  
export const saveTodo = async (todos: Todo[]) => {
    try {
        const jsonValue = JSON.stringify(todos.map(normalizeTodo));
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue)
        }catch (error) {
    console.log('Error saving todos:', error);
     }
    };
//Load todos from device
export const loadTodos = async(): Promise<Todo[]> => {
    try{
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue == null) {
            return [];
        }

        const parsedValue = JSON.parse(jsonValue);

        return Array.isArray(parsedValue) ? parsedValue.map(normalizeTodo) : [];
        }
    catch (error) {
        console.log('Error loading todos:',error);
        return [];
        }
    };

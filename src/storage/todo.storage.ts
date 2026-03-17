import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '../types/todo.types';

const STORAGE_KEY = 'TODOS-STORAGE';
// Save todos to device  
export const saveTodo = async (todos: Todo[]) => {
    try {
        const jsonValue = JSON.stringify(todos);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue)
        }catch (error) {
    console.log('Error saving todos:', error);
     }
    };
//Load todos from device
export const loadTodos = async(): Promise<Todo[]> => {
    try{
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        return jsonValue !=null ? JSON.parse(jsonValue) : [];
        }
    catch (error) {
        console.log('Error loading todos:',error);
        return [];
        }
    };
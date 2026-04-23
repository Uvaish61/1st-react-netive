import { Todo } from '../types/todo.types';

export const normalizeSearchQuery = (value: string) => value.trim().toLowerCase();

export const matchesTodoSearch = (todo: Todo, query: string) =>
  todo.title.toLowerCase().includes(normalizeSearchQuery(query));
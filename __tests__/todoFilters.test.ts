import { matchesTodoSearch, normalizeSearchQuery } from '../src/utils/todoFilters';
import { Todo } from '../src/types/todo.types';

describe('todoFilters', () => {
  const todo: Todo = {
    id: '1',
    title: 'Plan Weekly Review',
    completed: false,
    dueDate: null,
    dueTime: null,
    status: 'pending',
    completedAt: null,
  };

  it('normalizes search queries before matching', () => {
    expect(normalizeSearchQuery('  PLAN  ')).toBe('plan');
    expect(matchesTodoSearch(todo, '  weekly ')).toBe(true);
    expect(matchesTodoSearch(todo, 'monthly')).toBe(false);
  });
});
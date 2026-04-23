import notifee from '@notifee/react-native';

import { syncTodoReminders } from '../src/utils/todoNotifications';
import { Todo } from '../src/types/todo.types';

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(),
    createChannel: jest.fn(),
    cancelNotification: jest.fn(),
    createTriggerNotification: jest.fn(),
  },
  AndroidImportance: { HIGH: 'HIGH' },
  TriggerType: { TIMESTAMP: 'TIMESTAMP' },
}));

describe('syncTodoReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips trigger scheduling when reminder timestamps are invalid', async () => {
    const todo: Todo = {
      id: '1',
      title: 'Broken reminder',
      completed: false,
      dueDate: 'invalid-date',
      dueTime: 'also-invalid',
      status: 'pending',
      completedAt: null,
    };

    await syncTodoReminders([todo]);

    expect(notifee.cancelNotification).toHaveBeenCalledTimes(2);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    expect(notifee.requestPermission).not.toHaveBeenCalled();
    expect(notifee.createChannel).not.toHaveBeenCalled();
  });
});
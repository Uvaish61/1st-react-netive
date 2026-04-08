import notifee, { TriggerType } from '@notifee/react-native';

import { Todo } from '../types/todo.types';

const TODO_CHANNEL_ID = 'todo-reminders';

const getReminderDateTime = (todo: Todo) => {
  if (!todo.dueDate || !todo.dueTime || todo.completed) {
    return null;
  }

  const dueDateTime = new Date(todo.dueDate);
  const dueTime = new Date(todo.dueTime);

  dueDateTime.setHours(
    dueTime.getHours(),
    dueTime.getMinutes(),
    dueTime.getSeconds(),
    dueTime.getMilliseconds(),
  );

  if (dueDateTime.getTime() <= Date.now()) {
    return null;
  }

  return dueDateTime;
};

const getNotificationId = (todoId: string) => `todo-reminder-${todoId}`;

const ensureNotificationSetup = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: TODO_CHANNEL_ID,
    name: 'Todo Reminders',
  });
};

export const cancelTodoReminder = async (todoId: string) => {
  await notifee.cancelNotification(getNotificationId(todoId));
};

export const scheduleTodoReminder = async (todo: Todo) => {
  const reminderDateTime = getReminderDateTime(todo);
  const notificationId = getNotificationId(todo.id);

  await notifee.cancelNotification(notificationId);

  if (!reminderDateTime) {
    return;
  }

  await ensureNotificationSetup();

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: 'Task Reminder',
      body: todo.title,
      android: {
        channelId: TODO_CHANNEL_ID,
        pressAction: {
          id: 'default',
        },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderDateTime.getTime(),
    },
  );
};

export const syncTodoReminders = async (todos: Todo[]) => {
  await Promise.all(todos.map(todo => scheduleTodoReminder(todo)));
};

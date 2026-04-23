import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';

import { Todo } from '../types/todo.types';

const TODO_CHANNEL_ID = 'todo-reminders';

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const getReminderDateTime = (todo: Todo) => {
  if (!todo.dueDate || !todo.dueTime || todo.completed || todo.archivedAt) {
    return null;
  }

  const dueDateTime = new Date(todo.dueDate);
  const dueTime = new Date(todo.dueTime);

  if (!isValidDate(dueDateTime) || !isValidDate(dueTime)) {
    return null;
  }

  dueDateTime.setHours(
    dueTime.getHours(),
    dueTime.getMinutes(),
    dueTime.getSeconds(),
    dueTime.getMilliseconds(),
  );

  // Require at least 10 seconds in the future to avoid race conditions
  if (dueDateTime.getTime() <= Date.now() + 10000) {
    return null;
  }

  return dueDateTime;
};

const getNotificationId = (todoId: string) => `todo-reminder-${todoId}`;
const getWarningNotificationId = (todoId: string) => `todo-warning-${todoId}`;

const getWarningDateTime = (todo: Todo) => {
  if (!todo.dueDate || !todo.dueTime || todo.completed || todo.archivedAt) {
    return null;
  }

  const dueDateTime = new Date(todo.dueDate);
  const dueTime = new Date(todo.dueTime);

  if (!isValidDate(dueDateTime) || !isValidDate(dueTime)) {
    return null;
  }

  dueDateTime.setHours(
    dueTime.getHours(),
    dueTime.getMinutes(),
    dueTime.getSeconds(),
    dueTime.getMilliseconds(),
  );

  const warningTime = new Date(dueDateTime.getTime() - 5 * 60 * 1000);

  if (warningTime.getTime() <= Date.now() + 10000) {
    return null;
  }

  return warningTime;
};

const ensureNotificationSetup = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: TODO_CHANNEL_ID,
    name: 'Todo Reminders',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
};

export const cancelTodoReminder = async (todoId: string) => {
  await notifee.cancelNotification(getNotificationId(todoId));
  await notifee.cancelNotification(getWarningNotificationId(todoId));
};

const scheduleWarningReminder = async (todo: Todo) => {
  const warningDateTime = getWarningDateTime(todo);
  const notificationId = getWarningNotificationId(todo.id);

  try {
    await notifee.cancelNotification(notificationId);

    if (!warningDateTime) {
      return;
    }

    await ensureNotificationSetup();

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: '⏰ Due in 5 Minutes!',
        body: `"${todo.title}" is due in 5 minutes.`,
        android: {
          channelId: TODO_CHANNEL_ID,
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
        },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: warningDateTime.getTime(),
      },
    );
  } catch {
    // Silently skip
  }
};

export const scheduleTodoReminder = async (todo: Todo) => {
  const reminderDateTime = getReminderDateTime(todo);
  const notificationId = getNotificationId(todo.id);

  try {
    await notifee.cancelNotification(notificationId);

    if (!reminderDateTime) {
      return;
    }

    await ensureNotificationSetup();

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: '🔔 Task Due Now!',
        body: `"${todo.title}" is due now.`,
        android: {
          channelId: TODO_CHANNEL_ID,
          pressAction: { id: 'default' },
          importance: AndroidImportance.HIGH,
        },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: reminderDateTime.getTime(),
      },
    );
  } catch {
    // Silently skip — timestamp may have just crossed into the past
  }
};

export const syncTodoReminders = async (todos: Todo[]) => {
  await Promise.all(
    todos.flatMap(todo => [scheduleTodoReminder(todo), scheduleWarningReminder(todo)]),
  );
};

import { Request, Response } from 'express';
import { createId, readStore, writeStore } from '../services/dataStoreService';

// ADD TASK
export const addTask = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const { title, description, completed } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const store = await readStore();
    const now = new Date().toISOString();
    const newTask = {
      id: createId('task'),
      title: String(title),
      description: description ? String(description) : undefined,
      completed: Boolean(completed),
      userId: req.user.id,
      createdAt: now,
      updatedAt: now,
    };

    store.tasks.push(newTask);
    await writeStore(store);

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error adding task', error });
  }
};

// GET ALL TASKS
export const getTasks = async (req: Request, res: Response) => {
  try {
    const store = await readStore();
    const tasks = store.tasks
      .filter((task) => task.userId === req.user?.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// UPDATE TASK
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const store = await readStore();
    const taskIndex = store.tasks.findIndex((task) => task.id === id && task.userId === req.user?.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const current = store.tasks[taskIndex];
    const updatedTask = {
      ...current,
      title: title !== undefined ? String(title) : current.title,
      description: description !== undefined ? String(description) : current.description,
      completed: completed !== undefined ? Boolean(completed) : current.completed,
      updatedAt: new Date().toISOString(),
    };

    store.tasks[taskIndex] = updatedTask;
    await writeStore(store);

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};

// DELETE TASK
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await readStore();
    const taskIndex = store.tasks.findIndex((task) => task.id === id && task.userId === req.user?.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    store.tasks.splice(taskIndex, 1);
    await writeStore(store);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};
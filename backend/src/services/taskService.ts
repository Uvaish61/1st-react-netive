import Task from '../models/Task';

export const getAllTasks = async (userId: string) => {
  return await Task.find({ userId });
};

export const getTaskById = async (id: string, userId: string) => {
  return await Task.findOne({ _id: id, userId });
};

export const createTask = async (taskData: { title: string; description?: string; userId: string }) => {
  const newTask = new Task(taskData);
  return await newTask.save();
};

export const updateTask = async (id: string, userId: string, taskData: { title?: string; description?: string; completed?: boolean }) => {
  return await Task.findOneAndUpdate({ _id: id, userId }, taskData, { new: true, runValidators: true });
};

export const deleteTask = async (id: string, userId: string) => {
  return await Task.findOneAndDelete({ _id: id, userId });
};
import { Router } from 'express';
import {
  addTask,
  deleteTask,
  getTasks,
  updateTask,
} from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Route to get all tasks
router.get('/', authenticate, getTasks);

// Route to add a new task
router.post('/', authenticate, addTask);

// Route to update an existing task
router.put('/:id', authenticate, updateTask);

// Route to delete a task
router.delete('/:id', authenticate, deleteTask);

export default router;
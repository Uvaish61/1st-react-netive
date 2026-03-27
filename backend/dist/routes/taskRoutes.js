"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Route to get all tasks
router.get('/', authMiddleware_1.authenticate, taskController_1.getTasks);
// Route to add a new task
router.post('/', authMiddleware_1.authenticate, taskController_1.addTask);
// Route to update an existing task
router.put('/:id', authMiddleware_1.authenticate, taskController_1.updateTask);
// Route to delete a task
router.delete('/:id', authMiddleware_1.authenticate, taskController_1.deleteTask);
exports.default = router;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasks = exports.addTask = void 0;
const dataStoreService_1 = require("../services/dataStoreService");
// ADD TASK
const addTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        const { title, description, completed } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'title is required' });
        }
        const store = yield (0, dataStoreService_1.readStore)();
        const now = new Date().toISOString();
        const newTask = {
            id: (0, dataStoreService_1.createId)('task'),
            title: String(title),
            description: description ? String(description) : undefined,
            completed: Boolean(completed),
            userId: req.user.id,
            createdAt: now,
            updatedAt: now,
        };
        store.tasks.push(newTask);
        yield (0, dataStoreService_1.writeStore)(store);
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding task', error });
    }
});
exports.addTask = addTask;
// GET ALL TASKS
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const store = yield (0, dataStoreService_1.readStore)();
        const tasks = store.tasks
            .filter((task) => { var _a; return task.userId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id); })
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        res.status(200).json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error });
    }
});
exports.getTasks = getTasks;
// UPDATE TASK
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const store = yield (0, dataStoreService_1.readStore)();
        const taskIndex = store.tasks.findIndex((task) => { var _a; return task.id === id && task.userId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id); });
        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const current = store.tasks[taskIndex];
        const updatedTask = Object.assign(Object.assign({}, current), { title: title !== undefined ? String(title) : current.title, description: description !== undefined ? String(description) : current.description, completed: completed !== undefined ? Boolean(completed) : current.completed, updatedAt: new Date().toISOString() });
        store.tasks[taskIndex] = updatedTask;
        yield (0, dataStoreService_1.writeStore)(store);
        res.status(200).json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating task', error });
    }
});
exports.updateTask = updateTask;
// DELETE TASK
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const store = yield (0, dataStoreService_1.readStore)();
        const taskIndex = store.tasks.findIndex((task) => { var _a; return task.id === id && task.userId === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id); });
        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }
        store.tasks.splice(taskIndex, 1);
        yield (0, dataStoreService_1.writeStore)(store);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting task', error });
    }
});
exports.deleteTask = deleteTask;

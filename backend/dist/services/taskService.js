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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getAllTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const getAllTasks = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Task_1.default.find({ userId });
});
exports.getAllTasks = getAllTasks;
const getTaskById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Task_1.default.findOne({ _id: id, userId });
});
exports.getTaskById = getTaskById;
const createTask = (taskData) => __awaiter(void 0, void 0, void 0, function* () {
    const newTask = new Task_1.default(taskData);
    return yield newTask.save();
});
exports.createTask = createTask;
const updateTask = (id, userId, taskData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Task_1.default.findOneAndUpdate({ _id: id, userId }, taskData, { new: true, runValidators: true });
});
exports.updateTask = updateTask;
const deleteTask = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Task_1.default.findOneAndDelete({ _id: id, userId });
});
exports.deleteTask = deleteTask;

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
exports.createId = exports.writeStore = exports.readStore = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DEFAULT_STORE = {
    users: [],
    tasks: [],
};
const storePath = path_1.default.join(process.cwd(), 'src', 'data', 'store.json');
const ensureStoreFile = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fs_1.promises.access(storePath);
    }
    catch (_a) {
        yield fs_1.promises.mkdir(path_1.default.dirname(storePath), { recursive: true });
        yield fs_1.promises.writeFile(storePath, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
    }
});
const readStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureStoreFile();
    const raw = yield fs_1.promises.readFile(storePath, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        return {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        };
    }
    catch (_b) {
        return DEFAULT_STORE;
    }
});
exports.readStore = readStore;
const writeStore = (data) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureStoreFile();
    yield fs_1.promises.writeFile(storePath, JSON.stringify(data, null, 2), 'utf8');
});
exports.writeStore = writeStore;
const createId = (prefix) => {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now()}-${randomPart}`;
};
exports.createId = createId;

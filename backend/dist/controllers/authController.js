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
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authService_1 = require("../services/authService");
const dataStoreService_1 = require("../services/dataStoreService");
// User Signup
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'username, email and password are required' });
    }
    try {
        const store = yield (0, dataStoreService_1.readStore)();
        const existingUser = store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()
            || user.username.toLowerCase() === String(username).toLowerCase());
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email/username' });
        }
        const now = new Date().toISOString();
        const newUser = {
            id: (0, dataStoreService_1.createId)('user'),
            username: String(username),
            email: String(email).toLowerCase(),
            passwordHash: yield bcryptjs_1.default.hash(String(password), 10),
            createdAt: now,
            updatedAt: now,
        };
        store.users.push(newUser);
        yield (0, dataStoreService_1.writeStore)(store);
        const token = (0, authService_1.generateToken)(newUser.id);
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.signup = signup;
// User Login
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
    }
    try {
        const store = yield (0, dataStoreService_1.readStore)();
        const user = store.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
        if (!user || !(yield bcryptjs_1.default.compare(String(password), user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = (0, authService_1.generateToken)(user.id);
        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.login = login;

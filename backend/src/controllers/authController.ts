import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../services/authService';
import { createId, readStore, writeStore } from '../services/dataStoreService';

// User Signup
export const signup = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'username, email and password are required' });
  }

  try {
    const store = await readStore();

    const existingUser = store.users.find(
      (user) => user.email.toLowerCase() === String(email).toLowerCase()
        || user.username.toLowerCase() === String(username).toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email/username' });
    }

    const now = new Date().toISOString();
    const newUser = {
      id: createId('user'),
      username: String(username),
      email: String(email).toLowerCase(),
      passwordHash: await bcrypt.hash(String(password), 10),
      createdAt: now,
      updatedAt: now,
    };

    store.users.push(newUser);
    await writeStore(store);

    const token = generateToken(newUser.id);
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// User Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const store = await readStore();
    const user = store.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
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
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
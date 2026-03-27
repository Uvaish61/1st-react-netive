import { promises as fs } from 'fs';
import path from 'path';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreSchema {
  users: StoredUser[];
  tasks: StoredTask[];
}

const DEFAULT_STORE: StoreSchema = {
  users: [],
  tasks: [],
};

const storePath = path.join(process.cwd(), 'src', 'data', 'store.json');

const ensureStoreFile = async (): Promise<void> => {
  try {
    await fs.access(storePath);
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
  }
};

export const readStore = async (): Promise<StoreSchema> => {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, 'utf8');

  try {
    const parsed = JSON.parse(raw) as StoreSchema;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return DEFAULT_STORE;
  }
};

export const writeStore = async (data: StoreSchema): Promise<void> => {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), 'utf8');
};

export const createId = (prefix: string): string => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${randomPart}`;
};

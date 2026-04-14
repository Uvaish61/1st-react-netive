import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_STORAGE_KEY = 'usersAccount';
const SESSION_STORAGE_KEY = 'userAccount';
const LOGGED_IN_STORAGE_KEY = 'isLoggedIn';

export interface StoredUser {
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const loadUsers = async (): Promise<StoredUser[]> => {
  try {
    const rawValue = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.log('Error loading users:', error);
    return [];
  }
};

export const saveUsers = async (users: StoredUser[]) => {
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.log('Error saving users:', error);
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  const users = await loadUsers();
  return users.find(user => normalizeEmail(user.email) === normalizeEmail(email));
};

export const registerUser = async (user: Omit<StoredUser, 'createdAt'>) => {
  const users = await loadUsers();
  const existingUser = users.find(
    item => normalizeEmail(item.email) === normalizeEmail(user.email),
  );

  if (existingUser) {
    return { ok: false as const, message: 'An account with this email already exists' };
  }

  const newUser: StoredUser = {
    ...user,
    email: normalizeEmail(user.email),
    createdAt: new Date().toISOString(),
  };

  await saveUsers([...users, newUser]);

  return { ok: true as const, user: newUser };
};

export const loginUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return {
      ok: false as const,
      reason: 'not_found' as const,
      message: 'No account found for this email',
    };
  }

  if (user.password !== password) {
    return {
      ok: false as const,
      reason: 'invalid_password' as const,
      message: 'Incorrect password',
    };
  }

  return { ok: true as const, user };
};

export const persistSession = async (user: Pick<StoredUser, 'username' | 'email'>) => {
  await AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      username: user.username,
      email: normalizeEmail(user.email),
    }),
  );
  await AsyncStorage.setItem(LOGGED_IN_STORAGE_KEY, 'true');
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_STORAGE_KEY = 'usersAccount';
const SESSION_STORAGE_KEY = 'userAccount';
const LOGGED_IN_STORAGE_KEY = 'isLoggedIn';
const SESSION_DURATION_MS = 15 * 60 * 1000;

export interface StoredUser {
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

type StoredSession = {
  username: string;
  email: string;
  expiresAt: number;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const getNextExpiry = () => Date.now() + SESSION_DURATION_MS;

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
  const session: StoredSession = {
    username: user.username,
    email: normalizeEmail(user.email),
    expiresAt: getNextExpiry(),
  };

  await AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
  await AsyncStorage.setItem(LOGGED_IN_STORAGE_KEY, 'true');
};

export const getSession = async (): Promise<{ username: string; email: string } | null> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredSession;

    if (!parsed?.email || !parsed?.username) {
      return null;
    }

    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      await clearSession();
      return null;
    }

    return {
      username: parsed.username,
      email: parsed.email,
    };
  } catch {
    return null;
  }
};

export const refreshSession = async () => {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;

    if (!parsed?.email || !parsed?.username) {
      await clearSession();
      return;
    }

    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        expiresAt: getNextExpiry(),
      }),
    );
  } catch {
    await clearSession();
  }
};

export const hasValidSession = async (): Promise<boolean> => {
  const rawLoggedIn = await AsyncStorage.getItem(LOGGED_IN_STORAGE_KEY);

  if (rawLoggedIn !== 'true') {
    return false;
  }

  const session = await getSession();

  if (!session?.email) {
    return false;
  }

  const user = await findUserByEmail(session.email);
  const isValid = Boolean(user);

  if (!isValid) {
    await clearSession();
    return false;
  }

  await refreshSession();
  return true;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  await AsyncStorage.setItem(LOGGED_IN_STORAGE_KEY, 'false');
};

export const updateSessionUsername = async (newUsername: string): Promise<void> => {
  const session = await getSession();
  if (!session) {
    return;
  }
  await AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ ...session, username: newUsername, expiresAt: getNextExpiry() }),
  );
  const users = await loadUsers();
  const updated = users.map(user =>
    normalizeEmail(user.email) === normalizeEmail(session.email)
      ? { ...user, username: newUsername }
      : user,
  );
  await saveUsers(updated);
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> => {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: 'Not logged in' };
  }
  const user = await findUserByEmail(session.email);
  if (!user) {
    return { ok: false, message: 'User not found' };
  }
  if (user.password !== currentPassword) {
    return { ok: false, message: 'Current password is incorrect' };
  }
  const users = await loadUsers();
  const updated = users.map(u =>
    normalizeEmail(u.email) === normalizeEmail(session.email)
      ? { ...u, password: newPassword }
      : u,
  );
  await saveUsers(updated);
  return { ok: true, message: 'Password updated' };
};

export const deleteAccount = async (): Promise<void> => {
  const session = await getSession();
  if (session) {
    const users = await loadUsers();
    const filtered = users.filter(
      user => normalizeEmail(user.email) !== normalizeEmail(session.email),
    );
    await saveUsers(filtered);
  }
  await clearSession();
};

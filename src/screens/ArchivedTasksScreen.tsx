import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { loadTodos, saveTodo } from '../storage/todo.storage';
import { Todo } from '../types/todo.types';
import { useAppTheme } from '../contexts/ThemeContext';
import { cancelTodoReminder, syncTodoReminders } from '../utils/todoNotifications';

const formatArchiveDate = (value?: string | null) => {
  if (!value) {
    return 'Recently archived';
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const ArchivedTasksScreen: React.FC<any> = ({ navigation }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; id?: string }>({ visible: false });
  const { colors, isDark } = useAppTheme();

  const cardShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.12,
    shadowRadius: 10,
    elevation: isDark ? 8 : 5,
  };
  const pillShadowStyle = {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.22 : 0.09,
    shadowRadius: 6,
    elevation: isDark ? 4 : 3,
  };

  const loadArchivedTodos = useCallback(async () => {
    const localTodos = await loadTodos();
    setTodos(Array.isArray(localTodos) ? localTodos : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadArchivedTodos();
    }, [loadArchivedTodos]),
  );

  const archivedTodos = useMemo(
    () =>
      todos
        .filter(todo => todo.archivedAt)
        .sort((left, right) => {
          const leftTime = left.archivedAt ? new Date(left.archivedAt).getTime() : 0;
          const rightTime = right.archivedAt ? new Date(right.archivedAt).getTime() : 0;
          return rightTime - leftTime;
        }),
    [todos],
  );

  const saveArchivedChanges = useCallback(async (nextTodos: Todo[]) => {
    setTodos(nextTodos);
    await saveTodo(nextTodos);
    await syncTodoReminders(nextTodos);
  }, []);

  const mutateArchivedTodos = useCallback(
    async (updater: (items: Todo[]) => Todo[]) => {
      const nextTodos = updater(todos);
      await saveArchivedChanges(nextTodos);
    },
    [saveArchivedChanges, todos],
  );

  const restoreTodo = useCallback(async (id: string) => {
    await mutateArchivedTodos(items =>
      items.map(todo =>
        todo.id === id
          ? {
              ...todo,
              archivedAt: null,
            }
          : todo,
      ),
    );
  }, [mutateArchivedTodos]);

  const confirmDelete = useCallback((id: string) => {
    setDeleteModal({ visible: true, id });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModal.id) {
      return;
    }

    const id = deleteModal.id;

    setDeleteModal({ visible: false });
    await cancelTodoReminder(id);
    await mutateArchivedTodos(items => items.filter(todo => todo.id !== id));
  }, [deleteModal.id, mutateArchivedTodos]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadowStyle]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Archived Tasks</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
          <View style={styles.heroIconWrap}>
            <Icon name="archive-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Stored safely</Text>
            <Text style={[styles.heroSubTitle, { color: colors.subText }]}>
              {archivedTodos.length} task{archivedTodos.length === 1 ? '' : 's'} moved out of your main list
            </Text>
          </View>
        </View>

        {archivedTodos.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}>
            <Icon name="file-tray-outline" size={34} color={colors.subText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No archived tasks</Text>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              Archive any task from Home and it will show up here.
            </Text>
          </View>
        ) : (
          archivedTodos.map(todo => (
            <View
              key={todo.id}
              style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]}
            >
              <View style={styles.taskHeader}>
                <View style={[styles.archiveBadge, { backgroundColor: `${colors.filterActive}22` }]}>
                  <Icon name="archive-outline" size={14} color={colors.filterActive} />
                  <Text style={[styles.archiveBadgeText, { color: colors.filterActive }]}>Archived</Text>
                </View>
                <Text style={[styles.archivedDate, { color: colors.subText }]}>
                  {formatArchiveDate(todo.archivedAt)}
                </Text>
              </View>

              <Text style={[styles.taskTitle, { color: colors.text }]}>{todo.title}</Text>
              <Text style={[styles.taskMeta, { color: colors.subText }]}>
                Priority: {todo.priority || 'Medium'} | Category: {todo.category || 'Personal'}
              </Text>

              {todo.notes ? (
                <Text style={[styles.taskNotes, { color: colors.subText }]} numberOfLines={2}>
                  {todo.notes}
                </Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.filterBg }]}
                  onPress={() => restoreTodo(todo.id)}
                >
                  <Icon name="refresh-outline" size={15} color={colors.filterActive} />
                  <Text style={[styles.restoreText, { color: colors.filterActive }]}>Restore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => confirmDelete(todo.id)}
                >
                  <Icon name="trash-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.deleteText}>Delete Forever</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <DeleteConfirmModal
        visible={deleteModal.visible}
        title="Delete Archived Task"
        message="This archived task will be permanently removed."
        onCancel={() => setDeleteModal({ visible: false })}
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
};

export default ArchivedTasksScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 104,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F59E0B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroSubTitle: {
    marginTop: 4,
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  archiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  archiveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  archivedDate: {
    fontSize: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  taskMeta: {
    fontSize: 13,
  },
  taskNotes: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

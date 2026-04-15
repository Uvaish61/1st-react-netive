import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

import { loadTodos, saveTodo } from '../storage/todo.storage';
import { syncTodoReminders } from '../utils/todoNotifications';
import { Tag, Todo } from '../types/todo.types';
import BottomNavBar from '../components/BottomNavBar';
import { useAppTheme } from '../contexts/ThemeContext';

type PriorityType = 'High' | 'Medium' | 'Low';
type CategoryType = 'Work' | 'Personal' | 'Study';
type RepeatType = 'none' | 'daily' | 'weekly';

const TAG_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

const DEFAULT_PRIORITY: PriorityType = 'Medium';
const DEFAULT_CATEGORY: CategoryType = 'Personal';
const DEFAULT_REPEAT: RepeatType = 'none';

type ScreenParams = {
  mode?: 'create' | 'edit';
  todo?: Todo;
};

const AddTaskScreen: React.FC<any> = ({ navigation, route }) => {
  const params = (route?.params || {}) as ScreenParams;
  const editingTodo = params.mode === 'edit' ? params.todo : undefined;

  const [input, setInput] = useState(editingTodo?.title || '');
  const [priority, setPriority] = useState<PriorityType>(editingTodo?.priority || DEFAULT_PRIORITY);
  const [category, setCategory] = useState<CategoryType>(editingTodo?.category || DEFAULT_CATEGORY);
  const [repeat, setRepeat] = useState<RepeatType>(editingTodo?.repeat || DEFAULT_REPEAT);
  const [dueDate, setDueDate] = useState<Date | null>(editingTodo?.dueDate ? new Date(editingTodo.dueDate) : null);
  const [dueTime, setDueTime] = useState<Date | null>(editingTodo?.dueTime ? new Date(editingTodo.dueTime) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(editingTodo?.tags || []);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
  const [notes, setNotes] = useState(editingTodo?.notes || '');
  const [showNotesInput, setShowNotesInput] = useState(Boolean(editingTodo?.notes));
  const { colors, isDark } = useAppTheme();
  const placeholderColor = isDark ? '#787878' : '#94A3B8';
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

  const title = useMemo(() => (editingTodo ? 'Edit Task' : 'Add New Task'), [editingTodo]);

  const addTag = () => {
    const name = tagInput.trim();
    if (!name) {
      return;
    }
    if (selectedTags.find(tag => tag.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    setSelectedTags(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        color: selectedTagColor,
      },
    ]);
    setTagInput('');
  };

  const removeTag = (id: string) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== id));
  };

  const saveTask = async () => {
    if (!input.trim()) {
      Alert.alert('Missing title', 'Task title required hai.');
      return;
    }

    const localTodos = await loadTodos();
    const normalizedTodos = Array.isArray(localTodos) ? localTodos : [];

    let nextTodos: Todo[];

    if (editingTodo) {
      nextTodos = normalizedTodos.map(todo =>
        todo.id === editingTodo.id
          ? {
              ...todo,
              title: input.trim(),
              dueDate: dueDate ? dueDate.toISOString() : null,
              dueTime: dueTime ? dueTime.toISOString() : null,
              priority,
              category,
              repeat,
              tags: selectedTags,
              notes: notes.trim() || undefined,
            }
          : todo,
      );
    } else {
      const newTodo: Todo = {
        id: Date.now().toString(),
        title: input.trim(),
        completed: false,
        dueDate: dueDate ? dueDate.toISOString() : null,
        dueTime: dueTime ? dueTime.toISOString() : null,
        status: 'pending',
        completedAt: null,
        priority,
        category,
        repeat,
        tags: selectedTags,
        notes: notes.trim() || undefined,
      };

      nextTodos = [...normalizedTodos, newTodo];
    }

    await saveTodo(nextTodos);
    await syncTodoReminders(nextTodos);

    navigation.navigate('Home', { refreshAt: Date.now() });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadowStyle]} onPress={() => navigation.navigate('Home')}>
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={[styles.label, { color: colors.subText }]}>Task Title</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.input, color: colors.text }, cardShadowStyle]}
        placeholder="Write your task..."
        placeholderTextColor={placeholderColor}
        value={input}
        onChangeText={setInput}
      />

      <TouchableOpacity
        style={styles.notesToggle}
        onPress={() => setShowNotesInput(value => !value)}
      >
        <Icon name="document-text-outline" size={16} color={colors.subText} />
        <Text style={[styles.notesToggleText, { color: colors.subText }]}>{showNotesInput ? 'Hide note' : 'Add note'}</Text>
      </TouchableOpacity>

      {showNotesInput && (
        <TextInput
          style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }, cardShadowStyle]}
          placeholder="Write a note..."
          placeholderTextColor={placeholderColor}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority</Text>
        <View style={styles.chipRow}>
          {(['High', 'Medium', 'Low'] as PriorityType[]).map(item => {
            const isActive = priority === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, { backgroundColor: isActive ? colors.filterActive : colors.filterBg }, pillShadowStyle, isActive && styles.chipActive]}
                onPress={() => setPriority(item)}
              >
                <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.text }, isActive && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
        <View style={styles.chipRow}>
          {(['Work', 'Personal', 'Study'] as CategoryType[]).map(item => {
            const isActive = category === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, { backgroundColor: isActive ? colors.filterActive : colors.filterBg }, pillShadowStyle, isActive && styles.chipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.text }, isActive && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Repeat</Text>
        <View style={styles.chipRow}>
          {(['none', 'daily', 'weekly'] as RepeatType[]).map(item => {
            const isActive = repeat === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, { backgroundColor: isActive ? colors.filterActive : colors.filterBg }, pillShadowStyle, isActive && styles.chipActive]}
                onPress={() => setRepeat(item)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.tagRow}>
        {selectedTags.map(tag => (
          <TouchableOpacity
            key={tag.id}
            style={[styles.tagBadge, { backgroundColor: tag.color }]}
            onPress={() => removeTag(tag.id)}
          >
            <Text style={styles.tagBadgeText}>{tag.name} x</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.tagAddButton, { backgroundColor: colors.filterBg }, pillShadowStyle]} onPress={() => setShowTagModal(true)}>
          <Icon name="pricetag-outline" size={14} color="#FFFFFF" />
          <Text style={[styles.tagAddText, { color: colors.text }]}>Tags</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateButtonText, { color: colors.text }]}>{dueDate ? dueDate.toDateString() : 'Select Date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }, cardShadowStyle]} onPress={() => setShowTimePicker(true)}>
          <Text style={[styles.dateButtonText, { color: colors.text }]}>
            {dueTime
              ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Select Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setDueTime(selectedTime);
            }
          }}
        />
      )}

      <TouchableOpacity style={[styles.saveButton, cardShadowStyle]} onPress={saveTask}>
        <Text style={styles.saveButtonText}>{editingTodo ? 'Update Task' : 'Create Task'}</Text>
      </TouchableOpacity>

      <Modal visible={showTagModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }, cardShadowStyle]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Tag</Text>

            <View style={[styles.tagInputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="Tag name..."
                placeholderTextColor={placeholderColor}
                value={tagInput}
                onChangeText={setTagInput}
              />
              <TouchableOpacity style={[styles.tagConfirmBtn, { backgroundColor: selectedTagColor }]} onPress={addTag}>
                <Text style={styles.tagConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colorRow}>
              {TAG_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorDot, { backgroundColor: color }, selectedTagColor === color && styles.colorDotSelected]}
                  onPress={() => setSelectedTagColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTagModal(false)}>
              <Text style={[styles.modalCloseText, { color: colors.text }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavBar navigation={navigation} activeTab="AddTask" />
    </View>
  );
};

export default AddTaskScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1013',
    padding: 20,
    paddingBottom: 92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#181B20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: '#B8BFCC',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#232730',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#E7ECF6',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#232730',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    color: '#D8DFED',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  notesToggleText: {
    color: '#B8BFCC',
    fontSize: 13,
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E333D',
    backgroundColor: '#232730',
    color: '#FFFFFF',
    minHeight: 66,
    textAlignVertical: 'top',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  tagBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tagAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232730',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  tagAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#181B20',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#E7ECF6',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 'auto',
    marginBottom: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#181B20',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E333D',
    backgroundColor: '#232730',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  tagInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 10,
  },
  tagConfirmBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tagConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

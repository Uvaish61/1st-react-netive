import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { useAppTheme } from '../contexts/ThemeContext';
import {
  clearSession,
  deleteAccount,
  getSession,
  updatePassword,
  updateSessionUsername,
} from '../storage/auth.storage';

type ModalType = 'editName' | 'changePassword' | 'deleteAccount' | null;

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [nameInput, setNameInput] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const avatarScale = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const cardShadow = {
    shadowColor: isDark ? '#000' : '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: isDark ? 8 : 4,
  };
  const pillShadow = {
    shadowColor: isDark ? '#000' : '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.22 : 0.09,
    shadowRadius: 6,
    elevation: isDark ? 4 : 3,
  };

  const playEntrance = useCallback(() => {
    avatarScale.setValue(0);
    headerOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(avatarScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [avatarScale, headerOpacity]);

  const loadSession = useCallback(async () => {
    const session = await getSession();
    if (session) {
      setUsername(session.username);
      setEmail(session.email);
    }
    playEntrance();
  }, [playEntrance]);

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession]),
  );

  const initials = username
    ? username
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Username empty nahi ho sakta.');
      return;
    }
    await updateSessionUsername(trimmed);
    setUsername(trimmed);
    setActiveModal(null);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Error', 'Sare fields bharna zaroori hain.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Error', 'New passwords match nahi karte.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Error', 'Password kam se kam 6 characters ka hona chahiye.');
      return;
    }
    const result = await updatePassword(currentPwd, newPwd);
    if (!result.ok) {
      Alert.alert('Error', result.message);
      return;
    }
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setActiveModal(null);
    Alert.alert('Success', 'Password update ho gaya!');
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const openEditName = () => {
    setNameInput(username);
    setActiveModal('editName');
  };

  const placeholderColor = isDark ? '#787878' : '#94A3B8';

  const renderMenuRow = (
    icon: string,
    label: string,
    onPress: () => void,
    iconColor?: string,
    danger?: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: danger ? '#FEE2E2' : `${iconColor || colors.filterActive}22` }]}>
        <Icon name={icon} size={18} color={danger ? '#EF4444' : (iconColor || colors.filterActive)} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? '#EF4444' : colors.text }]}>{label}</Text>
      <Icon name="chevron-forward" size={16} color={danger ? '#EF4444' : colors.subText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card }, pillShadow]}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Avatar + Info */}
        <Animated.View
          style={[
            styles.avatarSection,
            { opacity: headerOpacity },
            { transform: [{ scale: avatarScale }] },
          ]}
        >
          <View style={[styles.avatarRing, { borderColor: colors.filterActive }]}>
            <View style={[styles.avatar, { backgroundColor: colors.filterActive }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{username || 'User'}</Text>
          <Text style={[styles.profileEmail, { color: colors.subText }]}>{email}</Text>
          <TouchableOpacity
            style={[styles.editAvatarBtn, { backgroundColor: colors.filterBg }, pillShadow]}
            onPress={openEditName}
          >
            <Icon name="pencil-outline" size={13} color={colors.text} />
            <Text style={[styles.editAvatarText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Account Section */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow, { opacity: headerOpacity }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>ACCOUNT</Text>
          {renderMenuRow('person-outline', 'Edit Username', openEditName, '#60A5FA')}
          {renderMenuRow('lock-closed-outline', 'Change Password', () => setActiveModal('changePassword'), '#A78BFA')}
          {renderMenuRow(
            'shield-checkmark-outline',
            'Privacy & Security',
            () =>
              Alert.alert(
                'Privacy & Security',
                'Aapka data sirf is device par store hota hai. Koi cloud sync nahi hai.',
              ),
            '#34D399',
          )}
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow, { opacity: headerOpacity }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>PREFERENCES</Text>

          <View style={[styles.menuRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#F59E0B22' }]}>
              <Icon name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: '#4CAF5066' }}
              thumbColor={isDark ? '#4CAF50' : '#94A3B8'}
            />
          </View>

          <View style={[styles.menuRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#38BDF822' }]}>
              <Icon name="notifications-outline" size={18} color="#38BDF8" />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#CBD5E1', true: '#4CAF5066' }}
              thumbColor={notifEnabled ? '#4CAF50' : '#94A3B8'}
            />
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow, { opacity: headerOpacity }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>SUPPORT</Text>
          {renderMenuRow(
            'help-circle-outline',
            'Help & Support',
            () =>
              Alert.alert(
                'Help & Support',
                'Kisi bhi issue ke liye app dobara install karein ya data clear karein. Yeh ek local-only app hai.',
              ),
            '#60A5FA',
          )}
          {renderMenuRow(
            'information-circle-outline',
            'About App',
            () =>
              Alert.alert(
                'About Todo App',
                'Version 1.0.0\nBuilt with React Native\nSab data locally store hota hai.',
              ),
            '#A78BFA',
          )}
          {renderMenuRow(
            'star-outline',
            'Rate the App',
            () => Alert.alert('Rate App', 'Shukriya! Rating feature jald aayega.'),
            '#F59E0B',
          )}
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow, { opacity: headerOpacity }]}>
          <Text style={[styles.sectionHeader, { color: colors.subText }]}>MANAGE ACCOUNT</Text>
          {renderMenuRow(
            'person-remove-outline',
            'Delete Account',
            () => setActiveModal('deleteAccount'),
            '#EF4444',
            true,
          )}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <TouchableOpacity style={[styles.logoutBtn, cardShadow]} onPress={handleLogout} activeOpacity={0.85}>
            <Icon name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={activeModal === 'editName'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }, cardShadow]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Username</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="New username..."
              placeholderTextColor={placeholderColor}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.filterBg }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleSaveName}>
                <Text style={styles.modalBtnTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={activeModal === 'changePassword'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }, cardShadow]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>

            <View style={[styles.pwdRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.pwdInput, { color: colors.text }]}
                placeholder="Current password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showCurrentPwd}
                value={currentPwd}
                onChangeText={setCurrentPwd}
              />
              <TouchableOpacity onPress={() => setShowCurrentPwd(v => !v)}>
                <Icon name={showCurrentPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.pwdRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.pwdInput, { color: colors.text }]}
                placeholder="New password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!showNewPwd}
                value={newPwd}
                onChangeText={setNewPwd}
              />
              <TouchableOpacity onPress={() => setShowNewPwd(v => !v)}>
                <Icon name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm new password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.filterBg }]}
                onPress={() => {
                  setCurrentPwd('');
                  setNewPwd('');
                  setConfirmPwd('');
                  setActiveModal(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleChangePassword}>
                <Text style={styles.modalBtnTextPrimary}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={activeModal === 'deleteAccount'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={styles.dangerIconWrap}>
              <Icon name="warning-outline" size={36} color="#EF4444" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center' }]}>Delete Account</Text>
            <Text style={[styles.dangerDesc, { color: colors.subText }]}>
              Yeh action permanent hai. Aapka account aur sab data delete ho jayega. Kya aap sure hain?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.filterBg }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnDanger]} onPress={handleDeleteAccount}>
                <Text style={styles.modalBtnTextPrimary}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 108,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 14,
  },
  editAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editAvatarText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
    marginBottom: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  pwdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  pwdInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: '#4CAF50',
  },
  modalBtnDanger: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerIconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerDesc: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
});

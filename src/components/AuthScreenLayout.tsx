import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type AuthTab = 'login' | 'signup';

interface AuthScreenLayoutProps {
  activeTab: AuthTab;
  title: string;
  subtitle: string;
  navigation: any;
  children: React.ReactNode;
}

const AuthScreenLayout = ({
  activeTab,
  title,
  subtitle,
  navigation,
  children,
}: AuthScreenLayoutProps) => {
  const openTab = (tab: AuthTab) => {
    if (tab === activeTab) {
      return;
    }

    navigation.navigate(tab === 'login' ? 'Login' : 'Signup');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#111315" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.patternTopRight} />
            <View style={styles.patternMid} />
            <View style={styles.patternLeft} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.replace('AuthLanding')}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openTab('login')}
                style={[
                  styles.segmentButton,
                  activeTab === 'login' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeTab === 'login' && styles.segmentTextActive,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openTab('signup')}
                style={[
                  styles.segmentButton,
                  activeTab === 'signup' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeTab === 'signup' && styles.segmentTextActive,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111315',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#111315',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 34,
    overflow: 'hidden',
  },
  patternTopRight: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 118,
    height: 118,
    backgroundColor: '#181B1D',
    borderRadius: 24,
  },
  patternMid: {
    position: 'absolute',
    top: 62,
    right: 64,
    width: 60,
    height: 60,
    backgroundColor: '#141719',
    borderRadius: 18,
  },
  patternLeft: {
    position: 'absolute',
    top: 94,
    left: -18,
    width: 56,
    height: 56,
    backgroundColor: '#16191B',
    borderRadius: 18,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2B3134',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 34,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    maxWidth: 270,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#9AA1A6',
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 290,
  },
  card: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -4,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    minHeight: 540,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E9ECEF',
    borderRadius: 26,
    padding: 5,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  segmentText: {
    color: '#7D848B',
    fontSize: 17,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#101828',
  },
});

export default AuthScreenLayout;

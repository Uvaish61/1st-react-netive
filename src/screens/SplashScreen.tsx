import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  clearSession,
  getSession,
  hasValidSession,
} from '../storage/auth.storage';

const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      const validSession = await hasValidSession();

      setTimeout(() => {
        if (!session) {
          navigation.replace('Login');
        } else if (validSession) {
          navigation.replace('MainTabs');
        } else {
          clearSession();
          navigation.replace('Login');
        }
      }, 1500);
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <View style={styles.logoLockup}>
        <View style={styles.markWrap}>
          <View style={styles.outerArc}>
            <View style={styles.outerMaskTop} />
            <View style={styles.outerMaskMid} />
            <View style={styles.outerMaskBottom} />
          </View>

          <View style={styles.innerArc}>
            <View style={styles.innerMaskTop} />
            <View style={styles.innerMaskBottom} />
          </View>

          <View style={styles.checkStem} />
          <View style={styles.checkArm} />
        </View>

        <Text style={styles.wordmark}>Clario</Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowLarge: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(123, 223, 186, 0.12)',
    transform: [{ translateY: -32 }],
  },
  glowSmall: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(123, 223, 186, 0.12)',
    transform: [{ translateY: -12 }],
  },
  logoLockup: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.275 }],
  },
  markWrap: {
    width: 210,
    height: 210,
    marginBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerArc: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 18,
    borderColor: '#66D1B0',
  },
  outerMaskTop: {
    position: 'absolute',
    top: -18,
    right: -20,
    width: 74,
    height: 56,
    backgroundColor: '#FFFFFF',
    transform: [{ skewX: '-34deg' }],
  },
  outerMaskMid: {
    position: 'absolute',
    right: -30,
    top: 66,
    width: 78,
    height: 54,
    backgroundColor: '#FFFFFF',
  },
  outerMaskBottom: {
    position: 'absolute',
    right: -18,
    bottom: -18,
    width: 76,
    height: 54,
    backgroundColor: '#FFFFFF',
    transform: [{ skewX: '34deg' }],
  },
  innerArc: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 18,
    borderColor: '#66D1B0',
  },
  innerMaskTop: {
    position: 'absolute',
    top: -18,
    right: -26,
    width: 92,
    height: 74,
    backgroundColor: '#FFFFFF',
    transform: [{ skewX: '-36deg' }],
  },
  innerMaskBottom: {
    position: 'absolute',
    right: -24,
    bottom: -18,
    width: 86,
    height: 56,
    backgroundColor: '#FFFFFF',
    transform: [{ skewX: '36deg' }],
  },
  checkStem: {
    position: 'absolute',
    width: 34,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#66D1B0',
    transform: [{ rotate: '-44deg' }, { translateX: -8 }, { translateY: 12 }],
  },
  checkArm: {
    position: 'absolute',
    width: 36,
    height: 132,
    borderRadius: 10,
    backgroundColor: '#66D1B0',
    transform: [{ rotate: '44deg' }, { translateX: 28 }, { translateY: -2 }],
  },
  wordmark: {
    fontSize: 62,
    lineHeight: 68,
    fontWeight: '800',
    color: '#444D5C',
    letterSpacing: -2,
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './bottom-tabs/MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ArchivedTasksScreen from '../screens/ArchivedTasksScreen';
import CalendarTasksScreen from '../screens/CalendarTasksScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="ArchivedTasks" component={ArchivedTasksScreen} />
        <Stack.Screen name="CalendarTasks" component={CalendarTasksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default AppNavigator;

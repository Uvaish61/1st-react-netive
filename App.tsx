import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import notifee, { EventType } from '@notifee/react-native';
import './global.css'

const App = () => {
    useEffect(() => {
        return notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                console.log('Notification pressed:', detail.notification?.id);
            }
        });
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AppNavigator />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
};
export default App;

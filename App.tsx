import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './global.css'
const App= () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AppNavigator />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
    };
export default App;

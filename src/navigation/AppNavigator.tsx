import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack"


import AuthLanding from "../screens/auth/AuthLanding";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {

    return(
        <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false}}>
        <Stack.Screen name="Splash" component={SplashScreen}/>
        <Stack.Screen name="AuthLanding" component={AuthLanding} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />

            </Stack.Navigator>
        </NavigationContainer>
        











    );
};
export default AppNavigator;
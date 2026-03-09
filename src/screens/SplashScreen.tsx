import React, { useEffect} from "react";
import { View, Text, ActivityIndicator  } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
const SplashScreen = ({ navigation }: any) => {

    useEffect(() =>  {
        const checkAuth = async () => {
      const account = await AsyncStorage.getItem("userAccount");
      const loggedIn = await AsyncStorage.getItem("isLoggedIn");

      setTimeout(() =>{
        if (!account) {
            navigation.replace("AuthLanding");    
        }
        else if (loggedIn === "true") {
            navigation.replace("HomeScreen");
        }
        else {
            navigation.replace("Login");
        }
    }, 1500);
 };
 checkAuth();
    }, []);
    return (
        <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-3xl font-bold mb-6">
        Todo App
        </Text>

        <ActivityIndicator size="large" color="black"/>

        
        
        </View>
    );
    };

    export default SplashScreen;
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Missing Fields", "Please enter email and password");
        return;
    }

    try {
        
        const response = await fetch("http://10.0.2.2:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();
        
if (!response.ok) {
Alert.alert("Login Failed", "Token not received from server");
return;
}
const token = data?.token;
        if (!token) {
            Alert.alert("Login Failed", data?.message || "Invalid credentials");
            return;
        }

        Alert.alert("Success", "Login successful");
        navigation.replace("Home",{token});
    } catch (error) {
        Alert.alert("Network Error", "Could not connect to server");
    }
};

    return (
        <View className="flex-1 bg-white px-6 justify-center">

            <Text className="text-3xl font-bold text-center mb-8">
                Login
            </Text>

            <View className="flex-row items-center border border-black rounded-lg px-3 mb-4">
                <Icon name="mail-outline" size={20} color="black" />
                <TextInput
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 ml-2 py-3 text-black"
                />
            </View>

            <View className="flex-row items-center border border-black rounded-lg px-3 mb-6">
                <Icon name="lock-closed-outline" size={20} color="black" />
                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    className="flex-1 ml-2 py-3 text-black"
                />
            </View>

            <TouchableOpacity
                onPress={handleLogin}
                className="bg-black py-4 rounded-xl items-center">
                <Text className="text-white text-lg font-semibold">
                    Login
                </Text>
            </TouchableOpacity>

        </View>
    );
};


export default LoginScreen;

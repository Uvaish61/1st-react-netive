import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = ({ navigation }: any) => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const handleLogin = async () => {
    const storedUser = await AsyncStorage.getItem("userAccount");
    if (!storedUser){
        Alert.alert(
            "Account Not Found",
            "You have not created an account . Please create the account fisrt. "
        );
        return;
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
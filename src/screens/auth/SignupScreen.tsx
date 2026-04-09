import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

const SignupScreen = ({ navigation } : any) => {


  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
  if (!username || !email || !password) {
    Alert.alert("Missing Fields", "Please enter username, email and password");
    return;
  }
  try {
    const response = await fetch("http://10.0.2.2:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Signup Failed", data?.message || "Something went wrong");
      return;
    }

    await AsyncStorage.setItem("userAccount", JSON.stringify({ username, email }));
    await AsyncStorage.setItem("isLoggedIn", "true");
    Alert.alert("Success", "Account created successfully");
    navigation.replace("Home");
  } catch (error) {
    Alert.alert("Network Error", "Could not connect to server");
  }
};
  


  return (
    <View className="flex-1 bg-white px-6 justify-center">

      <Text className="text-3xl font-bold text-center mb-8">
        Create Account
      </Text>

      {/* Name Input */}
      <View className="flex-row items-center border border-black rounded-lg px-3 mb-4">
        <Icon name="person-outline" size={20} color="black" />
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          className="flex-1 ml-2 py-3"
        />
      </View>

      {/* Email Input */}
      <View className="flex-row items-center border border-black rounded-lg px-3 mb-4">
        <Icon name="mail-outline" size={20} color="black" />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          className="flex-1 ml-2 py-3"
        />
      </View>

      {/* Password Input */}
      <View className="flex-row items-center border border-black rounded-lg px-3 mb-6">
        <Icon name="lock-closed-outline" size={20} color="black" />
        <TextInput
          placeholder="Password"
          placeholderTextColor="gray"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="flex-1 ml-2 py-3 text-black"
          //hello 
        />
      </View>

      {/* Create Account Button */}
      <TouchableOpacity
      onPress={handleSignup}
      className="bg-black py-4 rounded-xl items-center">
        <Text className="text-white text-lg font-semibold">
          Create Account
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default SignupScreen;
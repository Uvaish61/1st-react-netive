import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const SignScreen = () => {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="flex-1 bg-white px-6 justify-center">

      <Text className="text-3xl font-bold text-center mb-8">
        Create Account
      </Text>

      {/* Name Input */}
      <View className="flex-row items-center border border-black rounded-lg px-3 mb-4">
        <Icon name="person-outline" size={20} color="black" />
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="flex-1 ml-2 py-3 text-black"
          //hello 
        />
      </View>

      {/* Create Account Button */}
      <TouchableOpacity className="bg-black py-4 rounded-xl items-center">
        <Text className="text-white text-lg font-semibold">
          Create Account
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default SignScreen;
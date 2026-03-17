import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

// Ionicons icon library
import Icon from "react-native-vector-icons/Ionicons";

// Navigation prop receive kar rahe hain
const AuthLanding = ({ navigation }: any) => {

  return (

    // Main container
    <View className="flex-1 bg-white items-center justify-center px-6">

      {/* App title */}
      <Text className="text-4xl font-bold text-gray-800 mb-4">
        Todo App
      </Text>

      {/* Subtitle */}
      <Text className="text-gray-500 mb-12 text-center">
        Organize your tasks and stay productive
      </Text>


      {/* ================= LOGIN BUTTON ================= */}

      <TouchableOpacity
        // Button click par Login screen open karega
        onPress={() => navigation.navigate("Login")}

        className="w-full bg-black py-4 rounded-xl mb-4 flex-row items-center justify-center"
      >
        {/* Login icon */}
        <Icon name="log-in-outline" size={20} color="white" />

        {/* Login text */}
        <Text className="text-white text-lg font-semibold ml-2">
          Login
        </Text>
      </TouchableOpacity>


      {/* ================= CREATE ACCOUNT BUTTON ================= */}

      <TouchableOpacity
        // Button click par Signup screen open karega
        onPress={() => navigation.navigate("Signup")}

        className="w-full border border-black py-4 rounded-xl flex-row items-center justify-center"
      >
        {/* Signup icon */}
        <Icon name="person-add-outline" size={20} color="black" />

        {/* Signup text */}
        <Text className="text-black text-lg font-semibold ml-2">
          Create Account
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default AuthLanding;

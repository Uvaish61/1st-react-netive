import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
const AuthLanding = () => {
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-4xl font-bold text-gray-800 mb-4">Todo App</Text>
      <Text className="text-gray-500 mb-12 text-center">
        Organize your tasks and stay productive
      </Text>
      {/* App Title */}
      <TouchableOpacity className="w-full bg-black py-4 rounded-x1 mb-4 flex-row items-center justify-center">
        <Icon name="log-in-outline" size={20} color="white" />
        <Text className="text-white text-lg font-semibold ml-2">Login</Text>
      </TouchableOpacity>
      {/* Signup Button */}
      <TouchableOpacity className="w-full border border-black py-4 rounded-x1 flex-row items-center justify-center">
        <Icon name="person-add-outline" size={20} color="black" />
        <Text className="text-black text-lg font-semibold ml-2">
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
};
export default AuthLanding;

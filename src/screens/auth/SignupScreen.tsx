import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Controller, useForm } from "react-hook-form";
import AuthScreenLayout from "../../components/AuthScreenLayout";
import { persistSession, registerUser } from "../../storage/auth.storage";

type SignupFormValues = {
  username: string;
  email: string;
  password: string;
};

const SignupScreen = ({ navigation, route } : any) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      username: "",
      email: route?.params?.email || "",
      password: "",
    },
  });

  const emailValue = watch("email");

  const handleSignup = async ({ username, email, password }: SignupFormValues) => {
  try {
    const result = await registerUser({
      username: username.trim(),
      email,
      password,
    });

    if (!result.ok) {
      Alert.alert("Signup Failed", result.message);
      return;
    }

    await persistSession(result.user);
    Alert.alert("Success", "Account created successfully");
    navigation.replace("MainTabs");
  } catch {
    Alert.alert("Signup Failed", "Could not create account in local storage");
  }
};
  


  return (
    <AuthScreenLayout
      activeTab="signup"
      title="Create your account and start organizing"
      subtitle="Register once and jump straight into your personalized local Todo workspace."
      navigation={navigation}
    >
      <View style={styles.form}>
        <View>
          <View style={[styles.inputCard, errors.username && styles.inputCardError]}>
            <View style={styles.leadingIcon}>
              <Icon name="person-outline" size={20} color="#6E9278" />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                rules={{
                  required: "Username is required",
                  minLength: {
                    value: 2,
                    message: "Username must be at least 2 characters",
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Choose a username"
                    placeholderTextColor="#98A2B3"
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                  />
                )}
              />
            </View>
          </View>
          {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
        </View>

        <View>
          <View style={[styles.inputCard, errors.email && styles.inputCardError]}>
            <View style={styles.leadingIcon}>
              <Icon name="mail-outline" size={20} color="#6E9278" />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.label}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Enter a valid email address",
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#98A2B3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                  />
                )}
              />
            </View>
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View>
          <View style={[styles.inputCard, errors.password && styles.inputCardError]}>
            <View style={styles.leadingIcon}>
              <Icon name="lock-closed-outline" size={20} color="#6E9278" />
            </View>
            <View style={styles.inputBody}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Create a password"
                    placeholderTextColor="#98A2B3"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                  />
                )}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowPassword(value => !value)}
              style={styles.trailingIcon}
            >
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#98A2B3"
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <View style={styles.helperRow}>
          <Text style={styles.helperText}>Your account will stay on this device</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Login", { email: emailValue.trim() })}
          >
            <Text style={styles.linkText}>Have an account?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit(handleSignup)}
          style={styles.primaryButton}
          activeOpacity={0.9}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8EAED",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F7F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inputBody: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#98A2B3",
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    color: "#111315",
    fontSize: 18,
    fontWeight: "600",
    paddingVertical: 4,
  },
  inputCardError: {
    borderColor: "#E57373",
  },
  trailingIcon: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: "#C62828",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  helperText: {
    color: "#667085",
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  linkText: {
    color: "#6E9278",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
        marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default SignupScreen;

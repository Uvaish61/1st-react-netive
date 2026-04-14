import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AuthScreenLayout from "../../components/AuthScreenLayout";
import { loginUser, persistSession } from "../../storage/auth.storage";

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Missing Fields", "Please enter email and password");
        return;
    }

    try {
        const result = await loginUser(email, password);

        if (!result.ok) {
            if (result.reason === "not_found") {
                Alert.alert(
                    "Account Not Found",
                    "Is email ka account nahi mila. Create account page par ja rahe hain.",
                    [
                        {
                            text: "Create Account",
                            onPress: () => navigation.navigate("Signup", { email: email.trim() }),
                        },
                    ],
                );
                return;
            }

            Alert.alert("Login Failed", result.message);
            return;
        }
        
        await persistSession(result.user);

        Alert.alert("Success", "Login successful");
        navigation.replace("Home");
    } catch {
        Alert.alert("Login Failed", "Could not log you in from local storage");
    }
};

    return (
        <AuthScreenLayout
            activeTab="login"
            title="Go ahead and set up your account"
            subtitle="Sign in to continue managing your tasks with the same clean Todo experience."
            navigation={navigation}
        >
            <View style={styles.form}>
                <View style={styles.inputCard}>
                    <View style={styles.leadingIcon}>
                        <Icon name="mail-outline" size={20} color="#6E9278" />
                    </View>
                    <View style={styles.inputBody}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            placeholder="Enter your email"
                            placeholderTextColor="#98A2B3"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputCard}>
                    <View style={styles.leadingIcon}>
                        <Icon name="lock-closed-outline" size={20} color="#6E9278" />
                    </View>
                    <View style={styles.inputBody}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor="#98A2B3"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
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

                <View style={styles.helperRow}>
                    <Text style={styles.helperText}>Local account login</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("Signup", { email: email.trim() })}
                    >
                        <Text style={styles.linkText}>Create Account</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.primaryButton}
                    activeOpacity={0.9}
                >
                    <Text style={styles.primaryButtonText}>
                        Login
                    </Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>Or use your account flow</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("Signup", { email: email.trim() })}
                >
                    <Icon name="person-add-outline" size={18} color="#111315" />
                    <Text style={styles.secondaryButtonText}>Register New Account</Text>
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
    trailingIcon: {
        paddingLeft: 12,
        paddingVertical: 8,
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
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 6,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E4E7EC",
    },
    dividerText: {
        color: "#667085",
        fontSize: 13,
        marginHorizontal: 12,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E8EAED",
        paddingVertical: 16,
        gap: 10,
    },
    secondaryButtonText: {
        color: "#111315",
        fontSize: 16,
        fontWeight: "700",
    },
});


export default LoginScreen;

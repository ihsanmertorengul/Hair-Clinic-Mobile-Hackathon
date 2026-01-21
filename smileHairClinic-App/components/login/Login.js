// Modernized Login Screen (React Native)
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../service/Firebase";
import { doc, getDoc } from "firebase/firestore";

const Login = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
            return;
        }

        try {
            setLoading(true);
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;

            Alert.alert("Başarılı", "Giriş yapıldı!");
            navigation.navigate("MainTabs", {
                screen: "Ana Sayfa",
                params: { user },
            });
        } catch (error) {
            let msg = "Bir hata oluştu.";
            if (error.code === "auth/user-not-found") msg = "Bu email ile kullanıcı bulunamadı.";
            if (error.code === "auth/invalid-email") msg = "Geçersiz email.";
            if (error.code === "auth/wrong-password") msg = "Şifre yanlış.";
            if (error.code === "auth/too-many-requests") msg = "Çok fazla deneme yapıldı.";
            Alert.alert("Hata", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoBox}>
                        <Image
                            source={require("../../assets/images/logo.png")}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Hoş Geldiniz 👋</Text>
                        <Text style={styles.subtitle}>
                            Hesabınıza erişmek için bilgilerinizi girin
                        </Text>

                        {/* Input: Email */}
                        <View style={styles.inputBox}>
                            <MaterialIcons name="email" size={20} color="#667085" style={styles.inputLeftIcon} />
                            <TextInput
                                placeholder="E-posta adresi"
                                placeholderTextColor="#999"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Input: Password */}
                        <View style={styles.inputBox}>
                            <MaterialIcons name="lock" size={20} color="#667085" style={styles.inputLeftIcon} />
                            <TextInput
                                placeholder="Şifreniz"
                                placeholderTextColor="#999"
                                style={styles.input}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeBtn}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#777"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Şifrenizi mi unuttunuz?</Text>
                        </TouchableOpacity>

                        {/* Button */}
                        <TouchableOpacity
                            style={[styles.button, (!email || !password) && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={!email || !password || loading}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.buttonText}>{loading ? "Yükleniyor..." : "Giriş Yap"}</Text>
                        </TouchableOpacity>

                        {/* Register */}
                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>Hesabınız yok mu?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                <Text style={styles.footerLink}> Kayıt Olun</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
    },
    logoBox: {
        alignItems: "center",
        marginBottom: 24,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 48,
        backgroundColor: "#F4F4F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    logoIcon: {
        fontSize: 42,
    },
    logoImage: {
        width: 160,   // istediğin gibi büyütebilirsin
        height: 160,
    },
    brand: {
        fontSize: 30,
        fontWeight: "800",
        color: "#101828",
        letterSpacing: 2,
    },
    brandSub: {
        fontSize: 14,
        color: "#667085",
        letterSpacing: 1.5,
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 28,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#F2F4F7",
        shadowColor: "#101828",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#101828",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: "#475467",
        marginBottom: 24,
    },
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#EAECF0",
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 16,
    },
    inputLeftIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#101828",
    },
    eyeBtn: {
        padding: 6,
    },
    forgotBtn: {
        alignSelf: "flex-end",
        marginBottom: 12,
    },
    forgotText: {
        color: "#0F62FE",
        fontWeight: "600",
        fontSize: 13,
    },
    button: {
        backgroundColor: "#0F62FE",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 8,
    },
    footerText: {
        color: "#667085",
        fontSize: 14,
    },
    footerLink: {
        color: "#0F62FE",
        fontWeight: "700",
        fontSize: 14,
        textDecorationLine: "underline",
    },
});

export default Login;

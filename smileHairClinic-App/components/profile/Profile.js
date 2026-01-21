import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import DateTimePicker from "@react-native-community/datetimepicker";

import { auth, db } from "../../service/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";

const Profile = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("+90");
    const [birthDate, setBirthDate] = useState(null);
    const [countryFlag] = useState("🇹🇷");

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Refs for input navigation
    const surnameRef = useRef(null);
    const phoneRef = useRef(null);

    // -------------------------------------------------------------
    // Firestore'dan Kullanıcı Bilgisi Çekme
    // -------------------------------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();

                setName(data.name || "");
                setSurname(data.surname || "");
                setEmail(data.email || "");

                // Telefon ayırma
                const phoneNum = data.phone || "";
                const code = phoneNum.slice(0, 3); // +90
                const number = phoneNum.slice(3);

                setCountryCode(code);
                setPhone(number);

                setBirthDate(
                    data.birthDate ? new Date(data.birthDate) : null
                );
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const formatPhone = (t) => t.replace(/\D/g, "");
    const handlePhoneChange = (t) => setPhone(formatPhone(t));

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set") {
            setBirthDate(selectedDate);
        }
        setShowDatePicker(false);
    };

    // -------------------------------------------------------------
    // Profil Kaydet
    // -------------------------------------------------------------
    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Ad alanı zorunludur';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Ad en az 2 karakter olmalıdır';
        }

        if (!surname.trim()) {
            newErrors.surname = 'Soyad alanı zorunludur';
        } else if (surname.trim().length < 2) {
            newErrors.surname = 'Soyad en az 2 karakter olmalıdır';
        }

        if (phone.trim() && phone.length < 10) {
            newErrors.phone = 'Telefon numarası en az 10 haneli olmalıdır';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }], // Login ekranınızın adı
            });
        } catch (e) {
            Alert.alert("Hata", "Çıkış yapılamadı.");
        }
    };

    const handleSave = async () => {
        Keyboard.dismiss();

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const user = auth.currentUser;
            await updateDoc(doc(db, "users", user.uid), {
                name: name.trim(),
                surname: surname.trim(),
                phone: phone.trim() ? `${countryCode}${phone}` : null,
                birthDate: birthDate
                    ? birthDate.toISOString().split("T")[0]
                    : null,
            });

            Alert.alert("Başarılı", "Profil güncellendi!");
        } catch (e) {
            Alert.alert("Hata", "Güncelleme başarısız.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1976d2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formCard}>
                    {/* NAME */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ad</Text>
                        <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                            <MaterialIcons name="person" size={20} color={errors.name ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                                placeholder="Adınızı girin"
                                placeholderTextColor="#999"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => surnameRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    {/* SURNAME */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Soyad</Text>
                        <View style={[styles.inputContainer, errors.surname && styles.inputError]}>
                            <MaterialIcons name="person-outline" size={20} color={errors.surname ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                            <TextInput
                                ref={surnameRef}
                                style={styles.input}
                                value={surname}
                                onChangeText={(text) => {
                                    setSurname(text);
                                    if (errors.surname) setErrors({ ...errors, surname: '' });
                                }}
                                placeholder="Soyadınızı girin"
                                placeholderTextColor="#999"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => phoneRef.current?.focus()}
                                blurOnSubmit={false}
                            />
                        </View>
                        {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}
                    </View>

                    {/* EMAIL (DEĞİŞMEZ) */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>E-posta Adresi</Text>
                        <View style={[styles.inputContainer, styles.disabled]}>
                            <MaterialIcons name="email" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                editable={false}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* PHONE */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Telefon</Text>

                        <View style={styles.phoneContainer}>
                            <View style={[styles.countryCodeBox, errors.phone && styles.inputError]}>
                                <Text style={styles.countryFlag}>🇹🇷</Text>
                                <Text style={styles.countryCodeText}>{countryCode}</Text>
                            </View>

                            <View style={[styles.inputContainer, styles.phoneInput, errors.phone && styles.inputError]}>
                                <MaterialIcons name="phone" size={20} color={errors.phone ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    ref={phoneRef}
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={(text) => {
                                        handlePhoneChange(text);
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    placeholder="5XX XXX XX XX"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />
                            </View>
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                    </View>

                    {/* DATE OF BIRTH */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Doğum Tarihi</Text>

                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => {
                                setShowDatePicker(true);
                                Keyboard.dismiss();
                            }}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="calendar-today" size={20} color="#666" style={styles.inputIcon} />
                            <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                                {birthDate
                                    ? birthDate.toLocaleDateString("tr-TR")
                                    : "Tarih seçin"}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={birthDate || new Date(2000, 0, 1)}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={
                                    new Date(
                                        new Date().setFullYear(new Date().getFullYear() - 18)
                                    )
                                }
                            />
                        )}
                    </View>

                    {/* SAVE BUTTON */}
                    <TouchableOpacity
                        style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Kaydet</Text>
                        )}
                    </TouchableOpacity>

                    {/* LOGOUT BUTTON */}
                    <TouchableOpacity
                        style={[styles.logoutButton]}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

        </SafeAreaView >
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff"
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 140,
        alignItems: 'center',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#EAECF0',
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
    },
    formGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
        color: "#333"
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#E4E7EC",
        paddingHorizontal: 18,
        height: 58,
    },
    inputError: {
        borderColor: '#d32f2f',
        backgroundColor: '#ffebee',
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#000",
        paddingVertical: 0,
    },
    disabled: {
        opacity: 0.6,
        backgroundColor: '#f5f5f5',
    },
    phoneContainer: {
        flexDirection: "row",
        gap: 12
    },
    countryCodeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 90,
        height: 58,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#E4E7EC",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
    },
    countryFlag: {
        fontSize: 20,
    },
    countryCodeText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#101828",
    },
    phoneInput: {
        flex: 1
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: "#000"
    },
    datePlaceholder: {
        color: '#999',
    },
    primaryButton: {
        backgroundColor: "#0F62FE",
        borderRadius: 18,
        height: 58,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    // Bottom Navigation
    navBar: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        paddingVertical: 6,
        paddingBottom: 12,
        justifyContent: "space-around",
        borderRadius: 20,
        paddingHorizontal: 0,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        alignSelf: "center",
        width: "85%",
        maxWidth: 350,
    },
    navItem: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingVertical: 6,
        borderRadius: 12,
        marginHorizontal: 2,
    },
    navItemActive: {
        backgroundColor: "rgba(0, 122, 255, 0.1)",
    },
    navIconContainer: {
        position: "relative",
        marginBottom: 3,
        alignItems: "center",
        justifyContent: "center",
    },
    navIcon: {
        fontSize: 22,
        color: "#666666",
    },
    navText: {
        fontSize: 10,
        color: "#666666",
        fontWeight: "400",
    },
    navTextActive: {
        color: "#007AFF",
        fontWeight: "500",
    },
    logoutButton: {
        backgroundColor: "#d32f2f",
        borderRadius: 18,
        height: 58,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
});
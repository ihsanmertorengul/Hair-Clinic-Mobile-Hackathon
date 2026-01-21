import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import DateTimePicker from '@react-native-community/datetimepicker';

// Firebase
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../service/Firebase";
import { doc, setDoc } from "firebase/firestore";

const Register = ({ navigation }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+90');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [birthDate, setBirthDate] = useState(null);

    // Refs for input navigation
    const surnameRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);

    // Close country picker when clicking outside
    useEffect(() => {
        if (showCountryPicker) {
            const timer = setTimeout(() => {
                // Auto close after 10 seconds if not interacted
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [showCountryPicker]);

    const countryOptions = [
        { code: '+90', flag: '🇹🇷', country: 'Turkey' },
        { code: '+91', flag: '🇮🇳', country: 'India' },
        { code: '+1', flag: '🇺🇸', country: 'USA' },
        { code: '+44', flag: '🇬🇧', country: 'UK' },
    ];

    const formatPhone = (text) => text.replace(/\D/g, '');
    const handlePhoneChange = (text) => {
        setPhone(formatPhone(text));
        if (errors.phone) setErrors({ ...errors, phone: '' });
    };

    const handleDateChange = (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
            setBirthDate(selectedDate);
            if (errors.birthDate) setErrors({ ...errors, birthDate: '' });
        }
        setShowDatePicker(false);
    };

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

        if (!email.trim()) {
            newErrors.email = 'E-posta alanı zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Geçerli bir e-posta adresi girin';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Telefon alanı zorunludur';
        } else if (phone.length < 10) {
            newErrors.phone = 'Telefon numarası en az 10 haneli olmalıdır';
        }

        if (!birthDate) {
            newErrors.birthDate = 'Doğum tarihi seçmelisiniz';
        } else {
            const age = new Date().getFullYear() - birthDate.getFullYear();
            if (age < 18) {
                newErrors.birthDate = '18 yaşından büyük olmalısınız';
            }
        }

        if (!password.trim()) {
            newErrors.password = 'Şifre alanı zorunludur';
        } else if (password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        Keyboard.dismiss();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name.trim(),
                surname: surname.trim(),
                email: email.trim().toLowerCase(),
                phone: `${countryCode}${phone}`,
                birthDate: birthDate.toISOString().split("T")[0],
                createdAt: new Date(),
            });

            Alert.alert("Başarılı", "Hesabınız oluşturuldu!", [
                {
                    text: "Tamam",
                    onPress: () => navigation.navigate("Login")
                }
            ]);
        } catch (error) {
            setLoading(false);
            let msg = "Bir hata oluştu.";
            if (error.code === "auth/email-already-in-use") msg = "Bu e-posta zaten kayıtlı.";
            else if (error.code === "auth/invalid-email") msg = "Geçersiz e-posta formatı.";
            else if (error.code === "auth/weak-password") msg = "Şifre en az 6 karakter olmalı.";
            else if (error.code === "auth/network-request-failed") msg = "İnternet bağlantınızı kontrol edin.";

            Alert.alert("Hata", msg);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => {
                    setShowCountryPicker(false);
                    Keyboard.dismiss();
                }}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.title}>Hesap Oluştur</Text>
                    <Text style={styles.subtitle}>Yeni hesabınızı oluşturmak için bilgilerinizi girin</Text>
                </View>

                {/* Form Card */}
                <View style={styles.formCard}>
                    <View style={styles.form}>

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
                                    onSubmitEditing={() => emailRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                            </View>
                            {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}
                        </View>

                        {/* EMAIL */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>E-posta Adresi</Text>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <MaterialIcons name="email" size={20} color={errors.email ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    ref={emailRef}
                                    style={styles.input}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    placeholder="ornek@email.com"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => phoneRef.current?.focus()}
                                    blurOnSubmit={false}
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* PHONE */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Telefon</Text>

                            <View style={styles.phoneContainer}>
                                <TouchableOpacity
                                    style={[styles.countryCodeButton, errors.phone && styles.inputError]}
                                    onPress={() => {
                                        setShowCountryPicker(!showCountryPicker);
                                        Keyboard.dismiss();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.flagIcon}>
                                        {countryOptions.find(c => c.code === countryCode)?.flag}
                                    </Text>
                                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                                    <MaterialIcons name="arrow-drop-down" size={20} color={errors.phone ? "#d32f2f" : "#666"} />
                                </TouchableOpacity>

                                {showCountryPicker && (
                                    <View style={styles.countryPickerContainer}>
                                        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
                                            <View style={styles.countryPickerOverlay} />
                                        </TouchableWithoutFeedback>
                                        <View style={styles.countryPicker}>
                                            {countryOptions.map((country) => (
                                                <TouchableOpacity
                                                    key={country.code}
                                                    style={styles.countryOption}
                                                    onPress={() => {
                                                        setCountryCode(country.code);
                                                        setShowCountryPicker(false);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.flagIcon}>{country.flag}</Text>
                                                    <Text style={styles.countryCodeText}>{country.code}</Text>
                                                    <Text style={styles.countryName}>{country.country}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <View style={[styles.inputContainer, styles.phoneInput, errors.phone && styles.inputError]}>
                                    <MaterialIcons name="phone" size={20} color={errors.phone ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                                    <TextInput
                                        ref={phoneRef}
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={handlePhoneChange}
                                        placeholder="5XX XXX XX XX"
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        returnKeyType="next"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                </View>
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>

                        {/* DATE */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Doğum Tarihi</Text>

                            <TouchableOpacity
                                style={[styles.inputContainer, errors.birthDate && styles.inputError]}
                                onPress={() => {
                                    setShowDatePicker(true);
                                    Keyboard.dismiss();
                                }}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name="calendar-today" size={20} color={errors.birthDate ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                                <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                                    {birthDate ? birthDate.toLocaleDateString("tr-TR") : "Tarih seçin"}
                                </Text>
                            </TouchableOpacity>
                            {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

                            {showDatePicker && (
                                <DateTimePicker
                                    value={birthDate || new Date(2000, 0, 1)}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                                />
                            )}
                        </View>

                        {/* PASSWORD */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                <MaterialIcons name="lock" size={20} color={errors.password ? "#d32f2f" : "#666"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: '' });
                                    }}
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSignUp}
                                />

                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color={errors.password ? "#d32f2f" : "#666"}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            {password.length > 0 && password.length < 6 && (
                                <Text style={styles.hintText}>Şifre en az 6 karakter olmalıdır</Text>
                            )}
                        </View>

                        {/* BUTTON */}
                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                            onPress={handleSignUp}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Hesap Oluştur</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* LOGIN TEXT */}
                <View style={styles.loginRedirect}>
                    <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Login")}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.loginLink}>Giriş yapın</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default Register;

// ------------------------------------------------------
// STYLES
// ------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    form: { marginTop: 0 },
    formGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        paddingHorizontal: 16,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
    hintText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    inputIcon: {
        marginRight: 12
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        paddingVertical: 0,
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 8
    },
    countryCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        paddingHorizontal: 12,
        height: 56,
        minWidth: 100,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    flagIcon: {
        fontSize: 20,
        marginRight: 8
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000'
    },
    countryPickerContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    countryPickerOverlay: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'transparent',
    },
    countryPicker: {
        position: 'absolute',
        top: 60,
        left: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        zIndex: 1001,
        minWidth: 200,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    countryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    countryName: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8
    },
    phoneInput: {
        flex: 1
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    datePlaceholder: {
        color: '#999',
    },
    eyeIcon: {
        padding: 8,
        marginLeft: 4,
    },
    primaryButton: {
        backgroundColor: '#1976d2',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginRedirect: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: 'center',
        marginTop: 8,
    },
    loginText: {
        fontSize: 15,
        color: "#666",
    },
    loginLink: {
        fontSize: 15,
        color: "#1976d2",
        fontWeight: "600",
    },
});
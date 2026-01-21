import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../service/Firebase";

const HomeScreen = () => {
    const [name, setName] = useState("");
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const ref = doc(db, "users", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();

                setName(data.name || "");
            }
        };

        console.log("name: " + name);

        fetchData();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Greeting Card */}
                <View style={styles.greetingCard}>
                    <Text style={styles.greetingLabel}>Hoş geldiniz</Text>
                    <Text style={styles.greetingText}>Merhaba, {name || "Misafir"}</Text>
                    <Text style={styles.greetingSub}>Saç analiz sürecinize buradan devam edin.</Text>
                </View>

                {/* Cards Container */}
                <View style={styles.cardsContainer}>
                    {/* Left Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate("MyAnalysis")}
                    >
                        <View style={styles.cardBadge}>
                            <Text style={styles.cardBadgeText}>Geçmiş</Text>
                        </View>
                        <Text style={styles.cardTitle}>Saç Analizi</Text>
                        <Text style={styles.cardSubtitle}>Önceki raporlarınızı görüntüleyin.</Text>

                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                navigation.navigate("MyAnalysis");
                            }}
                        >
                            <Text style={styles.viewButtonText}>Görüntüle</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Right Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => console.log("Nasıl Yapılır")}
                    >
                        <View style={[styles.cardBadge, { backgroundColor: "#FFF4EA" }]}>
                            <Text style={[styles.cardBadgeText, { color: "#F79009" }]}>Rehber</Text>
                        </View>
                        <Text style={styles.cardTitle}>Saç Analizi</Text>
                        <Text style={styles.cardSubtitle}>Adımları öğrenin ve hazırlanın.</Text>

                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                console.log("Görüntüle - Nasıl Yapılır");
                            }}
                        >
                            <Text style={styles.viewButtonText}>Görüntüle</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>

                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../assets/images/logo.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },

    // Greeting
    greetingCard: {
        backgroundColor: "#F8FAFC",
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#EDF1F7",
    },
    greetingLabel: {
        fontSize: 13,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#667085",
        marginBottom: 6,
    },
    greetingText: {
        fontSize: 26,
        fontWeight: "800",
        color: "#101828",
        marginBottom: 4,
    },
    greetingSub: {
        fontSize: 15,
        color: "#475467",
    },

    // Cards
    cardsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    card: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        marginHorizontal: 6,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "#EEF2F6",
        shadowColor: "#101828",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    cardBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#E4ECFF",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 12,
    },
    cardBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1D4ED8",
        letterSpacing: 0.5,
    },
    cardTitle: {
        color: "#101828",
        fontSize: 18,
        fontWeight: "700",
    },
    cardSubtitle: {
        color: "#475467",
        marginBottom: 16,
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
    },
    viewButton: {
        backgroundColor: "#0F62FE",
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 30,
        alignSelf: "flex-start",
    },
    viewButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    // Logo Section
    logoContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 20,
    },
    logoIcon: {
        fontSize: 64,
        color: "#0F62FE",
        marginBottom: 12,
    },
    logoText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#101828",
        letterSpacing: 1.5,
    },
    logoSubtext: {
        fontSize: 14,
        fontWeight: "500",
        color: "#475467",
        letterSpacing: 0.5,
        textAlign: "center",
        marginTop: 4,
    },
    logoImage: {
        width: 180,   // Logo büyük gözüksün
        height: 180,
    },

    // Bottom Navigation
    navBar: {
        flexDirection: "row",
        backgroundColor: "#D9D9D9",
        paddingVertical: 10,
        justifyContent: "space-around",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    navItem: {
        alignItems: "center",
    },
    navIcon: {
        fontSize: 26,
        marginBottom: 2,
    },
    navText: {
        fontSize: 12,
        color: "#666",
    },
    navTextActive: {
        fontSize: 12,
        color: "#000",
        fontWeight: "700",
    },
});

export default HomeScreen;

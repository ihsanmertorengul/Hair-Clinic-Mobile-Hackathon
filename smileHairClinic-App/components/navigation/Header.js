import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Header = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const isHomeScreen = route.name === "Ana Sayfa";
    const isAnalysis = route.name === "Saç Analizi";
    const isProfile = route.name === "Profil";
    const isMyAnalysis = route.name === "MyAnalysis";
    const isAnalysisDetail = route.name === "AnalysisDetail";

    const handleClosePress = () => {
        navigation.goBack();
    };

    const handleHomePress = () => {
        navigation.navigate("MainTabs", {
            screen: "Ana Sayfa"
        });
    };

    const title = isHomeScreen ? "Ana Sayfa" :
        isProfile ? "Profilim" :
            isAnalysis ? "Saç Analizi" :
                isMyAnalysis ? "Analizlerim" : isAnalysisDetail ? "Analiz Detay" : "";

    return (
        <SafeAreaView style={{ backgroundColor: "#FFFFFF" }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor: "#FFFFFF",
                    elevation: 4,
                    shadowColor: "#101828",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    position: 'relative',
                }}
            >
                {/* Sol tarafta geri butonu veya boş */}
                {isMyAnalysis || isAnalysisDetail ? (
                    <TouchableOpacity onPress={handleClosePress} style={{ width: 40 }}>
                        <Ionicons name="arrow-back" size={24} color="#101828" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} /> // placeholder
                )}

                {/* Başlık */}
                <Text style={{ fontSize: 18, fontWeight: "700", color: '#101828', textAlign: 'center', flex: 1 }}>
                    {title}
                </Text>

                {/* Sağ tarafta ev ikonu veya boş yer */}
                {isMyAnalysis ? (
                    <TouchableOpacity onPress={handleHomePress} style={{ width: 40, alignItems: 'flex-end' }}>
                        <Ionicons name="home-outline" size={24} color="#101828" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>
        </SafeAreaView>
    );
};

export default Header;

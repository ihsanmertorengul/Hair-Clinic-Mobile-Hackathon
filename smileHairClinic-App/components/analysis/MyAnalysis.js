import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../service/Firebase'; // <-- kendi firebase yolunu yaz
import { getAuth } from 'firebase/auth';

// Ekran genişliği
const screenWidth = Dimensions.get('window').width;

export default function MyAnalysis() {
    const navigation = useNavigation();
    const [analizler, setAnalizler] = useState([]);
    const [loading, setLoading] = useState(true);

    // Firestore'dan verileri çek
    useEffect(() => {
        const fetchAnalizler = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                    console.log("Kullanıcı giriş yapmamış");
                    setLoading(false);
                    return;
                }

                const q = query(
                    collection(db, "analizler"),
                    where("uid", "==", user.uid),     // 👈 Yalnızca bu kullanıcıya ait analizler
                    orderBy("createdAt", "desc")      // 👈 En yeni en üstte
                );

                const snapshot = await getDocs(q);

                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setAnalizler(list);
            } catch (error) {
                console.log("Analiz verileri alınırken hata:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalizler();
    }, []);


    // Analiz kartı
    const renderAnalizCard = (analiz) => {
        return (
            <TouchableOpacity
                key={analiz.id}
                style={styles.analizCard}
                onPress={() => navigation.navigate('AnalysisDetail', { analizId: analiz.id })}
            >
                <View style={styles.analizCardHeader}>
                    <View style={styles.analizCardHeaderLeft}>
                        <Text style={styles.analizTitle}>{analiz.name}</Text>

                        <Text style={styles.analizDate}>
                            {analiz.createdAt?.toDate
                                ? analiz.createdAt.toDate().toLocaleString("tr-TR")
                                : "Tarih Yok"}
                        </Text>
                    </View>

                    <View style={[styles.statusBadge, styles.statusCompleted]}>
                        <Text style={styles.statusBadgeText}>Gönderildi</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };


    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analizlerim</Text>
                    <Text style={styles.headerSubtitle}>
                        Geçmiş saç analiz raporlarınızı inceleyin.
                    </Text>
                </View>

                <View style={styles.analizGrid}>
                    {loading ? (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardText}>Yükleniyor...</Text>
                        </View>
                    ) : analizler.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Text style={styles.emptyIconText}>📝</Text>
                            </View>
                            <Text style={styles.emptyTitle}>Henüz analiz yok</Text>
                            <Text style={styles.emptySubtitle}>
                                İlk saç analizini tamamladığında burada listelenecek.
                            </Text>
                        </View>
                    ) : (
                        analizler.map(renderAnalizCard)
                    )}
                </View>
            </ScrollView>
        </View>
    );
}


// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 120,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#101828',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#475467',
        marginTop: 4,
    },
    analizGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    analizCard: {
        width: screenWidth > 768 ? (screenWidth - 64) / 2 : '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        shadowColor: '#101828',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    analizCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    analizCardHeaderLeft: {
        flex: 1,
        marginRight: 12,
    },
    analizTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101828',
        marginBottom: 6,
        lineHeight: 24,
    },
    analizDate: {
        fontSize: 14,
        color: '#475467',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusCompleted: {
        backgroundColor: '#E4ECFF',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1D4ED8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCard: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E4E7EC',
    },
    infoCardText: {
        color: '#475467',
        fontWeight: '600',
    },
    emptyState: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E4E7EC',
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E4ECFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyIconText: {
        fontSize: 28,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101828',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#475467',
        textAlign: 'center',
        lineHeight: 20,
    },
});

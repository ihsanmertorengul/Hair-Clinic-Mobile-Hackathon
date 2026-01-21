import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Modal,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../service/Firebase";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnalysisDetail = () => {
    const route = useRoute();
    const { analizId } = route.params;

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log("Gelen Analiz ID:", analizId);

    // 🔥 Firestore’dan veri çek
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const docRef = doc(db, "analizler", analizId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    console.log("Firestore Data:", docSnap.data());
                    setData(docSnap.data());
                } else {
                    console.log("Belge bulunamadı");
                }
            } catch (error) {
                console.error("Firestore veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [analizId]);

    // 🔥 Firestore’dan gelen fotoğrafları hazırlıyoruz
    const photos = data ? [
        { id: 1, label: "Tam Yüz Karşıdan", uri: data.step1 },
        { id: 2, label: "45 Derece Sağa", uri: data.step2 },
        { id: 3, label: "45 Derece Sola", uri: data.step3 },
        { id: 4, label: "Tepe (Vertex)", uri: data.step4 },
        { id: 5, label: "Arka Donör", uri: data.step5 },
    ] : [];

    const getCreationDate = () => {
        if (!data?.createdAt) return "";
        return new Date(data.createdAt.seconds * 1000).toLocaleString("tr-TR");
    };

    const openModal = (photo) => {
        setSelectedImage(photo);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const renderPhotoItem = (photo, index) => {
        const isTablet = screenWidth >= 768;
        const itemStyle = isTablet ? styles.photoItemHalf : styles.photoItemFull;

        return (
            <View
                key={photo.id}
                style={[styles.photoItem, itemStyle]}
            >
                <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>{photo.label}</Text>
                </View>

                <TouchableOpacity
                    style={styles.photoContainer}
                    onPress={() => openModal(photo)}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoImage}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            </View>
        );
    };

    // 🔥 Veri yükleniyorsa basit bir loading ekranı
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingBadge}>
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerLabel}>Analiz</Text>
                    <Text style={styles.headerTitle}>Detaylı İnceleme</Text>
                    <Text style={styles.date}>Oluşturma tarihi: {getCreationDate()}</Text>
                </View>

                <View style={styles.photosGrid}>
                    {photos.map((photo, index) => renderPhotoItem(photo, index))}
                </View>
            </ScrollView>

            {/* Modal - Büyük Görüntü */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={closeModal}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.modalCloseText}>×</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeModal}
                    >
                        <Image
                            source={{ uri: selectedImage?.uri }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E4E7EC',
    },
    loadingText: {
        color: '#475467',
        fontWeight: '600',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: screenWidth <= 768 ? 18 : 24,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#EEF4FF',
        padding: 24,
        borderRadius: 28,
        marginBottom: 28,
    },
    headerLabel: {
        fontSize: 13,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: '#4C68FF',
        fontWeight: '700',
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: screenWidth <= 768 ? 22 : 26,
        fontWeight: '800',
        color: '#101828',
    },
    date: {
        fontSize: 15,
        color: '#475467',
        marginTop: 10,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    photoItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    photoItemHalf: {
        flexBasis: '48%',
        maxWidth: '48%',
    },
    photoItemFull: {
        flexBasis: '100%',
        maxWidth: '100%',
    },
    photoLabel: {
        padding: screenWidth <= 768 ? 12 : 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    photoLabelText: {
        color: '#101828',
        fontSize: screenWidth <= 768 ? 13 : 15,
        fontWeight: '700',
        textAlign: 'left',
    },
    photoContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#E4E7EC',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    modalBackdrop: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: screenWidth * 0.92,
        height: screenHeight * 0.85,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 32,
        right: 24,
        zIndex: 1001,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '700',
        lineHeight: 30,
    },
});

export default AnalysisDetail;

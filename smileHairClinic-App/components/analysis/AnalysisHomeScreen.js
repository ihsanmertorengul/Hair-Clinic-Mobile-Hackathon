import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../../service/Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const steps = [
    { number: 1, title: 'Tam Yüz Karşıdan', area: 'Yüzün ön cephesi', guidance: 'Telefon Yere Paralel (0 derece). Yüz, kameranın ortasında ve tam karşıdan bakıyor olmalı', isCritical: false },
    { number: 2, title: '45 Derece Sağa Bakarken', area: 'Yüzün ön ve sağ yan cephesi', guidance: 'Yüz, tam karşıdan 45 derece sağa çevrilmeli. Telefon açısı sabit tutulabilir', isCritical: false },
    { number: 3, title: '45 Derece Sola Bakarken', area: 'Yüzün ön ve sol yan cephesi', guidance: 'Yüz, tam karşıdan 45 derece sola çevrilmeli. Telefon açısı sabit tutulabilir', isCritical: false },
    { number: 4, title: 'Tepe Kısmı (Vertex)', area: 'Kafa derisinin tepe bölgesi', guidance: 'Kullanıcı, telefonu başının üzerinde, tepe derisini kameranın tam ortasına alacak şekilde konumlandırmalıdır. Telefonun yere eğimi 90 dereceye yakın olmalıdır', isCritical: true },
    { number: 5, title: 'Arka Donör Bölgesi', area: 'Ense üstü ve arka yan kısımlar', guidance: 'Kullanıcı telefonu başının arkasına götürmeli. Uygulama, ense bölgesini net ve doğru bir şekilde kadraja aldığında otomatik çekim yapmalıdır.', isCritical: true },
];

const StepCard = ({ step }) => (
    <View style={styles.stepCard}>
        <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.number}</Text>
        </View>
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepArea}>
                <Text style={styles.stepAreaLabel}>Hedef Bölge: </Text>
                {step.area}
            </Text>
            <Text style={styles.stepGuidance}>
                {step.isCritical && <Text style={styles.criticalText}>Kritik: </Text>}
                {step.guidance}
            </Text>
        </View>
    </View>
);

export default function AnalysisHomeScreen() {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const bars = useRef([...Array(5)].map(() => new Animated.Value(10))).current;
    const navigation = useNavigation();

    const animateBars = () => {
        bars.forEach((bar) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bar, { toValue: Math.random() * 40 + 10, duration: 300 + Math.random() * 200, useNativeDriver: false }),
                    Animated.timing(bar, { toValue: Math.random() * 40 + 10, duration: 300 + Math.random() * 200, useNativeDriver: false }),
                ])
            ).start();
        });
    };

    const stopBars = () => {
        bars.forEach((bar) => bar.stopAnimation());
    };

    const playSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sesler/ses1.mp3'),
                { shouldPlay: true }
            );
            setSound(sound);
            setIsPlaying(true);
            animateBars();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setIsPlaying(false);
                    stopBars();
                }
            });
        } catch (error) {
            console.log('Ses çalma hatası:', error);
        }
    };

    const handleReplay = async () => {
        if (sound) {
            await sound.replayAsync();
            setIsPlaying(true);
            animateBars();
        } else {
            playSound();
        }
    };

    useEffect(() => {
        playSound();
        return () => {
            if (sound) sound.unloadAsync();
        };
    }, []);

    // handleStartCapture fonksiyonunu güncelle
    const handleStartCapture = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.log('Kullanıcı oturum açmamış!');
                return;
            }

            const docRef = await addDoc(collection(db, 'analizler'), {
                uid: user.uid,
                name: 'Analiz',
                status: 'beklemede',
                step1: 'beklemede',
                step2: 'beklemede',
                step3: 'beklemede',
                step4: 'beklemede',
                step5: 'beklemede',
                createdAt: serverTimestamp(),
            });

            navigation.navigate('Step1', { analysisId: docRef.id });

            navigation.navigate('Step1', { analysisId: docRef.id });
        } catch (error) {
            console.log('Firestore kaydı hatası:', error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Saç Analizi</Text>
                    <Text style={styles.heroTitle}>5 açıyla doğru çekimi tamamlayın</Text>
                    <Text style={styles.heroSubtitle}>
                        Her adım için yönlendirmeyi okuyup kamerayı uygun açıya getirin.
                    </Text>
                </View>

                <View style={styles.introCard}>
                    <Text style={styles.introSubtitle}>
                        Uygulama aşağıdaki 5 açıyı adım adım isteyecek. Başlamadan önce ortam ışığını ve kamera temizliğini kontrol edin.
                    </Text>

                    <View style={styles.audioContainer}>
                        {bars.map((bar, i) => (
                            <View key={i} style={styles.barContainer}>
                                <Animated.View style={[styles.bar, { height: bar }]} />
                            </View>
                        ))}
                        <TouchableOpacity onPress={handleReplay} style={styles.replayButton}>
                            <Ionicons name="repeat-outline" size={22} color="#0F62FE" />
                            <Text style={styles.replayText}>Sesli anlatımı dinle</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.stepsGrid}>
                    {steps.map((step) => (
                        <StepCard key={step.number} step={step} />
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartCapture}
                    activeOpacity={0.9}
                >
                    <Text style={styles.startButtonText}>Fotoğraf Çekimine Başla</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%', height: '100%', backgroundColor: '#FFFFFF' },
    scrollContent: { padding: 24, paddingBottom: 160 },
    heroCard: {
        backgroundColor: '#EEF4FF',
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
    },
    heroLabel: {
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#4C68FF',
        fontWeight: '700',
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#101828',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#475467',
        lineHeight: 20,
    },
    introCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E4E7EC',
        marginBottom: 20,
    },
    introSubtitle: {
        fontSize: 14,
        color: '#475467',
        lineHeight: 20,
        textAlign: 'left',
        marginBottom: 16,
    },
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barContainer: {
        width: 10,
        height: 54,
        justifyContent: 'flex-end',
        marginHorizontal: 3,
        backgroundColor: '#E4ECFF',
        borderRadius: 6,
    },
    bar: {
        width: '100%',
        backgroundColor: '#0F62FE',
        borderRadius: 6,
    },
    replayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        backgroundColor: '#EEF4FF',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    replayText: {
        color: '#0F62FE',
        fontWeight: '600',
        fontSize: 13,
    },
    stepsGrid: {
        gap: 12,
        marginBottom: 24,
    },
    stepCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E4ECFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: { color: '#0F62FE', fontWeight: '700', fontSize: 16 },
    stepContent: { flex: 1, gap: 4 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 2 },
    stepArea: { fontSize: 13, color: '#475467', lineHeight: 18 },
    stepAreaLabel: { color: '#0F62FE', fontWeight: '600' },
    stepGuidance: { fontSize: 13, color: '#667085', lineHeight: 18, marginTop: 2 },
    criticalText: { color: '#D92D20', fontWeight: '700' },
    startButton: {
        backgroundColor: '#0F62FE',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#0F62FE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 4,
        marginBottom: 16,
    },
    startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

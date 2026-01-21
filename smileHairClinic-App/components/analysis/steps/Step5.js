import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import { Audio } from 'expo-av';

import { CameraView, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";
import { AI_BASE_URL } from "../../../service/Config"
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../service/Firebase';
import { getAuth } from "firebase/auth";

export default function Step5({ route }) {
    const { analysisId } = route.params;
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);

    const [lastPhoto, setLastPhoto] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const [pitch, setPitch] = useState(0);
    const [roll, setRoll] = useState(0);

    const [autoShot, setAutoShot] = useState(false);

    const BACKEND_URL = "http://192.168.1.108:5001/back_analyze";

    const [soundFinished, setSoundFinished] = useState(false);

    const auth = getAuth();
    const uid = auth.currentUser.uid;

    const updateAnalysisStep5 = async (photoUrl) => {
        try {
            if (!analysisId) {
                console.error('analysisId undefined! Firestore güncellemesi yapılamıyor.');
                return;
            }
            const docRef = doc(db, 'analizler', analysisId);
            await updateDoc(docRef, {
                step5: photoUrl,
                status: 'çekildi',
                updatedAt: serverTimestamp(),
            });
            console.log('Firestore güncellendi: step4 ->', photoUrl);
        } catch (error) {
            console.error('Analiz güncelleme hatası:', error);
        }
    };

    const uploadToCloudinary = async (uri) => {
        try {
            if (!analysisId) {
                console.error('analysisId undefined!');
                return;
            }

            // Firestore UID almak için, örnek: auth.currentUser.uid

            const data = new FormData();
            data.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'image5.jpg', // ismi sabit veya değişken yapabilirsiniz
            });
            data.append('upload_preset', 'CityFlow');
            data.append('folder', `${uid}/${analysisId}`); // klasör hiyerarşisi

            const response = await fetch(`https://api.cloudinary.com/v1_1/dv5seg71e/upload`, {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            console.log('Cloudinary Link:', result.secure_url);
            return result.secure_url;

        } catch (err) {
            console.error('Cloudinary yükleme hatası:', err);
        }
    };

    useEffect(() => {
        const playSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('../../../assets/sesler/step5/giris.mp3')
            );

            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setSoundFinished(true);   // ✔ Giriş sesi bitti
                    sound.unloadAsync();
                }
            });
        };

        playSound();
    }, []);



    // Kamera izni
    useEffect(() => {
        if (!permission) return;
        if (!permission.granted) requestPermission();
    }, [permission]);

    const [analysisOk, setAnalysisOk] = useState(false);

    // Pitch & Roll hesaplama (Accelerometer)
    useEffect(() => {
        Accelerometer.setUpdateInterval(150);

        const sub = Accelerometer.addListener(({ x, y, z }) => {

            if (!soundFinished) return;   // ✔ giriş müziği bitene kadar otomatik çekim kapalı

            let pitchRad = Math.atan2(-x, Math.sqrt(y * y + z * z));
            let rollRad = Math.atan2(y, z);

            let pitchDeg = pitchRad * (180 / Math.PI);
            let rollDeg = rollRad * (180 / Math.PI);

            const roundedPitch = Math.round(pitchDeg);
            const roundedRoll = Math.round(rollDeg);

            setPitch(roundedPitch);
            setRoll(roundedRoll);

            if (
                roundedPitch >= -5 &&
                roundedPitch <= 5 &&
                roundedRoll >= -25 &&
                roundedRoll <= 25 &&
                !autoShot &&
                !analysisOk
            ) {
                setAutoShot(true);

                takePhotoAndSend().finally(() => {
                    setTimeout(() => setAutoShot(false), 2000);
                });
            }
        });

        return () => sub.remove();
    }, [autoShot, soundFinished]);


    const playSuccessSound = async () => {
        const { sound } = await Audio.Sound.createAsync(
            require('../../../assets/sesler/step5/true.mp3')
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    };

    const playFailedSound = async () => {
        const { sound } = await Audio.Sound.createAsync(
            require('../../../assets/sesler/step5/false.mp3')
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    };

    const playAnalysisSound = async () => {
        const { sound } = await Audio.Sound.createAsync(
            require('../../../assets/sesler/step5/analiz.mp3')
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    };


    // Fotoğraf çek
    const takePhotoAndSend = async () => {
        if (!cameraRef) return;

        setLoading(true);
        setResult(null);

        const photo = await cameraRef.takePictureAsync({
            base64: false,
            skipProcessing: true,
        });

        setLastPhoto(photo.uri);

        playAnalysisSound();

        const form = new FormData();
        form.append("image", {
            uri: photo.uri,
            type: "image/jpeg",
            name: "neck.jpg",
        });

        try {
            const res = await fetch(`${AI_BASE_URL}/check-neck`, {
                method: "POST",
                body: form,
            });

            const json = await res.json();
            console.log("Neck Result:", json);

            // ❗ senin API cevap formatın:
            // {
            //   "is_neck_visible": true/false,
            //   "answer": "Evet/Hayır"
            // }

            const ok = json.is_neck_visible === true;

            setAnalysisOk(ok);
            setResult(json);

            if (ok) {
                playSuccessSound();

                if (photo.uri) {
                    const cloudinaryLink = await uploadToCloudinary(photo.uri);
                    await updateAnalysisStep5(cloudinaryLink);
                }
            } else {
                playFailedSound();
            }

        } catch (e) {
            console.log("Hata:", e);
        }

        setLoading(false);
    };


    if (!permission || !permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permissionText}>Kamera izni gerekiyor...</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const steps = [1, 2, 3, 4, 5];

    const renderStepBar = () => {
        const activeIndex = 4;
        return (
            <View style={styles.stepBar}>
                {steps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    return (
                        <View key={step} style={styles.stepBarItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    isCompleted && styles.stepCircleDone,
                                    isActive && styles.stepCircleActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepText,
                                        (isCompleted || isActive) && styles.stepTextActive,
                                    ]}
                                >
                                    {step}
                                </Text>
                            </View>
                            {index < steps.length - 1 && (
                                <View
                                    style={[
                                        styles.stepLine,
                                        isCompleted ? styles.stepLineDone : styles.stepLineDefault,
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderResultCard = () => {
        if (!result) return null;
        return (
            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Analiz Özeti</Text>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Pitch</Text>
                    <Text style={styles.resultValue}>{result.pitch}° ({String(result.pitch_ok)})</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Roll</Text>
                    <Text style={styles.resultValue}>{result.roll}° ({String(result.roll_ok)})</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Kafa Oranı</Text>
                    <Text style={styles.resultValue}>{(result.head_ratio ?? 0).toFixed(2)}</Text>
                </View>
                <Text style={[
                    styles.resultStatus,
                    result.is_neck_visible ? styles.statusSuccess : styles.statusError
                ]}>
                    {result.is_neck_visible ? 'Donör bölgesi hazır' : 'Kritik açı yakalanamadı'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {renderStepBar()}

                <View style={styles.infoCard}>
                    <Text style={styles.infoBadge}>Adım 5 / 5</Text>
                    <Text style={styles.infoTitle}>Arka Donör Bölgesi</Text>
                    <Text style={styles.infoSubtitle}>
                        Telefonu ense bölgesine doğrultun. Cihazı sabit tutup ışığı engellemeyin.
                    </Text>
                    <View style={styles.metricsRow}>
                        <View style={styles.metricChip}>
                            <Text style={styles.metricLabel}>Pitch</Text>
                            <Text style={styles.metricValue}>{pitch}°</Text>
                        </View>
                        <View style={styles.metricChip}>
                            <Text style={styles.metricLabel}>Roll</Text>
                            <Text style={styles.metricValue}>{roll}°</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cameraShell}>
                    <View
                        style={[
                            styles.cameraWrapper,
                            { borderColor: result?.is_neck_visible ? '#12B76A' : '#E4E7EC' },
                        ]}
                    >
                        <CameraView
                            style={styles.camera}
                            facing="front"
                            ref={setCameraRef}
                        />

                        {lastPhoto && (
                            <View style={styles.previewBadge}>
                                <Image source={{ uri: lastPhoto }} style={styles.previewImage} />
                                <Text style={styles.previewText}>Son çekim</Text>
                            </View>
                        )}
                    </View>
                </View>

                {renderResultCard()}

                {analysisOk && (
                    <TouchableOpacity
                        style={styles.nextStepButton}
                        onPress={() => navigation.navigate('StepAnalysisDetail', { analizId: analysisId })}
                    >
                        <Text style={styles.nextStepButtonText}>Fotoğraf Çekimini Bitir</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    permissionText: {
        color: '#475467',
        marginBottom: 12,
        fontSize: 16,
    },
    permissionButton: {
        backgroundColor: '#0F62FE',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    stepBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stepBarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#D0D5DD',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        borderColor: '#0F62FE',
        backgroundColor: '#EEF4FF',
    },
    stepCircleDone: {
        borderColor: '#0F62FE',
        backgroundColor: '#0F62FE',
    },
    stepText: {
        color: '#98A2B3',
        fontWeight: '600',
    },
    stepTextActive: {
        color: '#0F62FE',
    },
    stepLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 6,
        borderRadius: 1,
    },
    stepLineDefault: {
        backgroundColor: '#E4E7EC',
    },
    stepLineDone: {
        backgroundColor: '#0F62FE',
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        marginBottom: 16,
    },
    infoBadge: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#667085',
        marginBottom: 6,
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#101828',
        marginBottom: 4,
    },
    infoSubtitle: {
        fontSize: 14,
        color: '#475467',
        lineHeight: 20,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
    },
    metricChip: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E4E7EC',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    metricLabel: {
        fontSize: 12,
        color: '#98A2B3',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#101828',
    },
    cameraShell: {
        flex: 1,
        marginTop: 4,
        marginBottom: 16,
    },
    cameraWrapper: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#E4E7EC',
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    camera: {
        flex: 1,
    },
    previewBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(15, 98, 254, 0.12)',
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginBottom: 4,
    },
    previewText: {
        color: '#0F62FE',
        fontSize: 12,
        fontWeight: '600',
    },
    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        padding: 18,
        marginBottom: 16,
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#101828',
        marginBottom: 10,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resultLabel: {
        color: '#475467',
    },
    resultValue: {
        fontWeight: '600',
        color: '#101828',
    },
    resultStatus: {
        marginTop: 8,
        fontWeight: '700',
        textAlign: 'center',
    },
    statusSuccess: {
        color: '#027A48',
    },
    statusError: {
        color: '#B42318',
    },
    nextStepButton: {
        backgroundColor: '#0F62FE',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F62FE',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 4,
    },
    nextStepButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Image, Button, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Asset } from 'expo-asset';
import * as ImageManipulator from "expo-image-manipulator";
import { Audio } from 'expo-av';
import { AI_BASE_URL } from "../../../service/Config"
import { doc, updateDoc, serverTimestamp, docRef } from 'firebase/firestore';
import { db } from '../../../service/Firebase';
import { getAuth } from "firebase/auth";

export default function Step1({ navigation, route }) {
    const { analysisId } = route.params;
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [result, setResult] = useState(null);
    const prevResultRef = useRef(null);
    const auth = getAuth();
    const uid = auth.currentUser.uid;

    const updateAnalysisStep1 = async (photoUrl) => {
        try {
            if (!analysisId) {
                console.error('analysisId undefined! Firestore güncellemesi yapılamıyor.');
                return;
            }
            const docRef = doc(db, 'analizler', analysisId);
            await updateDoc(docRef, {
                step1: photoUrl,
                status: 'çekildi',
                updatedAt: serverTimestamp(),
            });
            console.log('Firestore güncellendi: step1 ->', photoUrl);
        } catch (error) {
            console.error('Analiz güncelleme hatası:', error);
        }
    };

    useEffect(() => {
        const playSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('../../../assets/sesler/step1-2-3/giris.mp3')
            );
            await sound.playAsync();
            // Eğer istersen ses biteceğinde otomatik temizlensin:
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        };

        playSound();
    }, []);

    useEffect(() => {
        const playSound3 = async () => {
            if (result === true) {
                const { sound } = await Audio.Sound.createAsync(
                    require('../../../assets/sesler/step1-2-3/true.mp3')
                );
                await sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) {
                        sound.unloadAsync();
                    }
                });
                // Fotoğrafı Cloudinary'e yükle
                if (photoUri) {
                    const cloudinaryLink = await uploadToCloudinary(photoUri);
                    console.log('Cloudinary Link:', cloudinaryLink);

                    // Firestore'a kaydet
                    await updateAnalysisStep1(cloudinaryLink);
                }
            }
        };
        playSound3();
    }, [result]);

    useEffect(() => {
        if (result === false) {
            const playSound = async () => {
                const { sound } = await Audio.Sound.createAsync(
                    require('../../../assets/sesler/step1-2-3/false.mp3')
                );
                await sound.playAsync();
            };
            playSound();
        }
    }, [result]);


    useEffect(() => {
        let timeout;

        const captureLoop = async () => {
            // Eğer sonuç true ise artık fotoğraf çekme
            if (result === true) {
                console.log("True sonucu geldi! Döngü durduruldu.");
                return;
            }

            const serverResult = await takePhoto();

            // Eğer sonuç false ise 3 saniye sonra tekrar çek
            if (serverResult === false) {
                timeout = setTimeout(captureLoop, 3000);
            }
        };

        if (permission?.granted && cameraRef.current) {
            // İlk fotoğrafı 3 saniye sonra çek
            timeout = setTimeout(captureLoop, 3000);
        }

        return () => clearTimeout(timeout);
    }, [permission]);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    if (!permission) return <View />;
    if (!permission.granted) return <Text>Kamera izni verilmedi</Text>;

    const takePhoto = async () => {
        if (!cameraRef.current) return;

        try {
            let photo = await cameraRef.current.takePictureAsync({ mirror: false });

            const manipulatedPhoto = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ flip: ImageManipulator.FlipType.Horizontal }],
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPhotoUri(manipulatedPhoto.uri);
            console.log('Manipüle edilmiş Fotoğraf URI:', manipulatedPhoto.uri);

            // Server'a gönder ve sonucu bekle
            const serverResult = await sendToServer(manipulatedPhoto.uri);

            return serverResult;
        } catch (err) {
            console.error("Fotoğraf çekme hatası:", err);
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
                name: 'image1.jpg', // ismi sabit veya değişken yapabilirsiniz
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

    const sendToServer = async (photoUri) => {
        try {
            if (!photoUri) return false;

            // Overlay olarak model fotoğrafı kullanıyoruz
            const overlayAsset = Asset.fromModule(require('../../../assets/sonmodel/on.png'));
            await overlayAsset.downloadAsync();
            const overlayUri = overlayAsset.localUri;

            const formData = new FormData();
            formData.append('user', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'user.jpg',
            });
            formData.append('model', {
                uri: overlayUri,
                type: 'image/png',
                name: 'model.png',
            });

            const response = await fetch(`${AI_BASE_URL}/compare`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            console.log('Server response:', data);

            // data.match true/false döner
            setResult(null);
            setTimeout(() => setResult(data.match), 10);

            return data.match;

        } catch (err) {
            console.error(err);
            return false;
        }
    };


    // Step bar için
    const steps = [1, 2, 3, 4, 5];

    const renderStepBar = () => {
        const activeIndex = 0;
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {renderStepBar()}

                <View style={styles.infoCard}>
                    <Text style={styles.infoBadge}>Adım 1 / 5</Text>
                    <Text style={styles.infoTitle}>Tam Yüz Karşıdan</Text>
                    <Text style={styles.infoSubtitle}>
                        Telefonu göz hizasında tutup doğrudan objektife bakın. Yüzünüz kadrajın ortasında
                        olmalı.
                    </Text>
                </View>

                <View style={styles.cameraShell}>
                    <View
                        style={[
                            styles.cameraWrapper,
                            { borderColor: result === null ? '#D0D5DD' : result ? '#12B76A' : '#F97066' },
                        ]}
                    >
                        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
                        <View pointerEvents="none" style={styles.overlayContainer}>
                            <Image
                                source={require('../../../assets/sonmodel/on.png')}
                                style={styles.overlayImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>

                {result !== null && (
                    <View style={[styles.resultBadge, result ? styles.resultSuccess : styles.resultError]}>
                        <Text style={styles.resultBadgeText}>
                            {result ? 'Kadraj doğrulandı' : 'Tekrar deneyin'}
                        </Text>
                    </View>
                )}

                {result === true && (
                    <TouchableOpacity
                        style={styles.nextStepButton}
                        onPress={() => navigation.navigate('Step2', { analysisId })}
                    >
                        <Text style={styles.nextStepButtonText}>Sonraki Adıma Geç</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

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
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayImage: {
        width: '90%',
        height: '90%',
        opacity: 0.35,
    },
    resultBadge: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        alignSelf: 'center',
        marginBottom: 16,
    },
    resultSuccess: {
        backgroundColor: '#D1FADF',
    },
    resultError: {
        backgroundColor: '#FEE4E2',
    },
    resultBadgeText: {
        color: '#101828',
        fontWeight: '600',
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

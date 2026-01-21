# Porselen Team
# Smile Hair Clinic - Saç Analizi Projesi

Bu proje, saç analizi için geliştirilmiş bir mobil uygulama ve backend API sistemidir. Kullanıcılar, farklı açılardan çektikleri fotoğraflar ile saç analizi yapabilir ve sonuçları görüntüleyebilir.

## 📋 İçindekiler

- [Proje Yapısı](#proje-yapısı)
- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
  - [Backend Kurulumu](#backend-kurulumu)
  - [Frontend Kurulumu](#frontend-kurulumu)
- [Kullanım](#kullanım)
- [API Endpoints](#api-endpoints)
- [Proje Yapısı Detayları](#proje-yapısı-detayları)
- [Gereksinimler](#gereksinimler)
- [Notlar](#notlar)

## 📁 Proje Yapısı

```
safdsgs/
├── hair-test/              # Backend API (Flask)
│   ├── app.py             # Ana Flask uygulaması
│   ├── main.py            # Alternatif Flask uygulaması
│   ├── requirements.txt   # Python bağımlılıkları
│   ├── uploads/           # Yüklenen görseller
│   └── utils/             # Yardımcı modüller
│       ├── blur.py        # Bulanıklık tespiti
│       └── brightness.py  # Parlaklık analizi
│
└── smileHairClinic-App/   # Mobil Uygulama (React Native/Expo)
    ├── App.js             # Ana uygulama dosyası
    ├── components/        # React bileşenleri
    │   ├── analysis/      # Analiz ekranları
    │   ├── home/          # Ana sayfa
    │   ├── login/         # Giriş/Kayıt
    │   ├── navigation/    # Navigasyon bileşenleri
    │   └── profile/       # Profil ekranları
    └── service/           # Servis dosyaları
        ├── Config.js      # API yapılandırması
        └── Firebase.js    # Firebase yapılandırması
```

## ✨ Özellikler

### Backend (Flask API)
- **Görüntü Analizi**: MediaPipe ile yüz tespiti ve poz analizi
- **Saç Analizi**: Farklı açılardan (ön, arka, tepe) saç analizi
- **AI Entegrasyonu**: Google Gemini AI ile görüntü doğrulama
- **Kalite Kontrolü**: Parlaklık, bulanıklık ve poz kontrolü
- **Karşılaştırma**: Model ve kullanıcı fotoğraflarını karşılaştırma

### Frontend (React Native)
- **Kullanıcı Yönetimi**: Firebase Authentication ile giriş/kayıt
- **Adım Adım Analiz**: 5 adımlı saç analizi süreci
- **Fotoğraf Çekme**: Expo Camera ile fotoğraf çekme
- **Analiz Sonuçları**: Detaylı analiz sonuçlarını görüntüleme
- **Profil Yönetimi**: Kullanıcı profil bilgileri

## 🛠 Teknolojiler

### Backend
- **Python 3.9+**
- **Flask**: Web framework
- **OpenCV**: Görüntü işleme
- **MediaPipe**: Yüz tespiti ve poz analizi
- **Google Gemini AI**: Görüntü analizi
- **NumPy**: Matematiksel işlemler
- **PIL (Pillow)**: Görüntü manipülasyonu

### Frontend
- **React Native**: Mobil uygulama framework
- **Expo**: React Native geliştirme platformu
- **React Navigation**: Navigasyon yönetimi
- **Firebase**: Authentication ve Firestore
- **Expo Camera**: Kamera erişimi
- **Expo AV**: Ses dosyaları

## 🚀 Kurulum

### Backend Kurulumu

1. **Python Sanal Ortamı Oluşturma**
   ```bash
   cd hair-test
   python -m venv venv
   ```

2. **Sanal Ortamı Aktifleştirme**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

3. **Bağımlılıkları Yükleme**
   ```bash
   pip install -r requirements.txt
   ```

4. **Google Gemini API Anahtarı**
   - `app.py` dosyasındaki `GOOGLE_API_KEY` değişkenini kendi API anahtarınızla değiştirin
   - API anahtarı almak için: [Google AI Studio](https://makersuite.google.com/app/apikey)

5. **Uygulamayı Çalıştırma**
   ```bash
   python app.py
   ```
   API varsayılan olarak `http://0.0.0.0:5001` adresinde çalışacaktır.

### Frontend Kurulumu

1. **Node.js ve npm Kurulumu**
   - Node.js 16+ ve npm'in yüklü olduğundan emin olun

2. **Bağımlılıkları Yükleme**
   ```bash
   cd smileHairClinic-App
   npm install
   ```

3. **API Yapılandırması**
   - `service/Config.js` dosyasındaki `AI_BASE_URL` değerini backend API adresinizle değiştirin
   - Örnek: `export const AI_BASE_URL = 'http://192.168.1.108:5001';`

4. **Firebase Yapılandırması**
   - `service/Firebase.js` dosyasındaki Firebase yapılandırmasını kendi projenizle değiştirin

5. **Uygulamayı Çalıştırma**
   ```bash
   npm start
   ```
   - Expo Go uygulamasını telefonunuza indirin
   - QR kodu tarayarak uygulamayı çalıştırın
   - Veya `npm run android` / `npm run ios` ile emülatörde çalıştırın

## 📱 Kullanım

### Mobil Uygulama

1. **Kayıt/Giriş**: Uygulamayı açın ve Firebase ile giriş yapın
2. **Ana Sayfa**: Uygulamanın ana ekranını görüntüleyin
3. **Saç Analizi**: "Saç Analizi" sekmesine gidin
4. **Adımları Takip Edin**:
   - **Step 1**: Ön yüz fotoğrafı çekin
   - **Step 2**: Sağ profil fotoğrafı çekin
   - **Step 3**: Sol profil fotoğrafı çekin
   - **Step 4**: Tepe (vertex) fotoğrafı çekin
   - **Step 5**: Arka (ense) fotoğrafı çekin
5. **Sonuçları Görüntüle**: Analiz tamamlandıktan sonra sonuçları görüntüleyin

### API Kullanımı

#### 1. Ön Yüz Analizi
```bash
POST http://localhost:5001/analyze
Content-Type: multipart/form-data

photo: [image file]
pitch: [float]
roll: [float]
```

#### 2. Arka Yüz Analizi
```bash
POST http://localhost:5001/back_analyze
Content-Type: multipart/form-data

photo: [image file]
pitch: [float]
roll: [float]
```

#### 3. Fotoğraf Karşılaştırma
```bash
POST http://localhost:5001/compare
Content-Type: multipart/form-data

model: [image file]
user: [image file]
```

#### 4. Ense Kontrolü
```bash
POST http://localhost:5001/check-neck
Content-Type: multipart/form-data

image: [image file]
```

#### 5. Tepe (Vertex) Kontrolü
```bash
POST http://localhost:5001/analyze
Content-Type: multipart/form-data

file: [image file]
```

## 🔌 API Endpoints

### `/analyze` (POST)
Ön yüz fotoğrafı analizi yapar. Aşağıdaki kontrolleri gerçekleştirir:
- Pitch ve roll açıları (-20° ile +20° arası)
- Parlaklık kontrolü (60-200 arası)
- Bulanıklık skoru (minimum 60)
- Baş oranı (minimum %35)

**Yanıt:**
```json
{
  "pitch": 5.2,
  "roll": -3.1,
  "pitch_ok": true,
  "roll_ok": true,
  "brightness": 120.5,
  "brightness_ok": true,
  "blur_score": 85.3,
  "blur_ok": true,
  "head_ratio": 0.42,
  "head_ok": true,
  "vertex_ok": true
}
```

### `/back_analyze` (POST)
Arka yüz (ense) fotoğrafı analizi yapar.

**Yanıt:**
```json
{
  "pitch": 2.1,
  "roll": 15.5,
  "pitch_ok": true,
  "roll_ok": true,
  "head_ratio": 0.28,
  "head_ok": true,
  "face_ratio": 0.01,
  "face_ok": true,
  "correct": true
}
```

### `/compare` (POST)
Model ve kullanıcı fotoğraflarının yaw açılarını karşılaştırır.

**Yanıt:**
```json
{
  "yaw_model": 5.2,
  "yaw_user": 8.7,
  "difference": 3.5,
  "match": true
}
```

### `/check-neck` (POST)
Google Gemini AI kullanarak görselde ensenin görünüp görünmediğini kontrol eder.

**Yanıt:**
```json
{
  "is_neck_visible": true,
  "answer": "Evet"
}
```

### `/health` (GET)
API sağlık kontrolü.

**Yanıt:**
```json
{
  "status": "OK"
}
```

## 📂 Proje Yapısı Detayları

### Backend (`hair-test/`)

- **`app.py`**: Ana Flask uygulaması, tüm endpoint'leri içerir
- **`main.py`**: Alternatif Flask uygulaması (ense kontrolü için)
- **`utils/blur.py`**: Sobel gradyanları kullanarak bulanıklık tespiti
- **`utils/brightness.py`**: Görüntü parlaklık analizi
- **`uploads/`**: Yüklenen görsellerin saklandığı klasör

### Frontend (`smileHairClinic-App/`)

- **`App.js`**: Ana uygulama dosyası, navigasyon yapısını içerir
- **`components/analysis/`**: Analiz ekranları ve adımları
  - `Step1.js` - Step5.js: Analiz adımları
  - `AnalysisHomeScreen.js`: Analiz ana ekranı
  - `MyAnalysis.js`: Kullanıcının analizlerini listeler
  - `AnalysisDetail.js`: Analiz detayları
- **`components/login/`**: Giriş ve kayıt ekranları
- **`components/home/`**: Ana sayfa
- **`components/profile/`**: Profil ekranı
- **`service/Config.js`**: API URL yapılandırması
- **`service/Firebase.js`**: Firebase yapılandırması

## 📋 Gereksinimler

### Backend
- Python 3.9 veya üzeri
- pip (Python paket yöneticisi)
- Google Gemini API anahtarı

### Frontend
- Node.js 16+ ve npm
- Expo CLI (global olarak yüklenebilir: `npm install -g expo-cli`)
- iOS için: Xcode (Mac gerekli)
- Android için: Android Studio

## ⚠️ Notlar

1. **API Anahtarları**: 
   - `app.py` ve `main.py` dosyalarında Google Gemini API anahtarı bulunmaktadır. Üretim ortamında bu anahtarları environment variable olarak saklayın.

2. **Firebase Yapılandırması**: 
   - `Firebase.js` dosyasındaki Firebase yapılandırmasını kendi projenizle değiştirmeyi unutmayın.

3. **Network Yapılandırması**: 
   - Mobil uygulama ve backend API'nin aynı ağda olduğundan emin olun
   - `Config.js` dosyasındaki IP adresini backend'inizin çalıştığı IP ile güncelleyin

4. **Port Ayarları**: 
   - Backend varsayılan olarak 5001 portunda çalışır
   - Port değiştirmek için `app.py` dosyasındaki `app.run()` satırını düzenleyin

5. **Görsel Formatları**: 
   - API sadece PNG, JPG ve JPEG formatlarını kabul eder

6. **Sanal Ortam**: 
   - Backend için Python sanal ortamı kullanılması önerilir

---

**Not**: Bu README dosyası projenin genel yapısını ve kullanımını açıklamaktadır. Detaylı teknik bilgiler için kaynak kodları inceleyebilirsiniz.


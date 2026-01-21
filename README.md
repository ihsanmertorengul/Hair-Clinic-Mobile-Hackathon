# Porselen Team
# Smile Hair Clinic - Saç Analizi Projesi

Bu proje, saç analizi için geliştirilmiş bir mobil uygulama ve backend API sistemidir. Kullanıcılar, farklı açılardan çektikleri fotoğraflar ile saç analizi yapabilir ve sonuçları görüntüleyebilir.

## 📋 İçindekiler

- [Proje Yapısı](#proje-yapisi)
- [Özellikler](#ozellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
  - [Backend Kurulumu](#backend-kurulumu)
  - [Frontend Kurulumu](#frontend-kurulumu)
- [Kullanım](#kullanim)
- [API Endpoints](#api-endpoints)
- [Proje Yapısı Detayları](#proje-yapisi-detaylari)
- [Gereksinimler](#gereksinimler)
- [Notlar](#notlar)

---

## 📁 Proje Yapısı

## 📁 Proje Yapısı

```text
hackathonproject/
├── hair-test/                     # Backend API (Flask)
│   ├── app.py                     # Ana Flask uygulaması
│   ├── main.py                    # Alternatif Flask uygulaması
│   ├── requirements.txt           # Python bağımlılıkları
│   ├── uploads/                   # Yüklenen görseller
│   └── utils/                     # Yardımcı modüller
│       ├── blur.py                # Bulanıklık tespiti
│       └── brightness.py          # Parlaklık analizi
│
└── smileHairClinic-App/           # Mobil Uygulama (React Native/Expo)
    ├── App.js                     # Ana uygulama dosyası
    ├── components/                # React bileşenleri
    │   ├── analysis/              # Analiz ekranları
    │   ├── home/                  # Ana sayfa
    │   ├── login/                 # Giriş / Kayıt
    │   ├── navigation/            # Navigasyon bileşenleri
    │   └── profile/               # Profil ekranları
    │
    └── service/                   # Servis dosyaları
        ├── Config.js              # API yapılandırması
        └── Firebase.js            # Firebase yapılandırması


---

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

---

## 🛠 Teknolojiler

### Backend
- Python 3.9+  
- Flask  
- OpenCV  
- MediaPipe  
- Google Gemini AI  
- NumPy  
- Pillow  

### Frontend
- React Native  
- Expo  
- React Navigation  
- Firebase  
- Expo Camera  
- Expo AV  

---

## 🚀 Kurulum

### Backend Kurulumu

```bash
cd hair-test
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py

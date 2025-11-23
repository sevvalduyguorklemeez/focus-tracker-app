# Odaklanma Takibi ve Raporlama Uygulaması

React Native (Expo) ile geliştirilmiş odaklanma takibi ve raporlama uygulaması. Pomodoro tekniği kullanarak odaklanma seanslarını takip eder, dikkat dağınıklığını ölçer ve detaylı istatistikler sunar.

## 📱 Özellikler

### Ana Sayfa (Zamanlayıcı)
- **25 dakikalık geri sayım sayacı** (Pomodoro tekniği)
- **Kategori seçimi**: Ders Çalışma, Kodlama, Proje, Kitap Okuma
- **Kontrol butonları**: Başlat, Duraklat, Devam Et, Bitir, Sıfırla
- **Dikkat dağınıklığı takibi**: AppState API ile uygulamadan çıkış tespiti
- **Seans özeti**: Seans bitiminde detaylı özet gösterimi

### Raporlar Ekranı
- **Genel İstatistikler**:
  - Bugün toplam odaklanma süresi
  - Tüm zamanların toplam odaklanma süresi
  - Toplam dikkat dağınıklığı sayısı
- **Görselleştirmeler**:
  - Son 7 güne ait odaklanma sürelerini gösteren çubuk grafik (Bar Chart)
  - Kategorilere göre dağılımı gösteren pasta grafik (Pie Chart)
  - Kategori detayları listesi

### Teknik Özellikler
- **AppState API**: Uygulamadan çıkış/geri dönüş tespiti
- **AsyncStorage**: Verilerin kalıcı olarak saklanması
- **Tab Navigator**: Alt menü ile ekranlar arası geçiş
- **TypeScript**: Tip güvenliği

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android emülatör için) veya Xcode (iOS simülatör için)

### Adımlar

1. **Projeyi klonlayın**
   ```bash
   git clone https://github.com/sevvalduyguorklemeez/focus-tracker-app.git
   cd focus-tracker-app
   ```

2. **Bağımlılıkları kurun**
   ```bash
   npm install
   ```

3. **Uygulamayı başlatın**
   ```bash
   npm start
   ```

4. **Cihazda çalıştırma**
   - **Android Emülatör**: Terminal'de `a` tuşuna basın
   - **iOS Simülatör**: Terminal'de `i` tuşuna basın
   - **Fiziksel Cihaz**: Expo Go uygulamasını indirip QR kodu tarayın
   - **Web**: Terminal'de `w` tuşuna basın

## 📦 Kullanılan Teknolojiler

- **React Native**: Mobil uygulama geliştirme framework'ü
- **Expo**: React Native geliştirme platformu
- **TypeScript**: Tip güvenliği için
- **React Navigation**: Navigasyon yönetimi
- **AsyncStorage**: Yerel veri depolama
- **react-native-chart-kit**: Grafik görselleştirme
- **@react-native-picker/picker**: Kategori seçimi için

## 📁 Proje Yapısı

```
focus-tracker-app/
├── screens/
│   ├── HomeScreen.tsx      # Ana sayfa - Zamanlayıcı
│   └── ReportsScreen.tsx   # Raporlar ekranı
├── utils/
│   ├── storage.ts          # AsyncStorage işlemleri
│   └── stats.ts            # İstatistik hesaplamaları
├── types/
│   └── index.ts            # TypeScript tip tanımları
├── App.tsx                 # Ana uygulama dosyası
├── app.json                # Expo yapılandırması
└── package.json            # Bağımlılıklar
```

## 🎯 Kullanım

1. **Seans Başlatma**:
   - Ana sayfada bir kategori seçin
   - "Başlat" butonuna tıklayın
   - 25 dakikalık geri sayım başlar

2. **Dikkat Dağınıklığı Takibi**:
   - Uygulamadan çıkarsanız (ana ekrana dönme, başka uygulama açma) otomatik olarak tespit edilir
   - Sayacı duraklatır ve dikkat dağınıklığı sayısını artırır
   - Uygulamaya geri döndüğünüzde devam etmek isteyip istemediğiniz sorulur

3. **Raporları Görüntüleme**:
   - Alt menüden "Raporlar" sekmesine geçin
   - İstatistikleri ve grafikleri görüntüleyin
   - Aşağı çekerek verileri yenileyin

## 📊 Veri Yapısı

Her seans şu bilgileri içerir:
- Başlangıç ve bitiş zamanı
- Süre (dakika)
- Kategori
- Dikkat dağınıklığı sayısı
- Tamamlanma durumu
- Tarih

## 🔄 Geliştirme

Proje geliştirme aşamasındadır. Özellikler zamanla eklenecektir.

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 👤 Geliştirici

Şevval Duygu Örklemez

---

**Not**: Bu uygulama BSM 447 - Mobil Uygulama Geliştirme dersi için geliştirilmiştir.


# JavaScript Modüler Yapısı

Bu proje ES6 modül sistemi kullanarak modüler bir yapıya sahiptir.

## Klasör Yapısı

```
js/
├── modules/
│   ├── config.js          # Sabitler ve konfigürasyon
│   ├── utils.js           # Yardımcı fonksiyonlar
│   ├── storageManager.js  # LocalStorage işlemleri
│   ├── player.js          # Video player yönetimi
│   ├── ui.js              # UI yönetimi ve DOM işlemleri
│   ├── keyboard.js        # Klavye kontrolleri
│   ├── touch.js           # Dokunmatik kontroller
│   └── search.js          # Arama fonksiyonları
├── main.js                # Ana uygulama dosyası
└── README.md              # Bu dosya
```

## Modül Açıklamaları

### config.js
- Uygulama sabitleri
- Storage anahtarları
- Desteklenen dosya formatları
- Versiyon bilgisi

### utils.js
- Dosya uzantısı kontrolü
- URL validasyonu
- MIME type belirleme
- Cookie temizleme

### storageManager.js
- LocalStorage okuma/yazma
- Playlist verilerini kaydetme
- Son seçili kanalı kaydetme
- Cache temizleme

### player.js
- Video.js player başlatma
- Kanal oynatma
- Ses kontrolü
- Fullscreen yönetimi

### ui.js
- DOM element referansları
- Mouse cursor yönetimi
- Modal yönetimi
- Bildirim gösterme

### keyboard.js
- Klavye kısayolları
- Navigasyon kontrolleri
- Fullscreen kontrolleri

### touch.js
- Dokunmatik hareketler
- Swipe gesture'ları
- Volume drag kontrolü
- Çift dokunma algılama

### search.js
- Kanal arama
- Optimized arama (büyük listeler için)
- Grup başlığı görünürlük yönetimi

### main.js
- Ana uygulama başlatma
- Modülleri import etme
- Global değişken yönetimi
- Event listener'ları kurma

## Kullanım

Modüler yapı ES6 import/export sistemi kullanır. HTML'de şu şekilde yüklenir:

```html
<script type="module" src="js/main.js"></script>
```

## Avantajları

1. **Kod Organizasyonu**: Her modül belirli bir sorumluluğa sahip
2. **Yeniden Kullanılabilirlik**: Modüller bağımsız olarak kullanılabilir
3. **Bakım Kolaylığı**: Değişiklikler ilgili modülde yapılır
4. **Test Edilebilirlik**: Her modül ayrı ayrı test edilebilir
5. **Performans**: Sadece gerekli modüller yüklenir

## Geliştirme

Yeni özellik eklerken:
1. İlgili modülü belirleyin
2. Gerekirse yeni modül oluşturun
3. main.js'de import edin
4. Export/import ilişkilerini güncelleyin

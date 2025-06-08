# CSS Modüler Yapı Dokümantasyonu

Bu proje modüler CSS mimarisi kullanmaktadır. Tüm stiller kategorilere ayrılmış ve organize edilmiştir.

## 📁 Klasör Yapısı

```
css/
├── base/                 # Temel stiller
│   ├── variables.css     # CSS custom properties (değişkenler)
│   ├── reset.css         # CSS reset ve normalize
│   ├── typography.css    # Font ve metin stilleri
│   └── layout.css        # Ana layout yapısı
│
├── components/           # Bileşen stilleri
│   ├── video-player.css  # Video oynatıcı stilleri
│   ├── playlist.css      # Playlist panel stilleri
│   ├── modal.css         # Modal dialog stilleri
│   ├── buttons.css       # Buton stilleri
│   ├── forms.css         # Form elemanları
│   └── indicators.css    # Bildirim ve göstergeler
│
├── utilities/            # Yardımcı stiller
│   ├── animations.css    # Animasyonlar ve geçiş efektleri
│   ├── responsive.css    # Responsive tasarım kuralları
│   └── helpers.css       # Yardımcı sınıflar
│
├── themes/               # Tema dosyaları
│   └── dark.css          # Karanlık tema (varsayılan)
│
└── README.md            # Bu dosya
```

## 🎯 Modüler Yapının Avantajları

### 1. **Bakım Kolaylığı**
- Her bileşen kendi dosyasında
- Değişiklikler ilgili dosyada yapılır
- Kod tekrarı azalır

### 2. **Performans**
- İhtiyaç duyulan modüller seçici olarak yüklenebilir
- CSS dosyaları daha küçük ve yönetilebilir
- Browser cache'i daha etkili kullanılır

### 3. **Takım Çalışması**
- Farklı geliştiriciler farklı dosyalarda çalışabilir
- Merge conflict'leri azalır
- Kod review süreci kolaylaşır

### 4. **Yeniden Kullanılabilirlik**
- Bileşenler bağımsız olarak kullanılabilir
- Başka projelere kolayca taşınabilir
- Tutarlı tasarım sistemi

## 📋 Dosya Açıklamaları

### Base (Temel) Dosyalar

#### `variables.css`
- CSS custom properties tanımları
- Renk paleti, boyutlar, geçiş süreleri
- Z-index değerleri
- Tüm projede kullanılan sabitler

#### `reset.css`
- CSS reset ve normalize kuralları
- Box model ayarları
- Focus stilleri
- Video.js özel düzenlemeleri

#### `typography.css`
- Font tanımları ve metin stilleri
- Başlık stilleri (h1-h6)
- Metin yardımcı sınıfları
- Monospace font ayarları

#### `layout.css`
- Ana sayfa düzeni
- Flexbox yardımcı sınıfları
- Spacing (margin/padding) sınıfları
- Position ve overflow yardımcıları

### Components (Bileşen) Dosyalar

#### `video-player.css`
- Video.js oynatıcı stilleri
- Fullscreen modları
- Kontrol elemanları
- Progress bar ve volume slider

#### `playlist.css`
- Playlist panel tasarımı
- Liste elemanları
- Toggle handle
- Scroll to top butonu
- Arama ve filtre bileşenleri

#### `modal.css`
- Modal dialog stilleri
- Keyboard shortcuts grid
- Modal animasyonları
- Overlay efektleri

#### `buttons.css`
- Tüm buton varyasyonları
- Hover ve focus durumları
- Loading state
- Icon butonlar
- Floating action button

#### `forms.css`
- Input, textarea, select stilleri
- Form grupları ve validasyon
- File upload stilleri
- Checkbox ve radio butonlar

#### `indicators.css`
- Volume indicator
- Loading spinner
- Progress bar
- Badge ve alert bileşenleri
- Tooltip ve status göstergeleri

### Utilities (Yardımcı) Dosyalar

#### `animations.css`
- Keyframe animasyonları
- Hover efektleri
- Geçiş animasyonları
- Performance optimizasyonları

#### `responsive.css`
- Breakpoint tanımları
- Mobile ve tablet stilleri
- Orientation-based kurallar
- Responsive utility sınıfları

#### `helpers.css`
- Drag & drop stilleri
- Visibility ve opacity sınıfları
- Border ve shadow yardımcıları
- Text ve background utilities

### Themes (Tema) Dosyalar

#### `dark.css`
- Karanlık tema özelleştirmeleri
- Scrollbar stilleri
- Selection renkleri
- Form autofill düzenlemeleri

## 🔧 Kullanım

### Ana CSS Dosyası
`main.css` dosyası tüm modülleri import eder:

```css
@import url('./css/base/variables.css');
@import url('./css/base/reset.css');
/* ... diğer import'lar */
```

### HTML'de Kullanım
```html
<link rel="stylesheet" href="main.css?v=2.0.0">
```

### Yeni Bileşen Ekleme
1. İlgili klasörde yeni CSS dosyası oluşturun
2. `main.css` dosyasına import ekleyin
3. Bileşen stillerini yazın

### Tema Değiştirme
1. `css/themes/` klasöründe yeni tema dosyası oluşturun
2. `main.css` dosyasında tema import'unu değiştirin
3. CSS custom properties'i override edin

## 🎨 CSS Custom Properties

Projede kullanılan ana değişkenler:

```css
:root {
  /* Renkler */
  --bg-primary: #1e1e1e;
  --text-primary: #f4f4f4;
  --accent-blue: #4a9eff;
  
  /* Boyutlar */
  --border-radius: 6px;
  --playlist-width: 300px;
  
  /* Geçişler */
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

## 📱 Responsive Tasarım

Projede mobile-first yaklaşım kullanılmıştır:

- **xs**: < 576px (Küçük telefonlar)
- **sm**: 576px+ (Büyük telefonlar)
- **md**: 768px+ (Tabletler)
- **lg**: 992px+ (Küçük masaüstü)
- **xl**: 1200px+ (Büyük masaüstü)

## 🚀 Performans İpuçları

1. **CSS Import Sırası**: Değişkenler önce, bileşenler sonra
2. **Unused CSS**: Kullanılmayan modülleri kaldırın
3. **Critical CSS**: Önemli stilleri inline olarak ekleyin
4. **Minification**: Production'da CSS'i minify edin

## 🔄 Güncelleme Rehberi

### Yeni Özellik Ekleme
1. İlgili bileşen dosyasını güncelleyin
2. Gerekirse yeni utility sınıfları ekleyin
3. Responsive kuralları kontrol edin

### Tema Güncelleme
1. `variables.css` dosyasında değişkenleri güncelleyin
2. Tema dosyalarını kontrol edin
3. Tüm bileşenlerde test edin

Bu modüler yapı sayesinde CSS kodunuz daha organize, bakımı kolay ve ölçeklenebilir olacaktır.

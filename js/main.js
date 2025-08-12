// Main - Ana uygulama dosyası
import { DEFAULT_M3U_URL } from './modules/config.js';
import { initializePlayer } from './modules/player.js';
import { loadPlaylistsFromStorage } from './modules/storageManager.js';
import { elements, updateToggleHandleVisibility, hideCursor, showCursor } from './modules/ui.js';
import { initializeKeyboardControls } from './modules/keyboard.js';
import { initializeTouchControls } from './modules/touch.js';
import { initializeSearch } from './modules/search.js';
import { initializeEventListeners } from './modules/events.js';
import {
    setPlaylistData,
    getPlaylistData,
    updatePlaylistSelector,
    switchToPlaylist,
    loadDefaultPlaylist,
    updatePlaylistActionButtons,
    initializeFastScroll
} from './modules/playlist.js';

// Global değişkenler
let playlists = [];
let activePlaylistIndex = -1;
let playlistCounter = 0;
let allChannelItems = [];
let currentSelectedChannelIndex = -1;

// Player'ı başlat
const player = initializePlayer();

// Kontrolleri başlat
initializeKeyboardControls();
initializeSearch();
initializeEventListeners();
initializeFastScroll();

// Touch kontrollerini player hazır olduktan sonra başlat
setTimeout(() => {
    initializeTouchControls();
}, 100);

// Uygulama başlatma
window.addEventListener('load', () => {
    elements.body.classList.add('no-transition');
    elements.body.classList.add('playlist-visible');
    // Başlangıçta cursor'u göster
    showCursor();

    const selectedChannel = elements.playlistElement.querySelector('li.selected');
    if (selectedChannel) {
        selectedChannel.focus();
    }

    setTimeout(() => {
        elements.body.classList.remove('no-transition');
    }, 100);

    // Storage'dan verileri yükle
    const storageData = loadPlaylistsFromStorage();
    if (storageData.hasData) {
        playlists = storageData.playlists;
        activePlaylistIndex = storageData.activePlaylistIndex;
        playlistCounter = storageData.playlistCounter;

        // Playlist modülüne verileri aktar
        setPlaylistData(playlists, activePlaylistIndex, playlistCounter);

        updatePlaylistSelector();

        if (activePlaylistIndex >= 0 && activePlaylistIndex < playlists.length) {
            switchToPlaylist(activePlaylistIndex);
        }

        console.log('localStorage\'den playlist verileri yüklendi.');

        // Aktif playlist 'Varsayılan' ise sayfa yenilendiğinde otomatik tazele
        const isDefaultActive = activePlaylistIndex >= 0 &&
            playlists[activePlaylistIndex] &&
            playlists[activePlaylistIndex].name === 'Varsayılan';

        if (isDefaultActive && DEFAULT_M3U_URL) {
            loadDefaultPlaylist(DEFAULT_M3U_URL, true);
        }
    } else if (DEFAULT_M3U_URL) {
        // İlk kurulumda varsayılan playlist'i yükle
        loadDefaultPlaylist(DEFAULT_M3U_URL, true);
    }

    updatePlaylistActionButtons();
});

// Toggle handle görünürlük ayarları
updateToggleHandleVisibility();
window.addEventListener('resize', updateToggleHandleVisibility);

// Mouse hareket dinleyicisi
window.addEventListener('mousemove', (event) => {
    // Mouse hareket ettiğinde cursor'u göster
    showCursor();

    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (window.innerWidth > 768 && !isMobilePortrait) {
        const mouseX = event.clientX;
        const toggleHandleRect = elements.playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = mouseX <= 75;
        const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                             event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

        if (!elements.body.classList.contains('playlist-visible')) {
            if (isNearLeftEdge || isOverHandle) {
                elements.playlistToggleHandle.style.opacity = '1';
                elements.playlistToggleHandle.style.pointerEvents = 'auto';
            } else {
                 elements.playlistToggleHandle.style.opacity = '0';
                 elements.playlistToggleHandle.style.pointerEvents = 'none';
            }
        } else {
            elements.playlistToggleHandle.style.opacity = '1';
            elements.playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
});

// Placeholder fonksiyonlar (diğer modüllerden import edilecek)

// Info modal setup
const infoModal = elements.infoModal;
const infoContent = infoModal.querySelector('.modal-content');
infoContent.innerHTML = `
    <div class="modal-header">
        <h3>Klavye/Kumanda Tuşları</h3>
        <span class="close close-info">&times;</span>
    </div>
    <div class="modal-body info-modal-body">
        <div class="keyboard-shortcuts-grid">
            <div class="shortcuts-section">
                <h4>Genel Kontroller</h4>
                <div class="shortcut-item">
                    <span class="key">F</span>
                    <span class="description">Tam ekran aç/kapat</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">Space</span>
                    <span class="description">Oynat/Duraklat</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">M</span>
                    <span class="description">Ses aç/kapat</span>
                </div>
            </div>
            <div class="shortcuts-section">
                <h4>Kanal Kontrolü</h4>
                <div class="shortcut-item">
                    <span class="key">↑↓</span>
                    <span class="description">Kanal seçimi</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">Enter</span>
                    <span class="description">Kanalı oynat</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">←</span>
                    <span class="description">Playlist aç/kapat</span>
                </div>
            </div>
            <div class="shortcuts-section">
                <h4>Ses Kontrolü</h4>
                <div class="shortcut-item">
                    <span class="key">Ctrl + ↑</span>
                    <span class="description">Sesi artır</span>
                </div>
                <div class="shortcut-item">
                    <span class="key">Ctrl + ↓</span>
                    <span class="description">Sesi azalt</span>
                </div>
            </div>
            <div class="shortcuts-section">
                <h4>Dokunmatik Kontroller</h4>
                <div class="shortcut-item">
                    <span class="description">• Çift Dokunma: Oynat/Duraklat</span>
                </div>
                <div class="shortcut-item">
                    <span class="description">• Sağa/Sola Kaydır: Kanal değiştir (sadece tam ekranda)</span>
                </div>
                <div class="shortcut-item">
                    <span class="description">• Dikey Kaydır: Ses seviyesi</span>
                </div>
            </div>
            <div class="shortcuts-section">
                <h4>Ek Özellikler</h4>
                <div class="shortcut-item">
                    <span class="description">• Shift + Tıklama: Kanal URL kopyala</span>
                </div>
                <div class="shortcut-item">
                    <span class="description">• Sürükle & Bırak: M3U/Video yükle</span>
                </div>
            </div>
            <div class="shortcuts-section">
                <h5>Önemli</h5>
                <div class="shortcut-item">
                    <span class="description">TV'de tarayıcıda mouse imleci aktifse kumanda tuşları çalışmaz. Farklı bir tarayıcı kullanmak veya imleci ayarlardan kapatmak faydalı olabilir.</span>
                </div>
            </div>
        </div>
    </div>
`;

const closeInfoModal = infoModal.querySelector('.close-info');
closeInfoModal.addEventListener('click', () => {
    infoModal.style.display = 'none';
    hideCursor();
});

// Export global değişkenler (diğer modüller için)
export { playlists, activePlaylistIndex, playlistCounter, allChannelItems, currentSelectedChannelIndex };

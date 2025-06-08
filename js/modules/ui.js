// UI - Kullanıcı arayüzü yönetimi
import { MOUSE_HIDE_DELAY } from './config.js';

// DOM elementleri
export const elements = {
    body: document.body,
    playlistElement: document.querySelector('#playlist ul'),
    playlistContainer: document.getElementById('playlist'),
    playlistToggleHandle: document.getElementById('playlist-toggle-handle'),
    searchInput: document.getElementById('playlist-search'),
    uploadButton: document.getElementById('upload-button'),
    uploadModal: document.getElementById('upload-modal'),
    closeModal: document.querySelector('.close'),
    playlistNameInput: document.getElementById('playlist-name'),
    fileUpload: document.getElementById('file-upload'),
    urlInput: document.getElementById('url-input'),
    loadUrlButton: document.getElementById('load-url'),
    textInput: document.getElementById('text-input'),
    loadTextButton: document.getElementById('load-text'),
    playlistSelector: document.getElementById('playlist-selector'),
    renamePlaylistBtn: document.getElementById('rename-playlist-btn'),
    deletePlaylistBtn: document.getElementById('delete-playlist-btn'),
    infoButton: document.getElementById('info-button'),
    renameModal: document.getElementById('rename-modal'),
    closeRenameModal: document.querySelector('.close-rename'),
    newPlaylistNameInput: document.getElementById('new-playlist-name'),
    saveRenameBtn: document.getElementById('save-rename-btn'),
    cancelRenameBtn: document.getElementById('cancel-rename-btn'),
    infoModal: document.getElementById('info-modal')
};

// Mouse cursor yönetimi
let mouseTimer;

export function showCursor() {
    elements.body.classList.remove('hide-cursor');
    clearTimeout(mouseTimer);

    mouseTimer = setTimeout(() => {
        elements.body.classList.add('hide-cursor');
    }, MOUSE_HIDE_DELAY);
}

export function hideCursor() {
    elements.body.classList.add('hide-cursor');
    clearTimeout(mouseTimer);
}

// Optimize edilmiş showIndicator fonksiyonu
function showIndicator(text, type = 'volume', isDragging = false) {
    let indicator = document.querySelector('.volume-indicator');

    // Eğer gösterge zaten varsa ve aynı tip ise, sadece içeriği güncelle
    if (indicator) {
        clearTimeout(indicator.hideTimeout);

        // Eğer tip değişiyorsa, mevcut göstergeyi kaldır
        if ((indicator.classList.contains('channel-indicator') && type !== 'channel') ||
            (!indicator.classList.contains('channel-indicator') && type === 'channel')) {
            indicator.remove();
            indicator = null;
        }
    }

    // Yeni gösterge oluştur
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'volume-indicator';
        if (type === 'channel') {
            indicator.classList.add('channel-indicator');
        }

        // Player'ı import etmek yerine global kontrol
        const player = window.videojs && window.videojs.getPlayers()[0];
        if (player && player.isFullscreen()) {
            player.el().appendChild(indicator);
        } else {
            document.body.appendChild(indicator);
        }
    }

    indicator.textContent = text;

    if (isDragging) {
        indicator.style.animation = 'none';
        indicator.style.opacity = '1';
    } else {
        // Sürükleme bittiyse veya normal bildirimse animasyonla göster
        indicator.style.animation = 'none';
        indicator.style.opacity = '1';

        // Yeni zamanlayıcı oluştur
        const hideTimeout = setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
            }
        }, type === 'channel' ? 2500 : 2000); // Kanal bildirimi için biraz daha uzun süre

        // Zamanlayıcıyı gösterge elementi ile ilişkilendir
        indicator.hideTimeout = hideTimeout;
    }
}

// Volume göstergesi için wrapper fonksiyon
export function showVolumeIndicator(volume, isDragging = false) {
    const volumeIcon = volume === 0 ? '🔈' : volume < 30 ? '🔉' : volume < 70 ? '🔊' : '🔊';
    showIndicator(`${volumeIcon} Ses: ${Math.round(volume)}%`, 'volume', isDragging);
}

// Version güncelleme bildirimi
export function showVersionUpdateNotification(version) {
    try {
        const notification = document.createElement('div');
        notification.className = 'version-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🚀</div>
                <div class="notification-text">
                    <strong>Uygulama Güncellendi!</strong>
                    <br>Versiyon ${version} yüklendi
                    <br><small>Cookie'ler temizlendi ve kanal listesi yenilendi</small>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4a9eff, #357abd);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 100001;
            max-width: 350px;
            font-family: sans-serif;
            animation: slideInRight 0.5s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
        `;

        const icon = notification.querySelector('.notification-icon');
        icon.style.cssText = `
            font-size: 24px;
            flex-shrink: 0;
        `;

        const text = notification.querySelector('.notification-text');
        text.style.cssText = `
            flex: 1;
            line-height: 1.4;
        `;

        if (!document.querySelector('#version-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'version-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);

    } catch (error) {
        console.error('Version notification gösterme hatası:', error);
    }
}

// Toggle handle görünürlük yönetimi
export function updateToggleHandleVisibility() {
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (isMobilePortrait) {
        elements.playlistToggleHandle.style.opacity = '0';
        elements.playlistToggleHandle.style.pointerEvents = 'none';
    } else if (window.innerWidth <= 768) {
        elements.playlistToggleHandle.style.opacity = '1';
        elements.playlistToggleHandle.style.pointerEvents = 'auto';
    } else {
        if (!elements.body.classList.contains('playlist-visible')) {
           elements.playlistToggleHandle.style.opacity = '0';
           elements.playlistToggleHandle.style.pointerEvents = 'none';
        } else {
           elements.playlistToggleHandle.style.opacity = '1';
           elements.playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
}

// Modal yönetimi
export function showModal(modalElement) {
    modalElement.style.display = 'block';
    showCursor();
}

export function hideModal(modalElement) {
    modalElement.style.display = 'none';
    hideCursor();
}

export function clearModalInputs() {
    elements.playlistNameInput.value = '';
    elements.urlInput.value = '';
    elements.textInput.value = '';
    elements.fileUpload.value = '';
}

// Playlist action butonları güncelleme
export function updatePlaylistActionButtons(playlists, activePlaylistIndex) {
    const hasSelectedPlaylist = playlists.length > 0 && activePlaylistIndex >= 0;
    elements.renamePlaylistBtn.disabled = !hasSelectedPlaylist;
    elements.deletePlaylistBtn.disabled = !hasSelectedPlaylist;
}

// Kanal göstergesi için wrapper fonksiyon
export function showChannelIndicator(channelName, direction = null) {
    let directionIcon = '';
    if (direction === 'next') {
        directionIcon = '▼ ';
    } else if (direction === 'prev') {
        directionIcon = '▲ ';
    } else {
        directionIcon = '📺 ';
    }
    showIndicator(`${directionIcon}${channelName}`, 'channel', false);
}

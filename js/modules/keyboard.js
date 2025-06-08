// Keyboard - Klavye kontrolleri
import { adjustVolume, togglePlayPause, toggleFullscreen, toggleMute, getPlayer } from './player.js';
import { elements, updateToggleHandleVisibility, hideCursor } from './ui.js';
import { getPlaylistData } from './playlist.js';
import { saveLastSelectedChannel } from './storageManager.js';

let focusArea = 'playlist';
let isFullscreen = false;
let lastNavigationTime = 0;
const NAVIGATION_DELAY = 50;

// Hızlı gezinme için değişkenler
let keyHoldTimeout = null;
let isKeyHeld = false;
let currentHeldKey = null;
const KEY_HOLD_DELAY = 100;
const FAST_NAVIGATION_INTERVAL = 25;

// Fullscreen durumu takibi
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
});

export function initializeKeyboardControls() {
    // Klavye kullanımında cursor'u gizle
    document.addEventListener('keydown', hideCursor);

    document.addEventListener('keydown', function(event) {
        // Düzenleme modunda klavye kısayollarını devre dışı bırak
        if (document.body.classList.contains('editing-mode')) {
            return;
        }

        // Hızlı gezinme için tuş basılı tutma kontrolü
        handleKeyHold(event);

        // Mobil dikey durumda sağ-sol tuşlarını devre dışı bırak
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

        if (!document.fullscreenElement && !isMobilePortrait) {
            switch(event.key) {
                case 'ArrowLeft':
                    // Playlist görünürlüğünü değiştir
                    elements.body.classList.toggle('playlist-visible');
                    updateToggleHandleVisibility();
                    break;

                case 'ArrowRight':
                    if (focusArea === 'playlist') {
                        focusArea = 'player';
                        hidePlaylist();
                        const player = getPlayer();
                        if (player) player.focus();
                    }
                    break;
            }
        }

        switch(event.key) {
            case 'f':
            case 'F':
                toggleFullscreen();
                break;

            case 'ArrowUp':
            case 'ArrowDown':
                // Hızlı gezinme handleKeyHold fonksiyonunda hallediliyor
                // Burada sadece event'i işaretliyoruz
                event.preventDefault();
                break;

            case 'Enter':
                const selectedChannel = elements.playlistElement.querySelector('li.selected');
                if (selectedChannel) {
                    selectedChannel.click();
                }
                break;

            case ' ':
                event.preventDefault();
                togglePlayPause();
                break;

            case 'm':
            case 'M':
                toggleMute();
                break;
        }
    });

    // Keyup event - tuş bırakıldığında hızlı gezinmeyi durdur
    document.addEventListener('keyup', function(event) {
        stopKeyHold(event);
    });
}

// Hızlı gezinme fonksiyonları
function handleKeyHold(event) {
    const key = event.key;

    // Sadece navigasyon tuşları için hızlı gezinme
    if (!['ArrowUp', 'ArrowDown'].includes(key)) {
        return;
    }

    // Aynı tuş zaten basılıysa işlem yapma
    if (currentHeldKey === key) {
        return;
    }

    // Önceki tuş basımını temizle
    stopKeyHold();

    currentHeldKey = key;

    // İlk basımda normal işlemi yap
    handleSingleKeyPress(event);

    // Belirli süre sonra hızlı gezinmeyi başlat
    keyHoldTimeout = setTimeout(() => {
        startFastNavigation(key);
    }, KEY_HOLD_DELAY);
}

function stopKeyHold(event) {
    if (event && event.key !== currentHeldKey) {
        return;
    }

    // Timeout'ları temizle
    if (keyHoldTimeout) {
        clearTimeout(keyHoldTimeout);
        keyHoldTimeout = null;
    }

    // Hızlı gezinmeyi durdur
    if (isKeyHeld) {
        isKeyHeld = false;
    }

    currentHeldKey = null;
}

function startFastNavigation(key) {
    isKeyHeld = true;

    const fastNavigate = () => {
        if (!isKeyHeld || currentHeldKey !== key) {
            return;
        }

        // Hızlı gezinme işlemini yap
        const direction = key === 'ArrowUp' ? 'up' : 'down';

        if (isFullscreen) {
            navigateAndPlayChannel(direction);
        } else {
            navigateChannelList(direction);
        }

        // Bir sonraki iterasyon için zamanlayıcı kur
        setTimeout(fastNavigate, FAST_NAVIGATION_INTERVAL);
    };

    // İlk hızlı gezinmeyi başlat
    fastNavigate();
}

function handleSingleKeyPress(event) {
    const direction = event.key === 'ArrowUp' ? 'up' : 'down';

    if (event.ctrlKey) {
        event.preventDefault();
        adjustVolume(direction);
    } else if (isFullscreen) {
        navigateAndPlayChannel(direction);
    } else {
        navigateChannelList(direction);
    }
}

function hidePlaylist() {
    elements.body.classList.remove('playlist-visible');
    updateToggleHandleVisibility();
}

function findNextPlayableChannel(currentIndex, channels, direction) {
    let newIndex = currentIndex;
    let attempts = 0;
    const maxAttempts = channels.length;

    do {
        if (direction === 'up') {
            newIndex = newIndex <= 0 ? channels.length - 1 : newIndex - 1;
        } else {
            newIndex = newIndex >= channels.length - 1 ? 0 : newIndex + 1;
        }

        attempts++;

        // Sonsuz döngüyü önlemek için
        if (attempts >= maxAttempts) {
            return currentIndex;
        }

    } while (channels[newIndex] &&
             (channels[newIndex].classList.contains('category-header') ||
              channels[newIndex].classList.contains('group-header')));

    return newIndex;
}

function navigateChannelList(direction) {
    const currentTime = Date.now();
    if (currentTime - lastNavigationTime < NAVIGATION_DELAY) {
        return;
    }
    lastNavigationTime = currentTime;

    const allItems = Array.from(elements.playlistElement.querySelectorAll('li'));
    const currentIndex = allItems.findIndex(item => item.classList.contains('selected'));

    if (currentIndex === -1) {
        const firstPlayable = allItems.findIndex(item => !item.classList.contains('category-header'));
        if (firstPlayable !== -1) {
            allItems[firstPlayable].classList.add('selected');
            requestAnimationFrame(() => {
                allItems[firstPlayable].scrollIntoView({ behavior: 'auto', block: 'nearest' });
            });
        }
        return;
    }

    const newIndex = findNextPlayableChannel(currentIndex, allItems, direction);

    allItems.forEach(item => item.classList.remove('selected'));
    allItems[newIndex].classList.add('selected');
    requestAnimationFrame(() => {
        allItems[newIndex].scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
}

function navigateAndPlayChannel(direction) {
    const allItems = Array.from(elements.playlistElement.querySelectorAll('li'));
    const currentIndex = allItems.findIndex(item => item.classList.contains('selected'));

    if (currentIndex === -1) return;

    const newIndex = findNextPlayableChannel(currentIndex, allItems, direction);

    // Eğer yeni index mevcut index ile aynıysa (sınırlarda) işlem yapma
    if (newIndex === currentIndex) return;

    // Hemen seçimi değiştir ve kanalı oynat
    allItems.forEach(item => item.classList.remove('selected'));
    allItems[newIndex].classList.add('selected');
    allItems[newIndex].click();
}

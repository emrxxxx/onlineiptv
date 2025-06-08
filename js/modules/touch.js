// Touch - Dokunmatik kontroller
import {
    TAP_THRESHOLD,
    DOUBLE_TAP_THRESHOLD,
    VOLUME_DRAG_THRESHOLD,
    SWIPE_THRESHOLD
} from './config.js';
import { togglePlayPause, getPlayer } from './player.js';
import { showVolumeIndicator, showChannelIndicator, elements } from './ui.js';

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
let lastTapTime = 0;

let initialVolume = 0;
let isVolumeDragging = false;

export function initializeTouchControls() {
    const player = getPlayer();
    if (!player) return;

    const videoPlayerElement = player.el();

    // Window touch events for playlist toggle
    window.addEventListener('touchstart', (event) => {
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

        if (window.innerWidth > 768 && !isMobilePortrait && event.touches.length > 0) {
            const touchX = event.touches[0].clientX;
            const toggleHandleRect = elements.playlistToggleHandle.getBoundingClientRect();

            const isNearLeftEdge = touchX <= 75;
            const isOverHandle = touchX >= toggleHandleRect.left && touchX <= toggleHandleRect.right &&
                                 event.touches[0].clientY >= toggleHandleRect.top &&
                                 event.touches[0].clientY <= toggleHandleRect.bottom;

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

    // Video player touch events
    videoPlayerElement.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            touchStartX = event.changedTouches[0].clientX;
            touchStartY = event.changedTouches[0].clientY;
            touchStartTime = new Date().getTime();
            initialVolume = player.volume();
            isVolumeDragging = false;
            event.preventDefault();
        }
    });

    videoPlayerElement.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            const currentTouchY = event.touches[0].clientY;
            const deltaY = currentTouchY - touchStartY;
            const deltaX = event.changedTouches[0].clientX - touchStartX;

            if (!isVolumeDragging && Math.abs(deltaY) > VOLUME_DRAG_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
                 isVolumeDragging = true;
            }

            if (isVolumeDragging) {
                event.preventDefault();

                const playerHeight = videoPlayerElement.clientHeight;
                const volumeChange = -deltaY / playerHeight;

                let newVolume = initialVolume + volumeChange;
                newVolume = Math.max(0, Math.min(1, newVolume));
                player.volume(newVolume);

                // Ses seviyesini dinamik göster
                showVolumeIndicator(Math.round(newVolume * 100), true);
            }
        }
    });

    videoPlayerElement.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (isVolumeDragging) {
            console.log('Ses ayarlama tamamlandı.');
            isVolumeDragging = false;

            // Son ses seviyesini normal bildirim olarak göster
            const finalVolume = Math.round(player.volume() * 100);
            showVolumeIndicator(finalVolume, false);
        } else {
            if (moveDistance < TAP_THRESHOLD) {
                const currentTime = new Date().getTime();
                const timeSinceLastTap = currentTime - lastTapTime;

                if (timeSinceLastTap <= DOUBLE_TAP_THRESHOLD) {
                    console.log('Çift dokunma algılandı');
                    togglePlayPause();
                    lastTapTime = 0;
                } else {
                    lastTapTime = currentTime;
                    console.log('Tek dokunma algılandı, çift dokunma için bekleniyor');
                }
            }

            // Sadece tam ekranda kanal değiştirme
            handleSwipeGesture();
        }
    });
}

function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Sadece tam ekranda kanal değiştirme
    const player = getPlayer();
    if (!player || !player.isFullscreen()) return;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
            console.log('Sağa Kaydırma (Tam Ekran) - Önceki Kanal');
            navigateAndPlayChannel('up');
        } else {
            console.log('Sola Kaydırma (Tam Ekran) - Sonraki Kanal');
            navigateAndPlayChannel('down');
        }
    }
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

    // Kanal adını al ve bildirimi göster
    const channelNameElement = allItems[newIndex].querySelector('.channel-name');
    const channelName = channelNameElement ? channelNameElement.textContent : 'Bilinmeyen Kanal';

    const directionText = direction === 'up' ? 'prev' : 'next';
    showChannelIndicator(channelName, directionText);
}

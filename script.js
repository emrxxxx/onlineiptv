const player = videojs('my-video');

const defaultM3uUrl = 'https://raw.githubusercontent.com/Sakubaba00/saku/refs/heads/main/playlist1.m3u';



const playlistElement = document.querySelector('#playlist ul');
const playlistContainer = document.getElementById('playlist');
const body = document.body;

const playlistToggleHandle = document.getElementById('playlist-toggle-handle');

const searchInput = document.getElementById('playlist-search');
const uploadButton = document.getElementById('upload-button');
const uploadModal = document.getElementById('upload-modal');
const closeModal = document.querySelector('.close');
const playlistNameInput = document.getElementById('playlist-name');
const fileUpload = document.getElementById('file-upload');
const urlInput = document.getElementById('url-input');
const loadUrlButton = document.getElementById('load-url');
const playlistSelector = document.getElementById('playlist-selector');

// Playlist action buttons
const renamePlaylistBtn = document.getElementById('rename-playlist-btn');
const deletePlaylistBtn = document.getElementById('delete-playlist-btn');

// Rename modal elements
const renameModal = document.getElementById('rename-modal');
const closeRenameModal = document.querySelector('.close-rename');
const newPlaylistNameInput = document.getElementById('new-playlist-name');
const saveRenameBtn = document.getElementById('save-rename-btn');
const cancelRenameBtn = document.getElementById('cancel-rename-btn');

let allChannelItems = [];

// Birden fazla playlist yönetimi
let playlists = [];
let activePlaylistIndex = -1;
let playlistCounter = 0;

// localStorage anahtarları
const STORAGE_KEYS = {
    PLAYLISTS: 'onlinetv_playlists',
    ACTIVE_PLAYLIST_INDEX: 'onlinetv_active_playlist_index',
    PLAYLIST_COUNTER: 'onlinetv_playlist_counter',
    PLAYLIST_VISIBLE: 'onlinetv_playlist_visible',
    VOLUME: 'onlinetv_volume',
    LAST_PLAYED_URL: 'onlinetv_last_played_url',
    LAST_SELECTED_CHANNEL: 'onlinetv_last_selected_channel',
    USER_PREFERENCES: 'onlinetv_user_preferences'
};

// localStorage yardımcı fonksiyonları
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('localStorage kaydetme hatası:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('localStorage yükleme hatası:', error);
        return defaultValue;
    }
}

// Tüm verileri localStorage'e kaydet
function saveAllDataToLocalStorage() {
    saveToLocalStorage(STORAGE_KEYS.PLAYLISTS, playlists);
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST_INDEX, activePlaylistIndex);
    saveToLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, playlistCounter);
    saveToLocalStorage(STORAGE_KEYS.PLAYLIST_VISIBLE, body.classList.contains('playlist-visible'));

    if (player) {
        saveToLocalStorage(STORAGE_KEYS.VOLUME, player.volume());
        saveToLocalStorage(STORAGE_KEYS.LAST_PLAYED_URL, player.currentSrc());
    }

    // Son seçili kanalı kaydet
    saveLastSelectedChannel();
}

// Son seçili kanalı kaydet
function saveLastSelectedChannel() {
    const selectedItem = playlistElement.querySelector('li.selected');
    if (selectedItem && activePlaylistIndex >= 0) {
        const channelData = {
            playlistIndex: activePlaylistIndex,
            channelUrl: selectedItem.dataset.url,
            channelName: selectedItem.textContent.trim()
        };
        saveToLocalStorage(STORAGE_KEYS.LAST_SELECTED_CHANNEL, channelData);
    }
}

// localStorage'den tüm verileri yükle
function loadAllDataFromLocalStorage() {
    // Playlist verilerini yükle
    const savedPlaylists = loadFromLocalStorage(STORAGE_KEYS.PLAYLISTS, []);
    const savedActiveIndex = loadFromLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST_INDEX, -1);
    const savedCounter = loadFromLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, 0);
    const savedPlaylistVisible = loadFromLocalStorage(STORAGE_KEYS.PLAYLIST_VISIBLE, true);
    const savedVolume = loadFromLocalStorage(STORAGE_KEYS.VOLUME, 1.0);
    const savedLastPlayedUrl = loadFromLocalStorage(STORAGE_KEYS.LAST_PLAYED_URL, null);
    const savedLastSelectedChannel = loadFromLocalStorage(STORAGE_KEYS.LAST_SELECTED_CHANNEL, null);

    // Verileri uygula
    playlists = savedPlaylists;
    activePlaylistIndex = savedActiveIndex;
    playlistCounter = savedCounter;

    // Playlist görünürlüğünü ayarla
    if (savedPlaylistVisible) {
        body.classList.add('playlist-visible');
    } else {
        body.classList.remove('playlist-visible');
    }

    // Video oynatıcı ayarlarını uygula
    if (player) {
        player.volume(savedVolume);

        // Son oynatılan URL'yi yükle (eğer varsa)
        if (savedLastPlayedUrl && savedLastPlayedUrl !== '') {
            player.src({
                src: savedLastPlayedUrl,
                type: getMimeType(savedLastPlayedUrl, getFileExtension(savedLastPlayedUrl))
            });
        }
    }

    // Playlist selector'ı güncelle
    updatePlaylistSelector();

    // Aktif playlist'i göster ve son seçili kanalı geri yükle
    if (activePlaylistIndex >= 0 && activePlaylistIndex < playlists.length) {
        displayChannels(playlists[activePlaylistIndex].channels);
        playlistSelector.value = playlists[activePlaylistIndex].id;

        // Son seçili kanalı geri yükle
        restoreLastSelectedChannel(savedLastSelectedChannel);
    }

    updatePlaylistActionButtons();
}

// Son seçili kanalı geri yükle
function restoreLastSelectedChannel(savedChannelData) {
    if (!savedChannelData || activePlaylistIndex !== savedChannelData.playlistIndex) {
        return;
    }

    // Kaydedilen kanal URL'sine göre kanalı bul ve seç
    const channelItems = playlistElement.querySelectorAll('li[data-url]');
    for (const item of channelItems) {
        if (item.dataset.url === savedChannelData.channelUrl) {
            // Önceki seçimi temizle
            const previouslySelected = playlistElement.querySelector('li.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            // Yeni seçimi uygula
            item.classList.add('selected');

            // Video oynatıcısını güncelle (ama otomatik oynatma)
            playChannel(savedChannelData.channelUrl, false);

            // Seçili öğeye scroll yap
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });

            console.log('Son seçili kanal geri yüklendi:', savedChannelData.channelName);
            break;
        }
    }
}

// Playlist selector'ı güncelle
function updatePlaylistSelector() {
    // Mevcut seçenekleri temizle (varsayılan seçenek hariç)
    const defaultOption = playlistSelector.querySelector('option[value=""]');
    playlistSelector.innerHTML = '';
    if (defaultOption) {
        playlistSelector.appendChild(defaultOption);
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Playlist seçin...';
        playlistSelector.appendChild(option);
    }

    // Playlist'leri ekle
    playlists.forEach(playlist => {
        addPlaylistToSelector(playlist);
    });
}

// Yardımcı fonksiyonlar
function getFileExtension(filename) {
    return filename.toLowerCase().split('.').pop();
}

function isPlaylistFile(extension) {
    const playlistExtensions = ['m3u', 'm3u8', 'pls', 'xspf', 'asx', 'wpl', 'cue', 'json'];
    return playlistExtensions.includes(extension);
}

function isMediaFile(extension) {
    const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ogg', 'ogv', '3gp', 'mpg', 'mpeg', 'ts', 'mts', 'm2ts'];
    const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'oga', 'wma', 'opus'];
    return videoExtensions.includes(extension) || audioExtensions.includes(extension);
}

function getMimeType(url, extension) {
    // HLS streams
    if (url.includes('.m3u8') || extension === 'm3u8') {
        return 'application/x-mpegURL';
    }

    // DASH streams
    if (url.includes('.mpd') || extension === 'mpd') {
        return 'application/dash+xml';
    }

    // Video formats
    const videoMimeTypes = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'ogv': 'video/ogg',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'mkv': 'video/x-matroska',
        '3gp': 'video/3gpp',
        'mpg': 'video/mpeg',
        'mpeg': 'video/mpeg',
        'ts': 'video/mp2t',
        'mts': 'video/mp2t',
        'm2ts': 'video/mp2t'
    };

    // Audio formats
    const audioMimeTypes = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'aac': 'audio/aac',
        'flac': 'audio/flac',
        'm4a': 'audio/mp4',
        'oga': 'audio/ogg',
        'ogg': 'audio/ogg',
        'wma': 'audio/x-ms-wma',
        'opus': 'audio/opus'
    };

    return videoMimeTypes[extension] || audioMimeTypes[extension] || 'video/mp4';
}

// Dokunmatik olay dinleyicileri için değişkenler
let touchStartX = 0;
let touchStartY = 0; // Başlangıç dikey konumunu kaydetmek için
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
const swipeThreshold = 50; // Kaydırma hareketi için minimum mesafe (piksel)
const tapThreshold = 10; // Dokunma için maksimum hareket mesafesi (piksel)
const doubleTapThreshold = 300; // Çift dokunma için maksimum süre (ms)
let lastTapTime = 0;

// Ses ayarlama için eklenecek değişkenler
let initialVolume = 0;
let isVolumeDragging = false;
const volumeDragThreshold = 5; // Ses ayarlama hareketini başlatmak için minimum dikey mesafe

const videoPlayerElement = player.el(); // Video.js oynatıcı elementini al

// Fullscreen event listeners to remove sliding animation during fullscreen transitions
player.on('fullscreenchange', () => {
    if (player.isFullscreen()) {
        // Entering fullscreen - disable margin-left transition
        body.classList.add('fullscreen-transition');
    } else {
        // Exiting fullscreen - re-enable margin-left transition after a brief delay
        setTimeout(() => {
            body.classList.remove('fullscreen-transition');
        }, 50); // Small delay to ensure fullscreen exit is complete
    }
});

// Video oynatıcı event listeners
player.on('volumechange', () => {
    saveToLocalStorage(STORAGE_KEYS.VOLUME, player.volume());
});

player.on('loadstart', () => {
    saveToLocalStorage(STORAGE_KEYS.LAST_PLAYED_URL, player.currentSrc());
});

function updateToggleHandleVisibility() {
    if (window.innerWidth <= 768) {
        playlistToggleHandle.style.opacity = '1';
        playlistToggleHandle.style.pointerEvents = 'auto';
    } else {
        if (!body.classList.contains('playlist-visible')) {
           playlistToggleHandle.style.opacity = '0';
           playlistToggleHandle.style.pointerEvents = 'none';
        } else {
           playlistToggleHandle.style.opacity = '1';
           playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
}

updateToggleHandleVisibility();

window.addEventListener('resize', updateToggleHandleVisibility);

searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();

    allChannelItems.forEach(item => {
        const channelName = item.textContent.toLowerCase();
        if (channelName.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

window.addEventListener('mousemove', (event) => {
    if (window.innerWidth > 768) {
        const mouseX = event.clientX;
        const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = mouseX <= 75;
        const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                             event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

        if (!body.classList.contains('playlist-visible')) {
            if (isNearLeftEdge || isOverHandle) { // Kenara yakınsa VEYA çentik üzerindeyse göster
                playlistToggleHandle.style.opacity = '1';
                playlistToggleHandle.style.pointerEvents = 'auto';
            } else {
                 playlistToggleHandle.style.opacity = '0';
                 playlistToggleHandle.style.pointerEvents = 'none';
            }
        } else {
            playlistToggleHandle.style.opacity = '1';
            playlistToggleHandle.style.pointerEvents = 'auto';
        }
    }
});

window.addEventListener('touchstart', (event) => {
     if (window.innerWidth > 768 && event.touches.length > 0) {
        const touchX = event.touches[0].clientX;
        const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = touchX <= 75;
        const isOverHandle = touchX >= toggleHandleRect.left && touchX <= toggleHandleRect.right &&
                             event.touches[0].clientY >= toggleHandleRect.top && event.touches[0].clientY <= toggleHandleRect.bottom;

        if (!body.classList.contains('playlist-visible') && (isNearLeftEdge || isOverHandle)) {
            playlistToggleHandle.style.opacity = '1';
            playlistToggleHandle.style.pointerEvents = 'auto';

        } else if (!body.classList.contains('playlist-visible') && !isNearLeftEdge && !isOverHandle) {
             playlistToggleHandle.style.opacity = '0';
             playlistToggleHandle.style.pointerEvents = 'none';
        } else if (body.classList.contains('playlist-visible')) {
             playlistToggleHandle.style.opacity = '1';
             playlistToggleHandle.style.pointerEvents = 'auto';
        }
     }
});

videoPlayerElement.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) { // Tek parmak dokunuşu
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
        touchStartTime = new Date().getTime();
        initialVolume = player.volume(); // Dokunma başladığında sesi kaydet
        isVolumeDragging = false; // Ses ayarlama bayrağını sıfırla
        event.preventDefault(); // Varsayılan kaydırma davranışını engellemek isteyebiliriz
    }
});

videoPlayerElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) { // Tek parmak dokunuşu
        const currentTouchY = event.touches[0].clientY;
        const deltaY = currentTouchY - touchStartY; // Dikey hareket miktarı
        const deltaX = event.changedTouches[0].clientX - touchStartX; // Yatay hareket miktarı

        // Ses ayarlama hareketinin başlayıp başlamadığını kontrol et
        if (!isVolumeDragging && Math.abs(deltaY) > volumeDragThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
             isVolumeDragging = true;
             // Opsiyonel: İlk kaydırmadan sonra varsayılan davranışı engelle
             // event.preventDefault();
        }

        if (isVolumeDragging) {
            event.preventDefault(); // Ses ayarlama sırasında varsayılan kaydırmayı engelle

            const playerHeight = videoPlayerElement.clientHeight;
            // Dikey hareket miktarına göre ses değişimini hesapla
            // Yukarı kaydırma (deltaY negatif) sesi artırır, aşağı (deltaY pozitif) azaltır.
            // playerHeight boyunca yapılan kaydırma sesi tam olarak 0'dan 1'e veya tam tersi değiştirmeli.
            const volumeChange = -deltaY / playerHeight;

            let newVolume = initialVolume + volumeChange;

            // Ses seviyesini 0 ile 1 arasında sınırla
            newVolume = Math.max(0, Math.min(1, newVolume));

            player.volume(newVolume);
            // console.log('Ses seviyesi ayarlandı:', newVolume.toFixed(2)); // Hata ayıklama için
        }
    }
});

videoPlayerElement.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Ses ayarlama hareketi yapılmadıysa dokunma ve kaydırma hareketlerini işle
    if (!isVolumeDragging) {
        if (moveDistance < tapThreshold) { // Bu bir dokunma olabilir
            const currentTime = new Date().getTime();
            const timeSinceLastTap = currentTime - lastTapTime;

            if (timeSinceLastTap <= doubleTapThreshold) {
                // Çift dokunma algılandı
                console.log('Çift dokunma algılandı');
                if (!player.paused()) {
                    player.pause();
                } else {
                    player.play();
                }
                lastTapTime = 0; // Çift dokunmayı sıfırla
            } else {
                // Tek dokunma başlangıcı, çift dokunma için zamanı kaydet
                lastTapTime = currentTime;
                 console.log('Tek dokunma algılandı, çift dokunma için bekleniyor');
            }
        }

        // Dokunma bittiğinde kaydırma hareketi olup olmadığını kontrol et
        handleSwipeGesture();
    } else {
        // Ses ayarlama hareketi tamamlandı
        console.log('Ses ayarlama tamamlandı.');
        isVolumeDragging = false; // Bayrağı sıfırla
        // initialVolume = player.volume(); // Yeni başlangıç sesini kaydet (isteğe bağlı)
    }

    // event.preventDefault(); // Varsayılan davranışı engellemek isteyebiliriz
});

function handleSwipeGesture() {
    // Sadece tam ekran modunda swipe'a izin ver
    if (!player.isFullscreen()) {
        console.log('Tam ekran değil, swipe devre dışı');
        return;
    }

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Tam ekran modunda swipe'a izin ver
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
            console.log('Sağa Kaydırma (Tam Ekran) - Önceki Kanal');
            playPreviousChannel();
        } else {
            console.log('Sola Kaydırma (Tam Ekran) - Sonraki Kanal');
            playNextChannel();
        }
    }
}

// Kanal değiştirme fonksiyonları
function playNextChannel() {
    console.log('Sonraki kanal oynatılıyor...');
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const currentChannels = playlists[activePlaylistIndex].channels;
    const currentlyPlayingUrl = player.currentSrc();
    const currentIndex = currentChannels.findIndex(channel => channel.url === currentlyPlayingUrl);

    if (currentIndex !== -1 && currentIndex < currentChannels.length - 1) {
        const nextChannel = currentChannels[currentIndex + 1];
        playChannel(nextChannel.url);
        player.play(); // Kanal değiştirmede oynatmaya devam et

        // Çalma listesindeki seçili öğeyi güncelle
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        // allChannelItems kullanarak yeni seçili öğeyi bul ve işaretle
        const nextSelectedItem = allChannelItems.find(item => item.dataset.url === nextChannel.url);
        if (nextSelectedItem) {
            nextSelectedItem.classList.add('selected');
            // İsteğe bağlı: Yeni seçili öğeye scroll yap
            nextSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } else {
        console.log('Son kanaldayız.');
    }
}

function playPreviousChannel() {
    console.log('Önceki kanal oynatılıyor...');
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const currentChannels = playlists[activePlaylistIndex].channels;
    const currentlyPlayingUrl = player.currentSrc();
    const currentIndex = currentChannels.findIndex(channel => channel.url === currentlyPlayingUrl);

    if (currentIndex > 0) {
        const previousChannel = currentChannels[currentIndex - 1];
        playChannel(previousChannel.url);
        player.play(); // Kanal değiştirmede oynatmaya devam et

        // Çalma listesindeki seçili öğeyi güncelle
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
         // allChannelItems kullanarak yeni seçili öğeyi bul ve işaretle
        const previousSelectedItem = allChannelItems.find(item => item.dataset.url === previousChannel.url);
        if (previousSelectedItem) {
            previousSelectedItem.classList.add('selected');
            // İsteğe bağlı: Yeni seçili öğeye scroll yap
            previousSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } else {
        console.log('İlk kanaldayız.');
    }
}

function adjustVolume(newVolume) {
    if (player) {
        player.volume(newVolume);
        console.log('Ses seviyesi ayarlandı:', newVolume);
        // İsteğe bağlı: Kullanıcıya ses seviyesini gösteren bir UI öğesi eklenebilir
    }
}



playlistToggleHandle.addEventListener('click', () => {
    body.classList.toggle('playlist-visible');
    // Playlist görünürlük durumunu kaydet
    saveToLocalStorage(STORAGE_KEYS.PLAYLIST_VISIBLE, body.classList.contains('playlist-visible'));
});

// Playlist selector event listener
playlistSelector.addEventListener('change', (event) => {
    const selectedPlaylistId = parseInt(event.target.value);
    if (selectedPlaylistId) {
        const index = playlists.findIndex(p => p.id === selectedPlaylistId);
        if (index !== -1) {
            switchToPlaylist(index);
        }
    }
    updatePlaylistActionButtons();
    // Aktif playlist indeksini kaydet
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST_INDEX, activePlaylistIndex);
});

// Update playlist action buttons state
function updatePlaylistActionButtons() {
    const hasSelectedPlaylist = playlistSelector.value && playlistSelector.value !== "";
    renamePlaylistBtn.disabled = !hasSelectedPlaylist;
    deletePlaylistBtn.disabled = !hasSelectedPlaylist;
    // Upload button is always enabled, so we don't disable it
}

// Modal işlevselliği
uploadButton.addEventListener('click', () => {
    uploadModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    clearModalInputs();
});

window.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
        uploadModal.style.display = 'none';
        clearModalInputs();
    }
    if (event.target === renameModal) {
        renameModal.style.display = 'none';
        clearRenameModal();
    }
});

// Rename playlist functionality
renamePlaylistBtn.addEventListener('click', () => {
    const selectedPlaylistId = parseInt(playlistSelector.value);
    if (selectedPlaylistId) {
        const playlist = playlists.find(p => p.id === selectedPlaylistId);
        if (playlist) {
            newPlaylistNameInput.value = playlist.name;
            renameModal.style.display = 'block';
            newPlaylistNameInput.focus();
            newPlaylistNameInput.select();
        }
    }
});

closeRenameModal.addEventListener('click', () => {
    renameModal.style.display = 'none';
    clearRenameModal();
});

cancelRenameBtn.addEventListener('click', () => {
    renameModal.style.display = 'none';
    clearRenameModal();
});

saveRenameBtn.addEventListener('click', () => {
    const newName = newPlaylistNameInput.value.trim();
    const selectedPlaylistId = parseInt(playlistSelector.value);

    if (newName && selectedPlaylistId) {
        renamePlaylist(selectedPlaylistId, newName);
        renameModal.style.display = 'none';
        clearRenameModal();
    } else {
        alert('Lütfen geçerli bir playlist adı girin.');
    }
});

// Handle Enter key in rename input
newPlaylistNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        saveRenameBtn.click();
    }
});

function clearRenameModal() {
    newPlaylistNameInput.value = '';
}

// Delete playlist functionality
deletePlaylistBtn.addEventListener('click', () => {
    const selectedPlaylistId = parseInt(playlistSelector.value);
    if (selectedPlaylistId) {
        const playlist = playlists.find(p => p.id === selectedPlaylistId);
        if (playlist) {
            const confirmDelete = confirm(`"${playlist.name}" playlist'ini silmek istediğinizden emin misiniz?`);
            if (confirmDelete) {
                removePlaylist(selectedPlaylistId);
                updatePlaylistActionButtons();
            }
        }
    }
});

// Rename playlist function
function renamePlaylist(playlistId, newName) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        playlist.name = newName;

        // Update the option text in selector
        const option = playlistSelector.querySelector(`option[value="${playlistId}"]`);
        if (option) {
            option.textContent = newName;
        }

        console.log(`Playlist renamed to: ${newName}`);

        // Playlist verilerini localStorage'e kaydet
        saveToLocalStorage(STORAGE_KEYS.PLAYLISTS, playlists);
    }
}

function clearModalInputs() {
    playlistNameInput.value = '';
    fileUpload.value = '';
    urlInput.value = '';
}

// Dosya yükleme
fileUpload.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length === 1) {
        // Tek dosya yükleme
        handleSingleFile(files[0]);
    } else {
        // Çoklu dosya yükleme
        handleMultipleFiles(files);
    }
});

function handleSingleFile(file) {
    const fileExtension = getFileExtension(file.name);
    const playlistName = playlistNameInput.value.trim() || file.name.replace(/\.[^/.]+$/, "");

    if (isPlaylistFile(fileExtension)) {
        // Playlist dosyası
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            addNewPlaylist(playlistName, content);
            uploadModal.style.display = 'none';
            clearModalInputs();
        };
        reader.readAsText(file);
    } else if (isMediaFile(fileExtension)) {
        // Tek medya dosyası
        const url = URL.createObjectURL(file);
        const channels = [{
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: url,
            group: "Yerel Dosyalar",
            duration: -1,
            attributes: ""
        }];

        const playlist = {
            id: ++playlistCounter,
            name: playlistName,
            channels: channels
        };

        playlists.push(playlist);
        addPlaylistToSelector(playlist);
        switchToPlaylist(playlists.length - 1);
        uploadModal.style.display = 'none';
        clearModalInputs();

        // Playlist verilerini localStorage'e kaydet
        saveAllDataToLocalStorage();
    } else {
        alert('Desteklenmeyen dosya türü: ' + fileExtension);
    }
}

function handleMultipleFiles(files) {
    const playlistName = playlistNameInput.value.trim() || `Karışık Playlist ${playlistCounter + 1}`;
    const channels = [];

    files.forEach(file => {
        const fileExtension = getFileExtension(file.name);
        if (isMediaFile(fileExtension)) {
            const url = URL.createObjectURL(file);
            channels.push({
                name: file.name.replace(/\.[^/.]+$/, ""),
                url: url,
                group: "Yerel Dosyalar",
                duration: -1,
                attributes: ""
            });
        }
    });

    if (channels.length > 0) {
        const playlist = {
            id: ++playlistCounter,
            name: playlistName,
            channels: channels
        };

        playlists.push(playlist);
        addPlaylistToSelector(playlist);
        switchToPlaylist(playlists.length - 1);
        uploadModal.style.display = 'none';
        clearModalInputs();

        // Playlist verilerini localStorage'e kaydet
        saveAllDataToLocalStorage();
    } else {
        alert('Seçilen dosyalar arasında desteklenen medya dosyası bulunamadı.');
    }
}



// URL yükleme
loadUrlButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Lütfen bir URL girin.');
        return;
    }

    const urlExtension = getFileExtension(url.split('?')[0]);
    const playlistName = playlistNameInput.value.trim() || `URL Playlist ${playlistCounter + 1}`;

    // Direkt medya dosyası URL'si ise
    if (isMediaFile(urlExtension) || url.includes('.m3u8') || url.includes('.mpd')) {
        const channels = [{
            name: playlistName,
            url: url,
            group: "URL Medya",
            duration: -1,
            attributes: ""
        }];

        const playlist = {
            id: ++playlistCounter,
            name: playlistName,
            channels: channels
        };

        playlists.push(playlist);
        addPlaylistToSelector(playlist);
        switchToPlaylist(playlists.length - 1);
        uploadModal.style.display = 'none';
        clearModalInputs();

        // Playlist verilerini localStorage'e kaydet
        saveAllDataToLocalStorage();
        return;
    }

    // Playlist dosyası olabilir, içeriği indir
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        addNewPlaylist(playlistName, content);
        uploadModal.style.display = 'none';
        clearModalInputs();
    } catch (error) {
        alert(`URL yüklenirken hata oluştu: ${error.message}`);
    }
});





// Playlist yönetimi fonksiyonları
function addNewPlaylist(name, content) {
    playlistCounter++;
    const playlist = {
        id: playlistCounter,
        name: name,
        channels: parsePlaylistContent(content, name)
    };

    playlists.push(playlist);
    addPlaylistToSelector(playlist);
    switchToPlaylist(playlists.length - 1);

    // Playlist verilerini localStorage'e kaydet
    saveAllDataToLocalStorage();
}

function parsePlaylistContent(content, filename = '') {
    const extension = getFileExtension(filename);

    // M3U/M3U8 format
    if (extension === 'm3u' || extension === 'm3u8' || content.includes('#EXTINF') || content.includes('#EXT-X-')) {
        return parseM3uContent(content, false);
    }

    // PLS format
    if (extension === 'pls' || content.includes('[playlist]')) {
        return parsePlsContent(content);
    }

    // XSPF format
    if (extension === 'xspf' || content.includes('<playlist')) {
        return parseXspfContent(content);
    }

    // JSON format
    if (extension === 'json') {
        return parseJsonContent(content);
    }

    // ASX format
    if (extension === 'asx' || content.includes('<asx')) {
        return parseAsxContent(content);
    }

    // CUE format
    if (extension === 'cue' || content.includes('FILE ')) {
        return parseCueContent(content);
    }

    // Fallback to M3U parser
    return parseM3uContent(content, false);
}

// PLS format parser
function parsePlsContent(content) {
    const lines = content.split('\n');
    const channels = [];
    let currentEntry = {};

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('File')) {
            const match = trimmedLine.match(/File(\d+)=(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                if (!currentEntry[index]) currentEntry[index] = {};
                currentEntry[index].url = match[2].trim();
            }
        } else if (trimmedLine.startsWith('Title')) {
            const match = trimmedLine.match(/Title(\d+)=(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                if (!currentEntry[index]) currentEntry[index] = {};
                currentEntry[index].name = match[2].trim();
            }
        } else if (trimmedLine.startsWith('Length')) {
            const match = trimmedLine.match(/Length(\d+)=(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                if (!currentEntry[index]) currentEntry[index] = {};
                currentEntry[index].duration = parseInt(match[2]);
            }
        }
    }

    // Convert to channels array
    Object.keys(currentEntry).forEach(key => {
        const entry = currentEntry[key];
        if (entry.url) {
            channels.push({
                name: entry.name || `Track ${key}`,
                url: entry.url,
                duration: entry.duration || -1,
                group: 'PLS Playlist',
                attributes: ''
            });
        }
    });

    return channels;
}

// XSPF format parser
function parseXspfContent(content) {
    const channels = [];
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const tracks = xmlDoc.getElementsByTagName('track');

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const title = track.getElementsByTagName('title')[0]?.textContent || `Track ${i + 1}`;
            const location = track.getElementsByTagName('location')[0]?.textContent;
            const duration = track.getElementsByTagName('duration')[0]?.textContent;

            if (location) {
                channels.push({
                    name: title,
                    url: location,
                    duration: duration ? parseInt(duration) / 1000 : -1,
                    group: 'XSPF Playlist',
                    attributes: ''
                });
            }
        }
    } catch (error) {
        console.error('XSPF parsing error:', error);
    }

    return channels;
}

// JSON format parser
function parseJsonContent(content) {
    const channels = [];
    try {
        const data = JSON.parse(content);

        // Handle different JSON structures
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (data.playlist && Array.isArray(data.playlist)) {
            items = data.playlist;
        } else if (data.tracks && Array.isArray(data.tracks)) {
            items = data.tracks;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }

        items.forEach((item, index) => {
            const name = item.title || item.name || item.label || `Track ${index + 1}`;
            const url = item.url || item.src || item.file || item.location;
            const duration = item.duration || item.length || -1;
            const group = item.group || item.category || 'JSON Playlist';

            if (url) {
                channels.push({
                    name: name,
                    url: url,
                    duration: duration,
                    group: group,
                    attributes: ''
                });
            }
        });
    } catch (error) {
        console.error('JSON parsing error:', error);
    }

    return channels;
}

// ASX format parser
function parseAsxContent(content) {
    const channels = [];
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        const entries = xmlDoc.getElementsByTagName('entry');

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const title = entry.getElementsByTagName('title')[0]?.textContent || `Track ${i + 1}`;
            const ref = entry.getElementsByTagName('ref')[0];
            const url = ref?.getAttribute('href');

            if (url) {
                channels.push({
                    name: title,
                    url: url,
                    duration: -1,
                    group: 'ASX Playlist',
                    attributes: ''
                });
            }
        }
    } catch (error) {
        console.error('ASX parsing error:', error);
    }

    return channels;
}

// CUE format parser
function parseCueContent(content) {
    const channels = [];
    const lines = content.split('\n');
    let currentFile = '';
    let currentTrack = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('FILE ')) {
            const match = trimmedLine.match(/FILE "(.+)" (.+)/);
            if (match) {
                currentFile = match[1];
            }
        } else if (trimmedLine.startsWith('TRACK ')) {
            if (currentTrack && currentFile) {
                channels.push({
                    name: currentTrack.title || `Track ${currentTrack.number}`,
                    url: currentFile,
                    duration: -1,
                    group: 'CUE Playlist',
                    attributes: ''
                });
            }

            const match = trimmedLine.match(/TRACK (\d+) (.+)/);
            if (match) {
                currentTrack = {
                    number: match[1],
                    type: match[2]
                };
            }
        } else if (trimmedLine.startsWith('TITLE ') && currentTrack) {
            const match = trimmedLine.match(/TITLE "(.+)"/);
            if (match) {
                currentTrack.title = match[1];
            }
        }
    }

    // Add last track
    if (currentTrack && currentFile) {
        channels.push({
            name: currentTrack.title || `Track ${currentTrack.number}`,
            url: currentFile,
            duration: -1,
            group: 'CUE Playlist',
            attributes: ''
        });
    }

    return channels;
}

function addPlaylistToSelector(playlist) {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = playlist.name;
    playlistSelector.appendChild(option);
    updatePlaylistActionButtons();
}

function removePlaylist(playlistId) {
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index === -1) return;

    // Option'ı kaldır
    const option = playlistSelector.querySelector(`option[value="${playlistId}"]`);
    if (option) option.remove();

    // Playlist'i kaldır
    playlists.splice(index, 1);

    // Aktif playlist'i güncelle
    if (activePlaylistIndex === index) {
        if (playlists.length > 0) {
            const newIndex = Math.min(index, playlists.length - 1);
            switchToPlaylist(newIndex);
        } else {
            activePlaylistIndex = -1;
            playlistSelector.value = "";
            displayChannels([]);
        }
    } else if (activePlaylistIndex > index) {
        activePlaylistIndex--;
    }

    // Playlist verilerini localStorage'e kaydet
    saveAllDataToLocalStorage();
}

function switchToPlaylist(index) {
    if (index < 0 || index >= playlists.length) return;

    activePlaylistIndex = index;
    playlistSelector.value = playlists[index].id;
    displayChannels(playlists[index].channels);
    updatePlaylistActionButtons();

    // Aktif playlist indeksini kaydet
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST_INDEX, activePlaylistIndex);
}



function parseM3uContent(content, shouldDisplay = true) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#EXTINF:')) {
            const match = trimmedLine.match(/#EXTINF:(-?\d+)(.*?),(.*)/);
            if (match) {
                currentChannel = {
                    duration: parseInt(match[1], 10),
                    attributes: match[2].trim(),
                    name: match[3].trim(),
                    url: null
                };
                const groupMatch = currentChannel.attributes.match(/group-title="(.*?)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }
            }
        } else if (trimmedLine.startsWith('#EXTVLCOPT:')) {
            continue;
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
            if (currentChannel) {
                currentChannel.url = trimmedLine;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
    }

    if (shouldDisplay) {
        displayChannels(channels);
    }

    return channels;
}

function displayChannels(channels) {
    playlistElement.innerHTML = '';

    if (channels.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "M3U dosyasında/URL'sinde kanal bulunamadı.";
        playlistElement.appendChild(listItem);
        searchInput.value = '';
        allChannelItems = [];
        return;
    }

    allChannelItems = [];

    const groupedChannels = channels.reduce((groups, channel) => {
        const group = channel.group || 'Diğer Kanallar';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(channel);
        return groups;
    }, {});

    let firstChannelItem = null;
    for (const group in groupedChannels) {
        if (groupedChannels.hasOwnProperty(group)) {
            const groupHeader = document.createElement('li');
            groupHeader.classList.add('group-header');
            groupHeader.textContent = group;
            playlistElement.appendChild(groupHeader);

            groupedChannels[group].forEach(channel => {
                const listItem = document.createElement('li');
                listItem.textContent = channel.name;
                listItem.dataset.url = channel.url;

                listItem.addEventListener('click', (event) => {
                    const previouslySelected = playlistElement.querySelector('li.selected');
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected');
                    }

                    event.currentTarget.classList.add('selected');

                    const urlToCopy = event.currentTarget.dataset.url;
                    if (event.shiftKey) {
                        navigator.clipboard.writeText(urlToCopy).then(() => {
                            console.log('URL panoya kopyalandı:', urlToCopy);
                            event.currentTarget.classList.add('copied');
                            setTimeout(() => {
                                event.currentTarget.classList.remove('copied');
                            }, 1000);
                        }).catch(err => {
                            console.error('URL kopyalanırken hata oluştu:', err);
                        });
                    } else {
                        playChannel(urlToCopy, false);
                        player.play(); // Manuel seçimde oynatmaya başla

                        // Son seçili kanalı kaydet
                        saveLastSelectedChannel();
                    }
                });
                playlistElement.appendChild(listItem);
                allChannelItems.push(listItem);

                if (!firstChannelItem && channel.url) {
                    firstChannelItem = listItem;
                }
            });
        }
    }

    if (firstChannelItem) {
        firstChannelItem.classList.add('selected');
        // İlk kanal seçili olarak işaretlenir ama otomatik oynatılmaz
        playChannel(firstChannelItem.dataset.url, false);

        // İlk kanal seçimini kaydet (sadece yeni playlist yüklendiğinde)
        saveLastSelectedChannel();
    }
}

function playChannel(url, shouldMute = false) {
    if (player) {
        // URL'den dosya uzantısını al
        const urlParts = url.split('?')[0]; // Query parametrelerini kaldır
        const extension = getFileExtension(urlParts);
        const mimeType = getMimeType(url, extension);

        console.log(`Playing: ${url}, Extension: ${extension}, MIME Type: ${mimeType}`);

        player.src({
            src: url,
            type: mimeType
        });

        if (shouldMute) {
             player.muted(true);
        }

        // Son oynatılan URL'yi kaydet
        saveToLocalStorage(STORAGE_KEYS.LAST_PLAYED_URL, url);

        // HLS ve DASH desteği kontrolü
        if (mimeType === 'application/x-mpegURL' && !videojs.Html5Hlsjs) {
             console.warn("Video.js HLS desteğini bulamadı. Lütfen videojs-contrib-hls eklentisini kontrol edin.");
        }

        if (mimeType === 'application/dash+xml' && !videojs.Html5Dashjs) {
             console.warn("Video.js DASH desteğini bulamadı. Lütfen videojs-contrib-dash eklentisini kontrol edin.");
        }

        // Otomatik oynatma kapatıldı - player.play() kaldırıldı
    } else {
        console.error("Video.js oynatıcı nesnesi bulunamadı.");
    }
}

// Drag & Drop desteği
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    body.classList.add('drag-over');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.relatedTarget || !document.contains(e.relatedTarget)) {
        body.classList.remove('drag-over');
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    body.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        if (files.length === 1) {
            handleSingleFile(files[0]);
        } else {
            handleMultipleFiles(files);
        }
    }
});

// Sayfa yüklendiğinde localStorage'den verileri yükle
window.addEventListener('load', () => {
    // localStorage'den verileri yükle
    loadAllDataFromLocalStorage();

    // Eğer hiç playlist yoksa varsayılan playlist'i yükle
    if (playlists.length === 0 && defaultM3uUrl) {
        console.log('Varsayılan M3U URL yükleniyor:', defaultM3uUrl);
        fetch(defaultM3uUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(content => {
                addNewPlaylist('Varsayılan', content);
                console.log('Varsayılan M3U listesi başarıyla yüklendi.');

                // İlk kez yüklenen varsayılan playlist'te ilk kanalı seç ve kaydet
                setTimeout(() => {
                    saveLastSelectedChannel();
                }, 100);
            })
            .catch(error => {
                console.error('Varsayılan M3U URL yüklenirken hata oluştu:', error);
                playlistElement.innerHTML = '';
                const listItem = document.createElement('li');
                listItem.textContent = `Varsayılan URL yüklenemedi: ${error.message}`;
                listItem.style.color = 'red';
                playlistElement.appendChild(listItem);
            });
    }

    updatePlaylistActionButtons(); // Initialize button states
});

// Pencere boyutu değiştiğinde mobil boyuta girilirse playlisti görünür yap
window.addEventListener('resize', () => {
     if (window.innerWidth <= 768 && !body.classList.contains('playlist-visible')) {
        body.classList.add('playlist-visible');
    } /*else if (window.innerWidth > 768 && body.classList.contains('playlist-visible')) {
        // Eğer masaüstü boyuta dönülürse ve playlist açıksa,
        // masaüstü varsayılan durumuna göre davranması için sınıfı kaldırabiliriz.
        // Ancak mobil deneyimi bozmamak adına bu kısmı şimdilik opsiyonel tutuyorum.
        // body.classList.remove('playlist-visible');
        // updateToggleHandleVisibility(); // Masaüstü handle görünürlüğünü güncelle
    }*/
});

// Sayfa kapatılmadan önce verileri kaydet
window.addEventListener('beforeunload', () => {
    saveAllDataToLocalStorage();
});

// Periyodik olarak verileri kaydet (her 30 saniyede bir)
setInterval(() => {
    saveAllDataToLocalStorage();
}, 30000);

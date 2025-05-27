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
const textInput = document.getElementById('text-input');
const loadTextButton = document.getElementById('load-text');
const playlistSelector = document.getElementById('playlist-selector');

const renamePlaylistBtn = document.getElementById('rename-playlist-btn');
const deletePlaylistBtn = document.getElementById('delete-playlist-btn');
const infoButton = document.getElementById('info-button');

const renameModal = document.getElementById('rename-modal');
const closeRenameModal = document.querySelector('.close-rename');
const newPlaylistNameInput = document.getElementById('new-playlist-name');
const saveRenameBtn = document.getElementById('save-rename-btn');
const cancelRenameBtn = document.getElementById('cancel-rename-btn');

const infoModal = document.getElementById('info-modal');
const closeInfoModal = document.querySelector('.close-info');

let allChannelItems = [];

let playlists = [];
let activePlaylistIndex = -1;
let playlistCounter = 0;

let currentSelectedChannelIndex = -1;

const STORAGE_KEYS = {
    PLAYLISTS: 'onlinetv_playlists',
    ACTIVE_PLAYLIST: 'onlinetv_active_playlist',
    LAST_CHANNEL: 'onlinetv_last_channel',
    PLAYLIST_COUNTER: 'onlinetv_playlist_counter'
};

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

function savePlaylistsToStorage() {
    saveToLocalStorage(STORAGE_KEYS.PLAYLISTS, playlists);
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST, activePlaylistIndex);
    saveToLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, playlistCounter);
}

function saveLastSelectedChannel() {
    const selectedItem = playlistElement.querySelector('li.selected');
    if (selectedItem && activePlaylistIndex >= 0) {
        const channelNameSpan = selectedItem.querySelector('.channel-name');
        const channelName = channelNameSpan ? channelNameSpan.textContent : selectedItem.textContent;

        const lastChannel = {
            playlistIndex: activePlaylistIndex,
            channelUrl: selectedItem.dataset.url,
            channelName: channelName
        };
        saveToLocalStorage(STORAGE_KEYS.LAST_CHANNEL, lastChannel);
    }
}

function loadPlaylistsFromStorage() {
    const savedPlaylists = loadFromLocalStorage(STORAGE_KEYS.PLAYLISTS, []);
    const savedActiveIndex = loadFromLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST, -1);
    const savedCounter = loadFromLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, 0);

    if (savedPlaylists.length > 0) {
        playlists = savedPlaylists;
        activePlaylistIndex = savedActiveIndex;
        playlistCounter = savedCounter;

        updatePlaylistSelector();

        if (activePlaylistIndex >= 0 && activePlaylistIndex < playlists.length) {
            switchToPlaylist(activePlaylistIndex);
        }

        return true;
    }

    return false;
}

function restoreLastSelectedChannel() {
    const lastChannel = loadFromLocalStorage(STORAGE_KEYS.LAST_CHANNEL);

    if (lastChannel && lastChannel.playlistIndex === activePlaylistIndex) {
        const channelItem = allChannelItems.find(item => item.dataset.url === lastChannel.channelUrl);
        if (channelItem) {
            const previouslySelected = playlistElement.querySelector('li.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }

            channelItem.classList.add('selected');
            playChannel(lastChannel.channelUrl, false);

            if (activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
                const currentChannels = playlists[activePlaylistIndex].channels;
                currentSelectedChannelIndex = currentChannels.findIndex(channel => channel.url === lastChannel.channelUrl);
            }

            channelItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

            console.log('Son seçili kanal geri yüklendi:', lastChannel.channelName);
        }
    }
}

function removeChannelFromPlaylist(channelUrl) {
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const playlist = playlists[activePlaylistIndex];
    const channelIndex = playlist.channels.findIndex(channel => channel.url === channelUrl);

    if (channelIndex !== -1) {
        playlist.channels.splice(channelIndex, 1);

        displayChannels(playlist.channels);

        savePlaylistsToStorage();

        console.log('Kanal playlist\'ten silindi:', channelUrl);
    }
}

function renameChannel(channelUrl, newName) {
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const playlist = playlists[activePlaylistIndex];
    const channel = playlist.channels.find(ch => ch.url === channelUrl);

    if (channel) {
        channel.name = newName;

        displayChannels(playlist.channels);

        savePlaylistsToStorage();

        console.log('Kanal ismi değiştirildi:', newName);
    }
}

function enableChannelNameEdit(listItem, channelNameSpan) {
    const currentName = channelNameSpan.textContent;
    const channelUrl = listItem.dataset.url;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.width = 'calc(100% - 70px)';
    input.style.maxWidth = '150px';
    input.style.background = 'rgba(255, 255, 255, 0.1)';
    input.style.border = '1px solid #4a9eff';
    input.style.borderRadius = '3px';
    input.style.color = 'inherit';
    input.style.padding = '2px 4px';
    input.style.fontSize = '0.8rem';
    input.style.outline = 'none';
    input.style.height = '20px';

    channelNameSpan.style.display = 'none';
    listItem.insertBefore(input, channelNameSpan);
    input.focus();
    input.select();

    function finishEdit(save = true) {
        const newName = input.value.trim();
        input.remove();
        channelNameSpan.style.display = '';

        if (save && newName && newName !== currentName) {
            renameChannel(channelUrl, newName);
        }
    }

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEdit(true);
        }
    });

    input.addEventListener('blur', () => {
        finishEdit(true);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            finishEdit(false);
        }
    });
}

function clearAllStoredData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    console.log('Tüm localStorage verileri temizlendi.');
}

function updatePlaylistSelector() {
    playlistSelector.innerHTML = '';

    playlists.forEach(playlist => {
        addPlaylistToSelector(playlist);
    });

    if (playlists.length > 0 && (activePlaylistIndex === -1 || activePlaylistIndex >= playlists.length)) {
        switchToPlaylist(0);
    }
}

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

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        const trimmed = string.trim().toLowerCase();

        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            return false;
        }

        const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
        if (withoutProtocol.length === 0) {
            return false;
        }

        const domainPart = withoutProtocol.split('/')[0];
        if (domainPart.length === 0) {
            return false;
        }

        return true;
    }
}

function getMimeType(url, extension) {
    if (url.includes('.m3u8') || extension === 'm3u8') {
        return 'application/x-mpegURL';
    }

    if (url.includes('.mpd') || extension === 'mpd') {
        return 'application/dash+xml';
    }

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

    const knownMimeType = videoMimeTypes[extension] || audioMimeTypes[extension];
    if (knownMimeType) {
        return knownMimeType;
    }

    if (url.includes(':8080') || url.includes('/live/') || url.includes('/stream/')) {
        return 'application/x-mpegURL';
    }

    return 'video/mp4';
}

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchStartTime = 0;
const swipeThreshold = 50;
const tapThreshold = 10;
const doubleTapThreshold = 300;
let lastTapTime = 0;

let initialVolume = 0;
let isVolumeDragging = false;
const volumeDragThreshold = 5;

const videoPlayerElement = player.el();

player.on('fullscreenchange', () => {
    if (player.isFullscreen()) {
        body.classList.add('fullscreen-transition');
    } else {
        setTimeout(() => {
            body.classList.remove('fullscreen-transition');
        }, 50);
    }
});

function updateToggleHandleVisibility() {
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (isMobilePortrait) {
        // Mobil dikey durumda toggle handle'ı gizle
        playlistToggleHandle.style.opacity = '0';
        playlistToggleHandle.style.pointerEvents = 'none';
    } else if (window.innerWidth <= 768) {
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

let searchTimeout;
const SEARCH_DELAY = 300;

searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        performSearch(searchTerm);
    }, SEARCH_DELAY);
});

function performSearch(searchTerm) {
    if (!searchTerm) {
        allChannelItems.forEach(item => {
            item.style.display = '';
        });
        const groupHeaders = playlistElement.querySelectorAll('.group-header');
        groupHeaders.forEach(header => {
            header.style.display = '';
        });
        return;
    }

    if (allChannelItems.length > 1000) {
        performSearchOptimized(searchTerm);
    } else {
        performSearchNormal(searchTerm);
    }
}

function performSearchNormal(searchTerm) {
    const visibleGroups = new Set();

    allChannelItems.forEach(item => {
        const channelName = item.querySelector('.channel-name')?.textContent.toLowerCase() || '';
        const isVisible = channelName.includes(searchTerm);

        item.style.display = isVisible ? '' : 'none';

        if (isVisible) {
            const groupHeader = findGroupHeader(item);
            if (groupHeader) {
                visibleGroups.add(groupHeader);
            }
        }
    });

    updateGroupHeadersVisibility(visibleGroups);
}

function performSearchOptimized(searchTerm) {
    const visibleGroups = new Set();
    let processedCount = 0;
    const batchSize = 100;

    function processBatch() {
        const endIndex = Math.min(processedCount + batchSize, allChannelItems.length);

        for (let i = processedCount; i < endIndex; i++) {
            const item = allChannelItems[i];
            const channelName = item.querySelector('.channel-name')?.textContent.toLowerCase() || '';
            const isVisible = channelName.includes(searchTerm);

            item.style.display = isVisible ? '' : 'none';

            if (isVisible) {
                const groupHeader = findGroupHeader(item);
                if (groupHeader) {
                    visibleGroups.add(groupHeader);
                }
            }
        }

        processedCount = endIndex;

        if (processedCount < allChannelItems.length) {
            requestAnimationFrame(processBatch);
        } else {
            updateGroupHeadersVisibility(visibleGroups);
        }
    }

    processBatch();
}

function findGroupHeader(channelItem) {
    let currentElement = channelItem.previousElementSibling;
    while (currentElement) {
        if (currentElement.classList.contains('group-header')) {
            return currentElement;
        }
        currentElement = currentElement.previousElementSibling;
    }
    return null;
}

function updateGroupHeadersVisibility(visibleGroups) {
    const groupHeaders = playlistElement.querySelectorAll('.group-header');
    groupHeaders.forEach(header => {
        header.style.display = visibleGroups.has(header) ? '' : 'none';
    });
}

window.addEventListener('mousemove', (event) => {
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (window.innerWidth > 768 && !isMobilePortrait) {
        const mouseX = event.clientX;
        const toggleHandleRect = playlistToggleHandle.getBoundingClientRect();

        const isNearLeftEdge = mouseX <= 75;
        const isOverHandle = mouseX >= toggleHandleRect.left && mouseX <= toggleHandleRect.right &&
                             event.clientY >= toggleHandleRect.top && event.clientY <= toggleHandleRect.bottom;

        if (!body.classList.contains('playlist-visible')) {
            if (isNearLeftEdge || isOverHandle) {
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
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (window.innerWidth > 768 && !isMobilePortrait && event.touches.length > 0) {
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

        if (!isVolumeDragging && Math.abs(deltaY) > volumeDragThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
             isVolumeDragging = true;
        }

        if (isVolumeDragging) {
            event.preventDefault();

            const playerHeight = videoPlayerElement.clientHeight;
            const volumeChange = -deltaY / playerHeight;

            let newVolume = initialVolume + volumeChange;

            newVolume = Math.max(0, Math.min(1, newVolume));

            player.volume(newVolume);
        }
    }
});

videoPlayerElement.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!isVolumeDragging) {
        if (moveDistance < tapThreshold) {
            const currentTime = new Date().getTime();
            const timeSinceLastTap = currentTime - lastTapTime;

            if (timeSinceLastTap <= doubleTapThreshold) {
                console.log('Çift dokunma algılandı');
                if (!player.paused()) {
                    player.pause();
                } else {
                    player.play();
                }
                lastTapTime = 0;
            } else {
                lastTapTime = currentTime;
                 console.log('Tek dokunma algılandı, çift dokunma için bekleniyor');
            }
        }

        handleSwipeGesture();
    } else {
        console.log('Ses ayarlama tamamlandı.');
        isVolumeDragging = false;
    }
});

function handleSwipeGesture() {
    if (!player.isFullscreen()) {
        console.log('Tam ekran değil, swipe devre dışı');
        return;
    }

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

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

function playNextChannel() {
    console.log('Sonraki kanal oynatılıyor...');
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const currentChannels = playlists[activePlaylistIndex].channels;

    if (currentSelectedChannelIndex === -1) {
        const selectedItem = playlistElement.querySelector('li.selected');
        if (selectedItem) {
            const selectedUrl = selectedItem.dataset.url;
            currentSelectedChannelIndex = currentChannels.findIndex(channel => channel.url === selectedUrl);
        }
    }

    if (currentSelectedChannelIndex !== -1 && currentSelectedChannelIndex < currentChannels.length - 1) {
        currentSelectedChannelIndex++;
        const nextChannel = currentChannels[currentSelectedChannelIndex];
        playChannel(nextChannel.url);
        player.play();

        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        const nextSelectedItem = allChannelItems.find(item => item.dataset.url === nextChannel.url);
        if (nextSelectedItem) {
            nextSelectedItem.classList.add('selected');
            nextSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        saveLastSelectedChannel();

    } else {
        console.log('Son kanaldayız.');
    }
}

function playPreviousChannel() {
    console.log('Önceki kanal oynatılıyor...');
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const currentChannels = playlists[activePlaylistIndex].channels;

    if (currentSelectedChannelIndex === -1) {
        const selectedItem = playlistElement.querySelector('li.selected');
        if (selectedItem) {
            const selectedUrl = selectedItem.dataset.url;
            currentSelectedChannelIndex = currentChannels.findIndex(channel => channel.url === selectedUrl);
        }
    }

    if (currentSelectedChannelIndex > 0) {
        currentSelectedChannelIndex--;
        const previousChannel = currentChannels[currentSelectedChannelIndex];
        playChannel(previousChannel.url);
        player.play();

        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
         const previousSelectedItem = allChannelItems.find(item => item.dataset.url === previousChannel.url);
        if (previousSelectedItem) {
            previousSelectedItem.classList.add('selected');
            previousSelectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        saveLastSelectedChannel();

    } else {
        console.log('İlk kanaldayız.');
    }
}

function adjustVolume(newVolume) {
    if (player) {
        player.volume(newVolume);
        console.log('Ses seviyesi ayarlandı:', newVolume);
    }
}

playlistToggleHandle.addEventListener('click', () => {
    // Mobil dikey durumda toggle handle'ı devre dışı bırak
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (!isMobilePortrait) {
        body.classList.toggle('playlist-visible');
    }
});

playlistSelector.addEventListener('change', (event) => {
    const selectedPlaylistId = parseInt(event.target.value);
    if (selectedPlaylistId && !isNaN(selectedPlaylistId)) {
        const index = playlists.findIndex(p => p.id === selectedPlaylistId);
        if (index !== -1) {
            switchToPlaylist(index);
        }
    }
    updatePlaylistActionButtons();
});

function updatePlaylistActionButtons() {
    const hasSelectedPlaylist = playlists.length > 0 && activePlaylistIndex >= 0;
    renamePlaylistBtn.disabled = !hasSelectedPlaylist;
    deletePlaylistBtn.disabled = !hasSelectedPlaylist;
}

uploadButton.addEventListener('click', () => {
    uploadModal.style.display = 'block';
    showCursor(); // Modal açıldığında cursor'u göster
});

closeModal.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    clearModalInputs();
    hideCursor(); // Modal kapandığında cursor'u gizle
});

window.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
        uploadModal.style.display = 'none';
        clearModalInputs();
        hideCursor(); // Modal kapandığında cursor'u gizle
    }
    if (event.target === renameModal) {
        renameModal.style.display = 'none';
        clearRenameModal();
        hideCursor(); // Modal kapandığında cursor'u gizle
    }
    if (event.target === infoModal) {
        infoModal.style.display = 'none';
        hideCursor(); // Modal kapandığında cursor'u gizle
    }
});

renamePlaylistBtn.addEventListener('click', () => {
    const selectedPlaylistId = parseInt(playlistSelector.value);
    if (selectedPlaylistId) {
        const playlist = playlists.find(p => p.id === selectedPlaylistId);
        if (playlist) {
            newPlaylistNameInput.value = playlist.name;
            renameModal.style.display = 'block';
            showCursor(); // Modal açıldığında cursor'u göster
            newPlaylistNameInput.focus();
            newPlaylistNameInput.select();
        }
    }
});

closeRenameModal.addEventListener('click', () => {
    renameModal.style.display = 'none';
    clearRenameModal();
    hideCursor(); // Modal kapandığında cursor'u gizle
});

cancelRenameBtn.addEventListener('click', () => {
    renameModal.style.display = 'none';
    clearRenameModal();
    hideCursor(); // Modal kapandığında cursor'u gizle
});

saveRenameBtn.addEventListener('click', () => {
    const newName = newPlaylistNameInput.value.trim();
    const selectedPlaylistId = parseInt(playlistSelector.value);

    if (newName && selectedPlaylistId) {
        renamePlaylist(selectedPlaylistId, newName);
        renameModal.style.display = 'none';
        clearRenameModal();
        hideCursor(); // Modal kapandığında cursor'u gizle
    } else {
        alert('Lütfen geçerli bir playlist adı girin.');
        returnFocusToPlaylist();
    }
});

newPlaylistNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        saveRenameBtn.click();
    }
});

function clearRenameModal() {
    newPlaylistNameInput.value = '';
}

// Hata sonrası focus'u playlist'e döndüren yardımcı fonksiyon
function returnFocusToPlaylist() {
    setTimeout(() => {
        focusArea = 'playlist';
        const selectedChannel = playlistElement.querySelector('li.selected');
        if (selectedChannel) {
            selectedChannel.focus();
        }
    }, 100);
}

// Info Modal Event Listeners
infoButton.addEventListener('click', () => {
    infoModal.style.display = 'block';
    showCursor(); // Modal açıldığında cursor'u göster
});

closeInfoModal.addEventListener('click', () => {
    infoModal.style.display = 'none';
    hideCursor(); // Modal kapandığında cursor'u gizle
});

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

function renamePlaylist(playlistId, newName) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        playlist.name = newName;

        const option = playlistSelector.querySelector(`option[value="${playlistId}"]`);
        if (option) {
            let displayName = newName;
            if (displayName.length > 25) {
                displayName = displayName.substring(0, 22) + '...';
            }

            option.textContent = displayName;
            option.title = newName;
        }

        console.log(`Playlist renamed to: ${newName}`);

        savePlaylistsToStorage();
    }
}

function clearModalInputs() {
    playlistNameInput.value = '';
    fileUpload.value = '';
    urlInput.value = '';
    textInput.value = '';
}

fileUpload.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length === 1) {
        handleSingleFile(files[0]);
    } else {
        handleMultipleFiles(files);
    }
});

function handleSingleFile(file) {
    const fileExtension = getFileExtension(file.name);
    const playlistName = playlistNameInput.value.trim() || file.name.replace(/\.[^/.]+$/, "");

    if (isPlaylistFile(fileExtension)) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            addNewPlaylist(playlistName, content);
            uploadModal.style.display = 'none';
            clearModalInputs();
        };
        reader.readAsText(file);
    } else {
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

        savePlaylistsToStorage();
    }
}

function handleMultipleFiles(files) {
    const playlistName = playlistNameInput.value.trim() || `Karışık Playlist ${playlistCounter + 1}`;
    const channels = [];

    files.forEach(file => {
        const fileExtension = getFileExtension(file.name);
        if (!isPlaylistFile(fileExtension)) {
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

        savePlaylistsToStorage();
    } else {
        alert('Seçilen dosyalar arasında medya dosyası bulunamadı (sadece playlist dosyaları seçilmiş).');
        returnFocusToPlaylist();
    }
}

loadUrlButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Lütfen bir URL girin.');
        returnFocusToPlaylist();
        return;
    }

    if (!isValidUrl(url)) {
        alert('Geçersiz URL formatı! URL http:// veya https:// ile başlamalıdır.\n\nÖrnekler:\n• http://example.com/playlist.m3u8\n• https://example.com/stream.mp4\n• http://192.168.1.100:8080/stream');
        returnFocusToPlaylist();
        return;
    }

    const playlistName = playlistNameInput.value.trim() || `URL Playlist ${playlistCounter + 1}`;

    try {
        let fetchUrl = url;

        const corsProxies = [
            '',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];

        let response;
        let content;

        for (const proxy of corsProxies) {
            try {
                fetchUrl = proxy + encodeURIComponent(url);
                if (proxy === '') fetchUrl = url;

                response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                content = await response.text();
                break;
            } catch (proxyError) {
                console.log(`Proxy ${proxy || 'direct'} failed:`, proxyError.message);
                if (proxy === corsProxies[corsProxies.length - 1]) {
                    throw proxyError;
                }
                continue;
            }
        }

        if (content.includes('#EXTINF') || content.includes('#EXT-X-') ||
            content.includes('[playlist]') || content.includes('<playlist') ||
            content.includes('<asx') || content.includes('FILE ')) {
            addNewPlaylist(playlistName, content);
        } else {
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

            savePlaylistsToStorage();
        }

        uploadModal.style.display = 'none';
        clearModalInputs();

    } catch (error) {
        console.log('URL fetch başarısız, direkt streaming URL olarak işleniyor:', error.message);

        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            console.log('CORS hatası algılandı, URL direkt streaming linki olarak ekleniyor');
        }

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

        savePlaylistsToStorage();

        alert(`URL eklendi! Not: URL'ye erişim sağlanamadı (CORS kısıtlaması), bu nedenle direkt streaming linki olarak eklendi. Eğer bu bir playlist dosyası ise, dosyayı indirip yükleyebilirsiniz.`);
        returnFocusToPlaylist();
    }
});

urlInput.addEventListener('input', (event) => {
    const url = event.target.value.trim();
    const loadButton = loadUrlButton;

    if (!url) {
        loadButton.disabled = false;
        loadButton.style.opacity = '1';
        loadButton.title = '';
        event.target.style.borderColor = '#555';
        return;
    }

    if (isValidUrl(url)) {
        loadButton.disabled = false;
        loadButton.style.opacity = '1';
        loadButton.title = '';
        event.target.style.borderColor = '#555';
    } else {
        loadButton.disabled = true;
        loadButton.style.opacity = '0.5';
        loadButton.title = 'Geçerli bir HTTP/HTTPS URL\'si girin';
        event.target.style.borderColor = '#555';
    }
});

textInput.addEventListener('input', (event) => {
    const content = event.target.value.trim();
    const loadButton = loadTextButton;

    if (!content) {
        loadButton.disabled = true;
        loadButton.style.opacity = '0.5';
        loadButton.title = 'Playlist içeriği girin';
        event.target.style.borderColor = '#555';
    } else {
        loadButton.disabled = false;
        loadButton.style.opacity = '1';
        loadButton.title = '';
        event.target.style.borderColor = '#555';
    }
});

loadTextButton.addEventListener('click', () => {
    const content = textInput.value.trim();
    if (!content) {
        alert('Lütfen playlist içeriğini girin.');
        returnFocusToPlaylist();
        return;
    }

    const playlistName = playlistNameInput.value.trim() || `Manuel Playlist ${playlistCounter + 1}`;

    try {
        addNewPlaylist(playlistName, content);
        uploadModal.style.display = 'none';
        clearModalInputs();
    } catch (error) {
        alert(`Playlist işlenirken hata oluştu: ${error.message}`);
        returnFocusToPlaylist();
    }
});

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

    savePlaylistsToStorage();
}

function parsePlaylistContent(content, filename = '') {
    const extension = getFileExtension(filename);

    if (extension === 'm3u' || extension === 'm3u8' || content.includes('#EXTINF') || content.includes('#EXT-X-')) {
        return parseM3uContent(content, false);
    }

    if (extension === 'pls' || content.includes('[playlist]')) {
        return parsePlsContent(content);
    }

    if (extension === 'xspf' || content.includes('<playlist')) {
        return parseXspfContent(content);
    }

    if (extension === 'json') {
        return parseJsonContent(content);
    }

    if (extension === 'asx' || content.includes('<asx')) {
        return parseAsxContent(content);
    }

    if (extension === 'cue' || content.includes('FILE ')) {
        return parseCueContent(content);
    }

    return parseM3uContent(content, false);
}

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

function parseJsonContent(content) {
    const channels = [];
    try {
        const data = JSON.parse(content);

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

    let displayName = playlist.name;
    if (displayName.length > 25) {
        displayName = displayName.substring(0, 22) + '...';
    }

    option.textContent = displayName;
    option.title = playlist.name;
    playlistSelector.appendChild(option);
    updatePlaylistActionButtons();
}

function removePlaylist(playlistId) {
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index === -1) return;

    const option = playlistSelector.querySelector(`option[value="${playlistId}"]`);
    if (option) option.remove();

    playlists.splice(index, 1);

    if (activePlaylistIndex === index) {
        if (playlists.length > 0) {
            const newIndex = Math.min(index, playlists.length - 1);
            switchToPlaylist(newIndex);
        } else {
            activePlaylistIndex = -1;
            displayChannels([]);
        }
    } else if (activePlaylistIndex > index) {
        activePlaylistIndex--;
    }

    updatePlaylistActionButtons();

    savePlaylistsToStorage();
}

function switchToPlaylist(index) {
    if (index < 0 || index >= playlists.length) return;

    activePlaylistIndex = index;
    currentSelectedChannelIndex = -1;
    playlistSelector.value = playlists[index].id;
    displayChannels(playlists[index].channels);
    updatePlaylistActionButtons();

    savePlaylistsToStorage();
}

function parseM3uContent(content, shouldDisplay = true) {
    let normalizedContent = content;

    if (!content.includes('\n') && content.includes('#EXTINF')) {
        normalizedContent = content
            .replace(/#EXTINF/g, '\n#EXTINF')
            .replace(/http/g, '\nhttp')
            .replace(/^[\s\n]+/, '')
            .trim();
    }

    const lines = normalizedContent.split('\n');
    const channels = [];
    let currentChannel = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('#EXTINF:')) {
            const match = trimmedLine.match(/#EXTINF:(-?\d+)(.*?),(.*)/);
            if (match) {
                currentChannel = {
                    duration: parseInt(match[1], 10),
                    attributes: match[2].trim(),
                    name: match[3].trim(),
                    url: null,
                    group: 'Genel'
                };

                const groupMatch = currentChannel.attributes.match(/group-title="([^"]*?)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }

                if (!groupMatch) {
                    const bracketMatch = currentChannel.attributes.match(/\[([^\]]*?)\]/);
                    if (bracketMatch) {
                        currentChannel.group = bracketMatch[1];
                    }
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

let isRenderingChannels = false;
let renderQueue = [];
const BATCH_SIZE = 50;

function displayChannels(channels) {
    if (isRenderingChannels) {
        renderQueue.push(channels);
        return;
    }

    playlistElement.innerHTML = '';
    currentSelectedChannelIndex = -1;
    allChannelItems = [];

    if (channels.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "M3U dosyasında/URL'sinde kanal bulunamadı.";
        playlistElement.appendChild(listItem);
        searchInput.value = '';
        return;
    }

    if (channels.length > 1000) {
        displayChannelsOptimized(channels);
    } else {
        displayChannelsNormal(channels);
    }
}

function displayChannelsOptimized(channels) {
    isRenderingChannels = true;

    const loadingItem = document.createElement('li');
    loadingItem.textContent = `${channels.length} kanal yükleniyor...`;
    loadingItem.style.color = '#4a9eff';
    loadingItem.style.textAlign = 'center';
    loadingItem.style.padding = '20px';
    loadingItem.classList.add('loading-item');
    playlistElement.appendChild(loadingItem);

    const groupedChannels = channels.reduce((groups, channel) => {
        const group = channel.group || 'Diğer Kanallar';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(channel);
        return groups;
    }, {});

    playlistElement.removeChild(loadingItem);

    let firstChannelItem = null;
    let processedCount = 0;

    const flatChannels = [];
    for (const group in groupedChannels) {
        if (groupedChannels.hasOwnProperty(group)) {
            flatChannels.push({ type: 'group', name: group });
            groupedChannels[group].forEach(channel => {
                flatChannels.push({ type: 'channel', data: channel });
            });
        }
    }

    function renderBatch() {
        let batchCount = 0;

        while (processedCount < flatChannels.length && batchCount < BATCH_SIZE) {
            const item = flatChannels[processedCount];

            if (item.type === 'group') {
                const groupHeader = document.createElement('li');
                groupHeader.classList.add('group-header');
                groupHeader.textContent = item.name;
                groupHeader.dataset.group = item.name;
                playlistElement.appendChild(groupHeader);
            } else if (item.type === 'channel') {
                const channel = item.data;
                const listItem = createChannelElement(channel);

                playlistElement.appendChild(listItem);
                allChannelItems.push(listItem);

                if (!firstChannelItem && channel.url) {
                    firstChannelItem = listItem;
                }

                batchCount++;
            }

            processedCount++;
        }

        if (processedCount < flatChannels.length) {
            requestAnimationFrame(() => {
                setTimeout(renderBatch, 0);
            });
        } else {
            finishChannelRendering(firstChannelItem);
        }
    }

    renderBatch();
}

function displayChannelsNormal(channels) {
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
                const listItem = createChannelElement(channel);
                playlistElement.appendChild(listItem);
                allChannelItems.push(listItem);

                if (!firstChannelItem && channel.url) {
                    firstChannelItem = listItem;
                }
            });
        }
    }

    finishChannelRendering(firstChannelItem);
}

function createChannelElement(channel) {
    const listItem = document.createElement('li');
    listItem.dataset.url = channel.url;
    listItem.classList.add('channel-item');

    const channelName = document.createElement('span');
    channelName.textContent = channel.name;
    channelName.classList.add('channel-name');

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('channel-buttons');

    const editButton = document.createElement('button');
    editButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
    `;
    editButton.classList.add('channel-btn', 'edit-btn');
    editButton.title = 'Kanal ismini düzenle';

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
    `;
    deleteButton.classList.add('channel-btn', 'delete-btn');
    deleteButton.title = 'Kanalı sil';

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);

    listItem.appendChild(channelName);
    listItem.appendChild(buttonContainer);

    return listItem;
}

function finishChannelRendering(firstChannelItem) {
    isRenderingChannels = false;

    if (!playlistElement.hasAttribute('data-events-attached')) {
        playlistElement.addEventListener('click', handleChannelClick);
        playlistElement.setAttribute('data-events-attached', 'true');
    }

    if (firstChannelItem) {
        firstChannelItem.classList.add('selected');
        playChannel(firstChannelItem.dataset.url, false);

        if (activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
            const currentChannels = playlists[activePlaylistIndex].channels;
            currentSelectedChannelIndex = currentChannels.findIndex(channel => channel.url === firstChannelItem.dataset.url);
        }
    }

    setTimeout(() => {
        restoreLastSelectedChannel();
    }, 100);

    if (renderQueue.length > 0) {
        const nextChannels = renderQueue.shift();
        displayChannels(nextChannels);
    }
}

function handleChannelClick(event) {
    const target = event.target;
    const listItem = target.closest('.channel-item');

    if (!listItem) return;

    if (target.closest('.edit-btn')) {
        event.stopPropagation();
        const channelName = listItem.querySelector('.channel-name');
        enableChannelNameEdit(listItem, channelName);
        return;
    }

    if (target.closest('.delete-btn')) {
        event.stopPropagation();
        const channelUrl = listItem.dataset.url;
        const channelNameText = listItem.querySelector('.channel-name').textContent;

        const confirmDelete = confirm(`"${channelNameText}" kanalını listeden silmek istediğinizden emin misiniz?`);
        if (confirmDelete) {
            removeChannelFromPlaylist(channelUrl);
        }
        return;
    }

    if (!target.classList.contains('channel-btn')) {
        const previouslySelected = playlistElement.querySelector('li.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        listItem.classList.add('selected');

        const urlToCopy = listItem.dataset.url;
        if (event.shiftKey) {
            navigator.clipboard.writeText(urlToCopy).then(() => {
                console.log('URL panoya kopyalandı:', urlToCopy);
                listItem.classList.add('copied');
                setTimeout(() => {
                    listItem.classList.remove('copied');
                }, 1000);
            }).catch(err => {
                console.error('URL kopyalanırken hata oluştu:', err);
            });
        } else {
            playChannel(urlToCopy, false);
            player.play();

            if (activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
                const currentChannels = playlists[activePlaylistIndex].channels;
                currentSelectedChannelIndex = currentChannels.findIndex(channel => channel.url === urlToCopy);
            }

            saveLastSelectedChannel();
        }
    }
}

function playChannel(url, shouldMute = false) {
    if (player) {
        const urlParts = url.split('?')[0];
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

        if (mimeType === 'application/x-mpegURL' && !videojs.Html5Hlsjs) {
             console.warn("Video.js HLS desteğini bulamadı. Lütfen videojs-contrib-hls eklentisini kontrol edin.");
        }

        if (mimeType === 'application/dash+xml' && !videojs.Html5Dashjs) {
             console.warn("Video.js DASH desteğini bulamadı. Lütfen videojs-contrib-dash eklentisini kontrol edin.");
        }
    } else {
        console.error("Video.js oynatıcı nesnesi bulunamadı.");
    }
}

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

window.addEventListener('load', () => {
    body.classList.add('no-transition');
    body.classList.add('playlist-visible');

    // TV Mode için cursor'u başlangıçta gizle
    body.classList.add('hide-cursor');

    // Focus'u playlist'te bırak
    focusArea = 'playlist';

    const selectedChannel = playlistElement.querySelector('li.selected');
    if (selectedChannel) {
        selectedChannel.focus();
    }

    setTimeout(() => {
        body.classList.remove('no-transition');
    }, 100);

    const hasStoredData = loadPlaylistsFromStorage();

    if (!hasStoredData && defaultM3uUrl) {
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
            })
            .catch(error => {
                console.error('Varsayılan M3U URL yüklenirken hata oluştu:', error);
                playlistElement.innerHTML = '';
                const listItem = document.createElement('li');
                listItem.textContent = `Varsayılan URL yüklenemedi: ${error.message}`;
                listItem.style.color = 'red';
                playlistElement.appendChild(listItem);
            });
    } else if (hasStoredData) {
        console.log('localStorage\'den playlist verileri yüklendi.');
    }

    updatePlaylistActionButtons();
});

window.addEventListener('resize', () => {
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (isMobilePortrait) {
        // Mobil dikey durumda kanal listesini hep görünür tut ve focus'u playlist'te bırak
        body.classList.add('playlist-visible');
        focusArea = 'playlist';
    } else if (window.innerWidth <= 768 && !body.classList.contains('playlist-visible')) {
        body.classList.add('playlist-visible');
    }
});

let isFullscreen = false;

document.addEventListener('fullscreenchange', function() {
    isFullscreen = !!document.fullscreenElement;
});

const VOLUME_STEP = 5;
const VOLUME_MIN = 0;
const VOLUME_MAX = 100;

let focusArea = 'playlist';
let lastNavigationTime = 0;
const NAVIGATION_DELAY = 1;

// TV Mode - Mouse cursor management
let mouseTimer;
const MOUSE_HIDE_DELAY = 3000; // 3 saniye sonra cursor gizle

function showCursor() {
    body.classList.remove('hide-cursor');
    clearTimeout(mouseTimer);

    // 3 saniye sonra cursor'u gizle
    mouseTimer = setTimeout(() => {
        body.classList.add('hide-cursor');
    }, MOUSE_HIDE_DELAY);
}

function hideCursor() {
    body.classList.add('hide-cursor');
    clearTimeout(mouseTimer);
}

// Mouse hareket algılama
document.addEventListener('mousemove', showCursor);
document.addEventListener('mousedown', showCursor);
document.addEventListener('mouseup', showCursor);

// Klavye kullanımında cursor'u gizle
document.addEventListener('keydown', hideCursor);

document.addEventListener('keydown', function(event) {
    // Mobil dikey durumda sağ-sol tuşlarını devre dışı bırak
    const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

    if (!document.fullscreenElement && !isMobilePortrait) {
        switch(event.key) {
            case 'ArrowLeft':
                if (focusArea === 'player') {
                    focusArea = 'playlist';
                    showPlaylist();
                    const selectedChannel = playlistElement.querySelector('li.selected');
                    if (selectedChannel) {
                        selectedChannel.focus();
                    }
                }
                break;

            case 'ArrowRight':
                if (focusArea === 'playlist') {
                    focusArea = 'player';
                    hidePlaylist();
                    player.focus();
                }
                break;
        }
    }

    switch(event.key) {
        case 'f':
        case 'F':
            if (!isFullscreen) {
                player.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
            break;
        case 'ArrowUp':
            if (event.ctrlKey) {
                adjustVolume('up');
                event.preventDefault();
            } else if (isFullscreen) {
                navigateAndPlayChannel('up');
            } else {
                navigateChannelList('up');
            }
            break;
        case 'ArrowDown':
            if (event.ctrlKey) {
                adjustVolume('down');
                event.preventDefault();
            } else if (isFullscreen) {
                navigateAndPlayChannel('down');
            } else {
                navigateChannelList('down');
            }
            break;
        case 'Enter':
            const selectedChannel = playlistElement.querySelector('li.selected');
            if (selectedChannel) {
                selectedChannel.click();
            }
            break;
        case ' ':
            if (player.paused()) {
                player.play();
            } else {
                player.pause();
            }
            break;
        case 'm':
        case 'M':
            player.muted(!player.muted());
            break;
    }
});

function findNextPlayableChannel(currentIndex, channels, direction) {
    let newIndex = currentIndex;

    do {
        if (direction === 'up') {
            newIndex = newIndex <= 0 ? channels.length - 1 : newIndex - 1;
        } else {
            newIndex = newIndex >= channels.length - 1 ? 0 : newIndex + 1;
        }
    } while (channels[newIndex].classList.contains('category-header') ||
             channels[newIndex].classList.contains('group-header') ||
             channels[newIndex].classList.contains('group-header selected'));

    return newIndex;
}

function navigateChannelList(direction) {
    const currentTime = Date.now();
    if (currentTime - lastNavigationTime < NAVIGATION_DELAY) {
        return;
    }
    lastNavigationTime = currentTime;

    const allItems = Array.from(playlistElement.querySelectorAll('li'));
    const currentIndex = allItems.findIndex(item => item.classList.contains('selected'));

    if (currentIndex === -1) {
        const firstPlayable = allItems.findIndex(item => !item.classList.contains('category-header'));
        if (firstPlayable !== -1) {
            allItems[firstPlayable].classList.add('selected');
            allItems[firstPlayable].scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        return;
    }

    const newIndex = findNextPlayableChannel(currentIndex, allItems, direction);

    allItems.forEach(item => item.classList.remove('selected'));
    allItems[newIndex].classList.add('selected');
    allItems[newIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
}

function navigateAndPlayChannel(direction) {
    const allItems = Array.from(playlistElement.querySelectorAll('li'));
    const currentIndex = allItems.findIndex(item => item.classList.contains('selected'));

    if (currentIndex === -1) return;

    const newIndex = findNextPlayableChannel(currentIndex, allItems, direction);

    allItems.forEach(item => item.classList.remove('selected'));
    allItems[newIndex].classList.add('selected');
    allItems[newIndex].click();
}

function adjustVolume(direction) {
    let currentVolume = player.volume() * 100;

    if (direction === 'up') {
        currentVolume = Math.min(currentVolume + VOLUME_STEP, VOLUME_MAX);
    } else {
        currentVolume = Math.max(currentVolume - VOLUME_STEP, VOLUME_MIN);
    }

    player.volume(currentVolume / 100);

    showVolumeIndicator(currentVolume);
}

function showPlaylist() {
    const playlist = document.getElementById('playlist');
    playlist.style.transform = 'translateX(0)';
    playlist.style.opacity = '1';
    document.body.classList.add('playlist-visible');
}

function hidePlaylist() {
    const playlist = document.getElementById('playlist');
    playlist.style.transform = 'translateX(-100%)';
    playlist.style.opacity = '0';
    document.body.classList.remove('playlist-visible');
}

function showVolumeIndicator(volume) {
    const existingIndicator = document.querySelector('.volume-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.className = 'volume-indicator';
    indicator.textContent = `Ses: ${Math.round(volume)}%`;
    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// Events - Event listener'ları yönetimi
import { elements, showModal, hideModal, clearModalInputs, updateToggleHandleVisibility } from './ui.js';
import { getPlaylistData, switchToPlaylist, addNewPlaylist, removePlaylist, renamePlaylist } from './playlist.js';
import { isValidUrl, getFileExtension, isPlaylistFile } from './utils.js';
import { savePlaylistsToStorage } from './storageManager.js';

export function initializeEventListeners() {
    // Upload button
    elements.uploadButton.addEventListener('click', () => {
        showModal(elements.uploadModal);
    });

    // Modal close buttons
    elements.closeModal.addEventListener('click', () => {
        hideModal(elements.uploadModal);
    });

    // Close modal when clicking outside
    elements.uploadModal.addEventListener('click', (event) => {
        if (event.target === elements.uploadModal) {
            hideModal(elements.uploadModal);
        }
    });

    // Info button
    elements.infoButton.addEventListener('click', () => {
        showModal(elements.infoModal);
    });

    // Playlist toggle handle
    elements.playlistToggleHandle.addEventListener('click', () => {
        const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;

        if (!isMobilePortrait) {
            elements.body.classList.toggle('playlist-visible');
            updateToggleHandleVisibility();
        }
    });

    // Sayfa yenilenince otomatik yenileme main.js'de ele alındı

    // Playlist selector change
    elements.playlistSelector.addEventListener('change', (event) => {
        const selectedPlaylistId = parseInt(event.target.value);
        if (selectedPlaylistId && !isNaN(selectedPlaylistId)) {
            const { playlists } = getPlaylistData();
            const index = playlists.findIndex(p => p.id === selectedPlaylistId);
            if (index !== -1) {
                switchToPlaylist(index);
            }
        }
        // updatePlaylistActionButtons(); // Bu fonksiyon playlist modülünde
    });

    // Load URL button
    elements.loadUrlButton.addEventListener('click', async () => {
        const url = elements.urlInput.value.trim();
        if (!url) {
            alert('Lütfen bir URL girin.');
            return;
        }

        if (!isValidUrl(url)) {
            alert('Geçersiz URL formatı! URL http:// veya https:// ile başlamalıdır.');
            return;
        }

        const playlistName = elements.playlistNameInput.value.trim();
        await handleUrlLoad(url, playlistName);
    });

    // Load text button
    elements.loadTextButton.addEventListener('click', () => {
        const content = elements.textInput.value.trim();
        if (!content) {
            alert('Lütfen playlist içeriği girin.');
            return;
        }

        const playlistName = elements.playlistNameInput.value.trim() || `Manuel Playlist`;

        try {
            addNewPlaylist(playlistName, content);
            hideModal(elements.uploadModal);
            clearModalInputs();
        } catch (error) {
            console.error('Text yükleme hatası:', error);
            alert('İçerik yüklenirken hata oluştu: ' + error.message);
        }
    });

    // Text input change - enable/disable load button
    elements.textInput.addEventListener('input', () => {
        elements.loadTextButton.disabled = !elements.textInput.value.trim();
    });

    // File upload
    elements.fileUpload.addEventListener('change', (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (files.length === 1) {
            handleSingleFile(files[0]);
        } else {
            handleMultipleFiles(files);
        }
    });

    // Rename playlist button
    elements.renamePlaylistBtn.addEventListener('click', () => {
        const { playlists, activePlaylistIndex } = getPlaylistData();
        if (activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
            elements.newPlaylistNameInput.value = playlists[activePlaylistIndex].name;
            showModal(elements.renameModal);
            elements.newPlaylistNameInput.focus();
            elements.newPlaylistNameInput.select();
        }
    });

    // Delete playlist button
    elements.deletePlaylistBtn.addEventListener('click', () => {
        const { playlists, activePlaylistIndex } = getPlaylistData();
        if (activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
            const playlist = playlists[activePlaylistIndex];
            const confirmDelete = confirm(`"${playlist.name}" playlist'ini silmek istediğinizden emin misiniz?`);
            if (confirmDelete) {
                removePlaylist(playlist.id);
            }
        }
    });

    // Save rename button
    elements.saveRenameBtn.addEventListener('click', () => {
        const newName = elements.newPlaylistNameInput.value.trim();
        const { playlists, activePlaylistIndex } = getPlaylistData();

        if (newName && activePlaylistIndex >= 0 && playlists[activePlaylistIndex]) {
            renamePlaylist(playlists[activePlaylistIndex].id, newName);
            hideModal(elements.renameModal);
            clearRenameModal();
        } else {
            alert('Lütfen geçerli bir playlist adı girin.');
        }
    });

    // Cancel rename button
    elements.cancelRenameBtn.addEventListener('click', () => {
        hideModal(elements.renameModal);
        clearRenameModal();
    });

    // Close rename modal
    elements.closeRenameModal.addEventListener('click', () => {
        hideModal(elements.renameModal);
        clearRenameModal();
    });

    // Enter key support for rename input
    elements.newPlaylistNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            elements.saveRenameBtn.click();
        }
    });
}

function clearRenameModal() {
    elements.newPlaylistNameInput.value = '';
}

// Dosya yükleme fonksiyonları
function handleSingleFile(file) {
    const fileExtension = getFileExtension(file.name);
    const playlistName = elements.playlistNameInput.value.trim() || file.name.replace(/\.[^/.]+$/, "");

    if (isPlaylistFile(fileExtension)) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            addNewPlaylist(playlistName, content);
            hideModal(elements.uploadModal);
            clearModalInputs();
        };
        reader.readAsText(file);
    } else {
        // Medya dosyası için playlist oluştur
        const url = URL.createObjectURL(file);
        const { playlists, activePlaylistIndex, playlistCounter } = getPlaylistData();

        const channels = [{
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: url,
            group: "Yerel Dosyalar",
            duration: -1,
            attributes: "",
            logo: null
        }];

        const playlist = {
            id: playlistCounter + 1,
            name: playlistName,
            channels: channels
        };

        // Playlist modülüne yeni playlist ekle
        addNewPlaylist(playlistName, JSON.stringify(channels));
        hideModal(elements.uploadModal);
        clearModalInputs();
    }
}

function handleMultipleFiles(files) {
    const playlistName = elements.playlistNameInput.value.trim() || `Karışık Playlist`;
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
                attributes: "",
                logo: null
            });
        }
    });

    if (channels.length > 0) {
        // Channels'ı M3U formatına çevir
        let m3uContent = '#EXTM3U\n';
        channels.forEach(channel => {
            m3uContent += `#EXTINF:${channel.duration},${channel.name}\n${channel.url}\n`;
        });

        addNewPlaylist(playlistName, m3uContent);
        hideModal(elements.uploadModal);
        clearModalInputs();
    } else {
        alert('Seçilen dosyalar arasında medya dosyası bulunamadı.');
    }
}

async function handleUrlLoad(url, playlistName) {
    try {
        // Stream URL'lerini direkt ekle
        if (url.includes('.m3u8') ||
            url.includes('.ts') ||
            url.includes('/live/') ||
            url.includes('/stream') ||
            url.includes('/play/') ||
            url.includes('/iptv/') ||
            url.match(/:\d+\//) ||
            url.includes('/hls/')) {

            const channelName = playlistName || 'Yeni Kanal';
            const m3uContent = `#EXTM3U\n#EXTINF:-1,${channelName}\n${url}\n`;

            addNewPlaylist(playlistName || 'Yeni Playlist', m3uContent);
            hideModal(elements.uploadModal);
            clearModalInputs();
            return;
        }

        // Playlist URL'leri için fetch işlemi (cache bypass)
        const cacheBypassUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
        const response = await fetch(cacheBypassUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();

        if (content.includes('#EXTINF') || content.includes('#EXT-X-') ||
            content.includes('[playlist]') || content.includes('<playlist') ||
            content.includes('<asx') || content.includes('FILE ')) {
            addNewPlaylist(playlistName || 'URL Playlist', content);
        } else {
            // Stream URL'ini direkt ekle
            const channelName = playlistName || 'Yeni Kanal';
            const m3uContent = `#EXTM3U\n#EXTINF:-1,${channelName}\n${url}\n`;
            addNewPlaylist(playlistName || 'Yeni Playlist', m3uContent);
        }

        hideModal(elements.uploadModal);
        clearModalInputs();

    } catch (error) {
        console.log('URL erişimi başarısız:', error.message);

        // URL'yi direkt stream linki olarak ekle
        const channelName = playlistName || 'Yeni Kanal';
        const m3uContent = `#EXTM3U\n#EXTINF:-1,${channelName}\n${url}\n`;
        addNewPlaylist(playlistName || 'Yeni Playlist', m3uContent);

        hideModal(elements.uploadModal);
        clearModalInputs();
    }
}



// Storage - LocalStorage işlemleri
import { STORAGE_KEYS } from './config.js';

export function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('localStorage kaydetme hatası:', error);
    }
}

export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('localStorage yükleme hatası:', error);
        return defaultValue;
    }
}

export function savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter) {
    saveToLocalStorage(STORAGE_KEYS.PLAYLISTS, playlists);
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST, activePlaylistIndex);
    saveToLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, playlistCounter);
}

export function saveLastSelectedChannel(selectedItem, activePlaylistIndex) {
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

export function loadPlaylistsFromStorage() {
    const savedPlaylists = loadFromLocalStorage(STORAGE_KEYS.PLAYLISTS, []);
    const savedActiveIndex = loadFromLocalStorage(STORAGE_KEYS.ACTIVE_PLAYLIST, -1);
    const savedCounter = loadFromLocalStorage(STORAGE_KEYS.PLAYLIST_COUNTER, 0);

    return {
        playlists: savedPlaylists,
        activePlaylistIndex: savedActiveIndex,
        playlistCounter: savedCounter,
        hasData: savedPlaylists.length > 0
    };
}

export function getLastSelectedChannel() {
    return loadFromLocalStorage(STORAGE_KEYS.LAST_CHANNEL);
}

// Tüm storage verilerini temizle
export function clearAllStoredData() {
    try {
        // Cache'i temizle
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        console.log('Cache temizlendi.');
    } catch (error) {
        console.error('Cache temizleme hatası:', error);
    }
}

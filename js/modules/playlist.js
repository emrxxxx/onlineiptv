// Playlist - Playlist yönetimi
import { savePlaylistsToStorage } from './storageManager.js';
import { elements } from './ui.js';
import { playChannel } from './player.js';
import { setChannelItems } from './search.js';
import { BATCH_SIZE } from './config.js';
import { getFileExtension } from './utils.js';

let playlists = [];
let activePlaylistIndex = -1;
let playlistCounter = 0;
let allChannelItems = [];
let currentSelectedChannelIndex = -1;

let isRenderingChannels = false;
let renderQueue = [];

export function setPlaylistData(playlistsData, activeIndex, counter) {
    playlists = playlistsData;
    activePlaylistIndex = activeIndex;
    playlistCounter = counter;
}

export function getPlaylistData() {
    return {
        playlists,
        activePlaylistIndex,
        playlistCounter,
        allChannelItems,
        currentSelectedChannelIndex
    };
}

export function updatePlaylistSelector() {
    elements.playlistSelector.innerHTML = '';

    playlists.forEach(playlist => {
        addPlaylistToSelector(playlist);
    });

    if (playlists.length > 0 && (activePlaylistIndex === -1 || activePlaylistIndex >= playlists.length)) {
        switchToPlaylist(0);
    }
}

export function addPlaylistToSelector(playlist) {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = playlist.name;
    elements.playlistSelector.appendChild(option);
}

export function switchToPlaylist(index) {
    if (index < 0 || index >= playlists.length) return;

    activePlaylistIndex = index;
    currentSelectedChannelIndex = -1;
    elements.playlistSelector.value = playlists[index].id;
    displayChannels(playlists[index].channels);
    updatePlaylistActionButtons();

    savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
}

export function displayChannels(channels) {
    if (isRenderingChannels) {
        renderQueue.push(channels);
        return;
    }

    elements.playlistElement.innerHTML = '';
    currentSelectedChannelIndex = -1;
    allChannelItems = [];

    if (channels.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "M3U dosyasında/URL'sinde kanal bulunamadı.";
        elements.playlistElement.appendChild(listItem);
        elements.searchInput.value = '';
        return;
    }

    if (channels.length > 1000) {
        displayChannelsOptimized(channels);
    } else {
        displayChannelsNormal(channels);
    }

    // Search modülüne channel items'ları gönder
    setChannelItems(allChannelItems);
}

function displayChannelsNormal(channels) {
    const groupedChannels = groupChannelsByGroup(channels);
    
    Object.keys(groupedChannels).forEach(groupName => {
        if (groupName && groupName !== 'undefined') {
            const groupHeader = createGroupHeader(groupName);
            elements.playlistElement.appendChild(groupHeader);
        }

        groupedChannels[groupName].forEach(channel => {
            const listItem = createChannelListItem(channel);
            elements.playlistElement.appendChild(listItem);
            allChannelItems.push(listItem);
        });
    });
}

function displayChannelsOptimized(channels) {
    isRenderingChannels = true;
    const groupedChannels = groupChannelsByGroup(channels);
    const groups = Object.keys(groupedChannels);
    let currentGroupIndex = 0;
    let currentChannelIndex = 0;

    function renderBatch() {
        const startTime = performance.now();
        
        while (currentGroupIndex < groups.length && (performance.now() - startTime) < 16) {
            const groupName = groups[currentGroupIndex];
            const groupChannels = groupedChannels[groupName];

            if (currentChannelIndex === 0 && groupName && groupName !== 'undefined') {
                const groupHeader = createGroupHeader(groupName);
                elements.playlistElement.appendChild(groupHeader);
            }

            const endIndex = Math.min(currentChannelIndex + BATCH_SIZE, groupChannels.length);
            
            for (let i = currentChannelIndex; i < endIndex; i++) {
                const channel = groupChannels[i];
                const listItem = createChannelListItem(channel);
                elements.playlistElement.appendChild(listItem);
                allChannelItems.push(listItem);
            }

            currentChannelIndex = endIndex;

            if (currentChannelIndex >= groupChannels.length) {
                currentGroupIndex++;
                currentChannelIndex = 0;
            }
        }

        if (currentGroupIndex < groups.length) {
            requestAnimationFrame(renderBatch);
        } else {
            isRenderingChannels = false;
            setChannelItems(allChannelItems);
            
            if (renderQueue.length > 0) {
                const nextChannels = renderQueue.shift();
                displayChannels(nextChannels);
            }
        }
    }

    renderBatch();
}

function groupChannelsByGroup(channels) {
    const grouped = {};
    
    channels.forEach(channel => {
        const group = channel.group || 'Diğer';
        if (!grouped[group]) {
            grouped[group] = [];
        }
        grouped[group].push(channel);
    });

    return grouped;
}

function createGroupHeader(groupName) {
    const groupHeader = document.createElement('li');
    groupHeader.className = 'group-header';
    groupHeader.innerHTML = `<strong>${groupName}</strong>`;
    return groupHeader;
}

function createChannelListItem(channel) {
    const listItem = document.createElement('li');
    listItem.className = 'channel-item';
    listItem.dataset.url = channel.url;

    // Kanal simgesi oluştur
    const channelIcon = createChannelIcon(channel);

    listItem.innerHTML = `
        ${channelIcon}
        <span class="channel-name">${channel.name}</span>
        <div class="channel-buttons">
            <button class="channel-btn delete-btn" title="Kanalı sil">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        </div>
    `;

    // Click events
    listItem.addEventListener('click', (event) => {
        const target = event.target;

        // Delete button
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

        // Normal channel click (tek tıklama) - hemen oynat
        selectChannel(listItem);
        playChannel(channel.url);
    });

    // Double click event for editing
    listItem.addEventListener('dblclick', (event) => {
        // Delete button'a çift tıklama yapılmışsa düzenleme yapma
        if (event.target.closest('.delete-btn')) {
            return;
        }

        const channelNameSpan = listItem.querySelector('.channel-name');
        enableChannelNameEdit(listItem, channelNameSpan);
    });

    return listItem;
}

function createChannelIcon(channel) {
    if (channel.logo && channel.logo.trim()) {
        // Logo varsa img elementi oluştur
        return `<img class="channel-icon" src="${channel.logo}" alt="${channel.name}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload="this.classList.add('loaded')">
                <div class="channel-icon channel-icon-fallback" style="display: none;">
                    ${getChannelInitials(channel.name)}
                </div>`;
    } else {
        // Logo yoksa fallback icon
        return `<div class="channel-icon channel-icon-fallback">
                    ${getChannelInitials(channel.name)}
                </div>`;
    }
}

function getChannelInitials(channelName) {
    // Kanal adından baş harfleri al (maksimum 2 karakter)
    const words = channelName.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        return words[0][0].toUpperCase();
    }
}

function selectChannel(listItem) {
    // Önceki seçimi kaldır
    const previouslySelected = elements.playlistElement.querySelector('li.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    // Yeni seçimi yap
    listItem.classList.add('selected');

    // Performanslı scroll
    requestAnimationFrame(() => {
        listItem.scrollIntoView({
            behavior: 'auto', // smooth yerine auto (daha performanslı)
            block: 'nearest' // center yerine nearest (daha az hareket)
        });
    });
}

export function updatePlaylistActionButtons() {
    const hasSelectedPlaylist = playlists.length > 0 && activePlaylistIndex >= 0;
    elements.renamePlaylistBtn.disabled = !hasSelectedPlaylist;
    elements.deletePlaylistBtn.disabled = !hasSelectedPlaylist;
}

// Varsayılan playlist yükleme
export async function loadDefaultPlaylist(defaultUrl, isRefresh = false) {
    console.log('Varsayılan M3U URL yükleniyor:', defaultUrl);
    try {
        // Cache bypass: no-store ve benzersiz query parametresi ekle
        const cacheBypassUrl = `${defaultUrl}${defaultUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
        const response = await fetch(cacheBypassUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();

        // Yenileme durumunda mevcut varsayılan playlist'i bul ve kaldır
        if (isRefresh) {
            const defaultPlaylistIndex = playlists.findIndex(p => p.name === 'Varsayılan');
            if (defaultPlaylistIndex !== -1) {
                playlists.splice(defaultPlaylistIndex, 1);

                // Eğer silinen playlist aktif olan ise, activePlaylistIndex'i güncelle
                if (activePlaylistIndex === defaultPlaylistIndex) {
                    activePlaylistIndex = -1;
                } else if (activePlaylistIndex > defaultPlaylistIndex) {
                    activePlaylistIndex--;
                }
            }

            // Playlist seçiciyi temizle ve yeniden oluştur
            elements.playlistSelector.innerHTML = '';
            playlists.forEach(playlist => {
                addPlaylistToSelector(playlist);
            });
        }

        addNewPlaylist('Varsayılan', content);
        console.log('Varsayılan M3U listesi başarıyla yüklendi.');
    } catch (error) {
        console.error('Varsayılan M3U URL yüklenirken hata oluştu:', error);
        elements.playlistElement.innerHTML = '';
        const listItem = document.createElement('li');
        listItem.textContent = `Varsayılan URL yüklenemedi: ${error.message}`;
        listItem.style.color = 'red';
        elements.playlistElement.appendChild(listItem);
    }
}

export function addNewPlaylist(name, content) {
    playlistCounter++;
    const playlist = {
        id: playlistCounter,
        name: name,
        channels: parsePlaylistContent(content, name)
    };

    playlists.push(playlist);
    addPlaylistToSelector(playlist);
    switchToPlaylist(playlists.length - 1);

    savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
}

function parsePlaylistContent(content, filename = '') {
    const extension = getFileExtension(filename);

    if (extension === 'm3u' || extension === 'm3u8' || content.includes('#EXTINF') || content.includes('#EXT-X-')) {
        return parseM3uContent(content, false);
    }

    // Diğer formatlar için basit fallback
    return parseM3uContent(content, false);
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
            const match = trimmedLine.match(/#EXTINF:(-?\d+)\s+(.+?),(.+)/);
            if (match) {
                const attributes = match[2].trim();
                const channelName = match[3].trim();

                currentChannel = {
                    duration: parseInt(match[1], 10),
                    attributes: attributes,
                    name: channelName,
                    url: null,
                    group: 'Genel',
                    logo: null
                };

                // Group title parsing
                const groupMatch = attributes.match(/group-title="([^"]*?)"/);
                if (groupMatch) {
                    currentChannel.group = groupMatch[1];
                }

                if (!groupMatch) {
                    const bracketMatch = attributes.match(/\[([^\]]*?)\]/);
                    if (bracketMatch) {
                        currentChannel.group = bracketMatch[1];
                    }
                }

                // Logo parsing
                const logoMatch = attributes.match(/tvg-logo="([^"]*?)"/);
                if (logoMatch) {
                    currentChannel.logo = logoMatch[1];
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

    return channels;
}

// Kanal silme fonksiyonu
export function removeChannelFromPlaylist(channelUrl) {
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const playlist = playlists[activePlaylistIndex];
    const channelIndex = playlist.channels.findIndex(channel => channel.url === channelUrl);

    if (channelIndex !== -1) {
        playlist.channels.splice(channelIndex, 1);
        displayChannels(playlist.channels);
        savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
        console.log('Kanal playlist\'ten silindi:', channelUrl);
    }
}

// Kanal yeniden adlandırma fonksiyonu
export function renameChannel(channelUrl, newName) {
    if (activePlaylistIndex === -1 || !playlists[activePlaylistIndex]) return;

    const playlist = playlists[activePlaylistIndex];
    const channel = playlist.channels.find(ch => ch.url === channelUrl);

    if (channel) {
        channel.name = newName;
        displayChannels(playlist.channels);
        savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
        console.log('Kanal ismi değiştirildi:', newName);
    }
}

// Kanal adı düzenleme UI fonksiyonu
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

    // Klavye kısayollarını devre dışı bırak
    document.body.classList.add('editing-mode');

    function finishEdit(save = true) {
        const newName = input.value.trim();
        input.remove();
        channelNameSpan.style.display = '';

        // Klavye kısayollarını tekrar aktif et
        document.body.classList.remove('editing-mode');

        if (save && newName && newName !== currentName) {
            renameChannel(channelUrl, newName);
        }
    }

    input.addEventListener('keypress', (e) => {
        e.stopPropagation(); // Event bubbling'i durdur
        if (e.key === 'Enter') {
            finishEdit(true);
        }
    });

    input.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Event bubbling'i durdur
        if (e.key === 'Escape') {
            finishEdit(false);
        }
    });

    input.addEventListener('blur', () => {
        finishEdit(true);
    });
}

// Playlist silme fonksiyonu
export function removePlaylist(playlistId) {
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index === -1) return;

    // Playlist selector'dan option'ı kaldır
    const option = elements.playlistSelector.querySelector(`option[value="${playlistId}"]`);
    if (option) option.remove();

    // Playlist'i diziden kaldır
    playlists.splice(index, 1);

    // Aktif playlist kontrolü
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
    savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
    console.log('Playlist silindi:', playlistId);
}

// Playlist yeniden adlandırma fonksiyonu
export function renamePlaylist(playlistId, newName) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        playlist.name = newName;

        // Playlist selector'daki option'ı güncelle
        const option = elements.playlistSelector.querySelector(`option[value="${playlistId}"]`);
        if (option) {
            let displayName = newName;
            if (displayName.length > 25) {
                displayName = displayName.substring(0, 22) + '...';
            }

            option.textContent = displayName;
            option.title = newName;
        }

        savePlaylistsToStorage(playlists, activePlaylistIndex, playlistCounter);
        console.log('Playlist yeniden adlandırıldı:', newName);
    }
}

// Hızlı scroll için wheel event optimizasyonu
export function initializeFastScroll() {
    const playlistElement = elements.playlistElement;

    // Wheel event'ini optimize et - sadece hızlandır, iptal etme
    playlistElement.addEventListener('wheel', (event) => {
        // Scroll miktarını artır (daha hızlı scroll)
        const scrollMultiplier = 3; // 3x daha hızlı
        const scrollAmount = event.deltaY * scrollMultiplier;

        // Mevcut scroll pozisyonunu al
        const currentScrollTop = playlistElement.scrollTop;
        const maxScrollTop = playlistElement.scrollHeight - playlistElement.clientHeight;

        // Yeni scroll pozisyonunu hesapla
        const newScrollTop = Math.max(0, Math.min(maxScrollTop, currentScrollTop + scrollAmount));

        // Eğer scroll yapılabiliyorsa, varsayılan davranışı iptal et ve hızlı scroll yap
        if (newScrollTop !== currentScrollTop) {
            event.preventDefault();
            playlistElement.scrollTop = newScrollTop;
        }
    }, { passive: false });

    // Touch scroll'u da optimize et (mobil için)
    let touchStartY = 0;
    let isScrolling = false;

    playlistElement.addEventListener('touchstart', (event) => {
        touchStartY = event.touches[0].clientY;
        isScrolling = false;
    }, { passive: true });

    playlistElement.addEventListener('touchmove', (event) => {
        if (!isScrolling) {
            isScrolling = true;
        }

        const touchY = event.touches[0].clientY;
        const deltaY = touchStartY - touchY;

        // Touch scroll'u da hızlandır
        const scrollMultiplier = 2.5; // 2.5x daha hızlı
        playlistElement.scrollTop += deltaY * scrollMultiplier;

        touchStartY = touchY;
    }, { passive: true });
}

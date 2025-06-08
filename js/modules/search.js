// Search - Arama fonksiyonları
import { SEARCH_DELAY } from './config.js';
import { elements } from './ui.js';

let searchTimeout;
let allChannelItems = [];

export function initializeSearch() {
    elements.searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, SEARCH_DELAY);
    });
}

export function setChannelItems(items) {
    allChannelItems = items;
}

function performSearch(searchTerm) {
    if (!searchTerm) {
        allChannelItems.forEach(item => {
            item.style.display = '';
        });
        const groupHeaders = elements.playlistElement.querySelectorAll('.group-header');
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
    const groupHeaders = elements.playlistElement.querySelectorAll('.group-header');
    groupHeaders.forEach(header => {
        header.style.display = visibleGroups.has(header) ? '' : 'none';
    });
}

export function clearSearch() {
    elements.searchInput.value = '';
    performSearch('');
}

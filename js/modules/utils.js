// Utils - Yardımcı fonksiyonlar
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS, PLAYLIST_EXTENSIONS } from './config.js';

export function getFileExtension(filename) {
    return filename.toLowerCase().split('.').pop();
}

export function isPlaylistFile(extension) {
    return PLAYLIST_EXTENSIONS.includes(extension);
}

export function isMediaFile(extension) {
    return VIDEO_EXTENSIONS.includes(extension) || AUDIO_EXTENSIONS.includes(extension);
}

export function isValidUrl(string) {
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

export function getMimeType(url, extension) {
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

// Cookie temizleme fonksiyonu
export function clearAllCookies() {
    try {
        const cookies = document.cookie.split(";");

        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

            if (name) {
                const domains = [window.location.hostname, '.' + window.location.hostname, 'localhost', '.localhost'];
                const paths = ['/', window.location.pathname];

                domains.forEach(domain => {
                    paths.forEach(path => {
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
                    });
                });

                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            }
        });

        console.log('Tüm cookie\'ler temizlendi');
    } catch (error) {
        console.error('Cookie temizleme hatası:', error);
    }
}

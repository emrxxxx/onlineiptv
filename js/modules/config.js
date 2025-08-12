// Constants - Uygulama sabitleri
export const STORAGE_KEYS = {
    PLAYLISTS: 'onlinetv_playlists',
    ACTIVE_PLAYLIST: 'onlinetv_active_playlist',
    LAST_CHANNEL: 'onlinetv_last_channel',
    PLAYLIST_COUNTER: 'onlinetv_playlist_counter'
};

export const VOLUME_STEP = 5;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;

export const SEARCH_DELAY = 300;
export const BATCH_SIZE = 50;

export const SWIPE_THRESHOLD = 50;
export const TAP_THRESHOLD = 10;
export const DOUBLE_TAP_THRESHOLD = 300;
export const VOLUME_DRAG_THRESHOLD = 5;

export const NAVIGATION_DELAY = 1;
export const MOUSE_HIDE_DELAY = 3000;

export const DEPLOYED_VERSION = '1.1.0';

export const DEFAULT_M3U_URL = 'https://raw.githubusercontent.com/emrcxcx/test/refs/heads/main/test.m3u';

// Video formatları
export const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'ogg', 'ogv', '3gp', 'mpg', 'mpeg', 'ts', 'mts', 'm2ts'];

// Audio formatları
export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg', 'oga', 'wma', 'opus'];

// Playlist formatları
export const PLAYLIST_EXTENSIONS = ['m3u', 'm3u8', 'pls', 'xspf', 'asx', 'wpl', 'cue', 'json'];

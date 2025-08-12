// Player - Video player yönetimi
import { getMimeType, getFileExtension } from './utils.js';
import { VOLUME_STEP, VOLUME_MIN, VOLUME_MAX } from './config.js';
import { showVolumeIndicator } from './ui.js';

// Player instance'ı global olarak tutacağız
export let player = null;
let channelChangeTimeout = null;
let isChangingChannel = false;

export function initializePlayer() {
    player = videojs('my-video', {
        controlBar: {
            audioTrackButton: true
        }
    });

    // Varsayılan ses türü ayarı
    player.on('loadedmetadata', function() {
        const audioTracks = player.audioTracks();
        if (audioTracks && audioTracks.length > 0) {
            // Tüm ses türlerini devre dışı bırak
            for (let i = 0; i < audioTracks.length; i++) {
                audioTracks[i].enabled = false;
            }
            // Türkçe ses türünü ara ve varsa etkinleştir
            let turkishTrack = Array.from(audioTracks).find(track => 
                track.language === 'tur' || 
                track.language === 'tr' || 
                track.label.toLowerCase().includes('türk') ||
                track.label.toLowerCase().includes('turk')
            );
            
            // Türkçe ses türü bulunamazsa ilk ses türünü etkinleştir
            if (turkishTrack) {
                turkishTrack.enabled = true;
                console.log('Türkçe ses türü etkinleştirildi:', turkishTrack.label);
            } else {
                audioTracks[0].enabled = true;
                console.log('İlk ses türü etkinleştirildi:', audioTracks[0].label);
            }
        }
    });

    // Fullscreen değişikliklerini dinle
    player.on('fullscreenchange', () => {
        const body = document.body;
        if (player.isFullscreen()) {
            body.classList.add('fullscreen-transition');
        } else {
            setTimeout(() => {
                body.classList.remove('fullscreen-transition');
            }, 50);
        }

        // Mevcut bildirimleri kaldır ve yeniden oluştur
        const existingIndicator = document.querySelector('.volume-indicator');
        if (existingIndicator && existingIndicator.parentNode) {
            const volume = player.volume() * 100;
            existingIndicator.remove();
            // showVolumeIndicator'ı UI modülünden import etmek yerine global çağır
            if (window.showVolumeIndicator) {
                window.showVolumeIndicator(volume, false);
            }
        }
    });

    return player;
}

export function playChannel(url, shouldMute = false) {
    if (!player) return;

    // Önceki kanal değiştirme işlemini iptal et
    if (channelChangeTimeout) {
        clearTimeout(channelChangeTimeout);
        channelChangeTimeout = null;
    }

    // Anında kanal değiştir - gecikme yok
    actuallyPlayChannel(url, shouldMute);
}

function actuallyPlayChannel(url, shouldMute = false) {
    if (!player) return;

    // Kanal değiştirme işlemi başladığını işaretle
    isChangingChannel = true;

    const urlParts = url.split('?')[0];
    const extension = getFileExtension(urlParts);
    const mimeType = getMimeType(url, extension);

    console.log(`Playing: ${url}, Extension: ${extension}, MIME Type: ${mimeType}`);

    // Hızlı kanal değiştirme için mevcut oynatmayı hemen durdur
    player.pause();

    // Video.js'e source'u ayarla ve hemen oynat
    player.src({
        src: url,
        type: mimeType
    });

    if (shouldMute) {
         player.muted(true);
    }

    // Stream türüne göre bilgi ver
    if (mimeType === 'application/x-mpegURL') {
        console.log('HLS stream yükleniyor:', url);
    }

    if (mimeType === 'application/dash+xml') {
        console.log('DASH stream yükleniyor:', url);
    }

    // Hemen oynatmayı başlat
    const playPromise = player.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error('Oynatma hatası:', error);
            // Hata durumunda alternatif mime type dene
            if (mimeType === 'application/x-mpegURL') {
                console.log('HLS oynatma başarısız, video/mp4 olarak deneniyor...');
                player.src({
                    src: url,
                    type: 'video/mp4'
                });
                player.play().catch(err => {
                    console.error('Alternatif oynatma da başarısız:', err);
                });
            }
        }).finally(() => {
            // Kanal değiştirme işlemi tamamlandı
            isChangingChannel = false;
        });
    } else {
        // Kanal değiştirme işlemi tamamlandı
        isChangingChannel = false;
    }
}

export function adjustVolume(direction) {
    if (!player) return;
    
    let currentVolume = player.volume() * 100;

    if (direction === 'up') {
        currentVolume = Math.min(currentVolume + VOLUME_STEP, VOLUME_MAX);
    } else {
        currentVolume = Math.max(currentVolume - VOLUME_STEP, VOLUME_MIN);
    }

    player.volume(currentVolume / 100);
    showVolumeIndicator(currentVolume, false);
}

export function togglePlayPause() {
    if (!player) return;
    
    if (player.paused()) {
        player.play();
    } else {
        player.pause();
    }
}

export function toggleMute() {
    if (!player) return;

    player.muted(!player.muted());
}

export function toggleFullscreen() {
    if (!player) return;

    if (!document.fullscreenElement) {
        player.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

export function getPlayer() {
    return player;
}



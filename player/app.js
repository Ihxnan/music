// 音乐播放器应用
class MusicPlayer {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 0; // 0: 不重复, 1: 循环全部, 2: 循环单曲
        this.musicLibrary = [];
        this.artists = [];
        
        this.init();
    }
    
    async init() {
        await this.loadMusicLibrary();
        this.renderArtists();
        this.renderMusicList(this.musicLibrary);
        this.setupEventListeners();
        this.updatePlaylistCount();
    }
    
    // 加载音乐库
    async loadMusicLibrary() {
        // 显示加载状态
        const musicList = document.getElementById('musicList');
        const artistList = document.getElementById('artistList');
        musicList.innerHTML = '<div class="loading"><i class="bi bi-music-note"></i><p>正在加载音乐库...</p></div>';
        artistList.innerHTML = '<div class="loading"><i class="bi bi-music-note"></i><p>加载中...</p></div>';
        
        try {
            const response = await fetch('/api/music');
            const data = await response.json();
            this.musicLibrary = data.songs || [];
            this.artists = data.artists || [];
            console.log('音乐库加载成功:', this.musicLibrary.length, '首歌曲');
        } catch (error) {
            console.error('加载音乐库失败:', error);
            // 如果 API 不可用，使用示例数据
            this.loadSampleData();
        }
    }
    
    // 加载示例数据（用于演示）
    loadSampleData() {
        this.artists = [
            { name: 'YOASOBI', count: 86 },
            { name: 'ZUTOMAYO', count: 65 },
            { name: 'ヨルシカ', count: 84 },
            { name: 'MIKU', count: 6 },
            { name: 'Sayuri', count: 5 }
        ];
        
        this.musicLibrary = [
            { id: 1, title: '夜に駆ける', artist: 'YOASOBI', path: '../YOASOBI/夜に駆ける_YOASOBI_THE BOOK_320kbps.mp3' },
            { id: 2, title: 'アイドル', artist: 'YOASOBI', path: '../YOASOBI/アイドル_YOASOBI_THE BOOK 3_320kbps.mp3' },
            { id: 3, title: '群青', artist: 'YOASOBI', path: '../YOASOBI/群青_YOASOBI_THE BOOK_320kbps.mp3' },
            { id: 4, title: 'Blues in the Closet', artist: 'ZUTOMAYO', path: '../ZUTOMAYO/Blues in the Closet_ずっと真夜中でいいのに。_虚仮の一念海馬に託す_320kbps.mp3' },
            { id: 5, title: 'フロントメモリー', artist: 'ZUTOMAYO', path: '../ZUTOMAYO/フロントメモリー feat. ACAね(ずっと真夜中でいいのに。)_神聖かまってちゃん  ACAね_フロントメモリー feat. ACAね(ずっと真夜中でいいのに。)_320kbps.mp3' },
            { id: 6, title: '花に亡霊', artist: 'ヨルシカ', path: '../ヨルシカ/花に亡霊_ヨルシカ_創作_320kbps.mp3' },
            { id: 7, title: '幽霊東京', artist: 'ヨルシカ', path: '../ヨルシカ/幽霊東京_ヨルシカ_創作_320kbps.mp3' },
            { id: 8, title: 'あの夢をなぞって', artist: 'MIKU', path: '../MIKU/02 あの夢をなぞって.flac' },
            { id: 9, title: 'ハルジオン', artist: 'MIKU', path: '../MIKU/03 ハルジオン.flac' },
            { id: 10, title: 'フラレガイガール', artist: 'Sayuri', path: '../Sayuri/Sayuri - フラレガイガール.ogg' }
        ];
        
        console.log('使用示例数据:', this.musicLibrary.length, '首歌曲');
    }
    
    // 渲染艺术家列表
    renderArtists() {
        const artistList = document.getElementById('artistList');
        artistList.innerHTML = `
            <div class="artist-item active" data-artist="all">
                <div class="artist-icon">
                    <i class="bi bi-music-note-list"></i>
                </div>
                <div class="artist-info">
                    <div class="artist-name">全部音乐</div>
                    <div class="artist-count">${this.musicLibrary.length} 首</div>
                </div>
            </div>
        `;
        
        this.artists.forEach(artist => {
            const artistItem = document.createElement('div');
            artistItem.className = 'artist-item';
            artistItem.dataset.artist = artist.name;
            artistItem.innerHTML = `
                <div class="artist-icon">
                    <i class="bi bi-person"></i>
                </div>
                <div class="artist-info">
                    <div class="artist-name">${artist.name}</div>
                    <div class="artist-count">${artist.count} 首</div>
                </div>
            `;
            artistList.appendChild(artistItem);
        });
        
        // 添加点击事件
        document.querySelectorAll('.artist-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.artist-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const artist = item.dataset.artist;
                this.filterByArtist(artist);
            });
        });
    }
    
    // 按艺术家筛选
    filterByArtist(artist) {
        const title = document.getElementById('currentViewTitle');
        if (artist === 'all') {
            title.textContent = '全部音乐';
            this.renderMusicList(this.musicLibrary);
        } else {
            title.textContent = artist;
            const filtered = this.musicLibrary.filter(song => song.artist === artist);
            this.renderMusicList(filtered);
        }
    }
    
    // 渲染音乐列表
    renderMusicList(songs) {
        const musicList = document.getElementById('musicList');
        
        if (songs.length === 0) {
            musicList.innerHTML = '<div class="loading"><i class="bi bi-music-note"></i><p>暂无音乐</p></div>';
            return;
        }
        
        musicList.innerHTML = '';
        songs.forEach((song, index) => {
            const musicItem = document.createElement('div');
            musicItem.className = 'music-item';
            musicItem.dataset.songId = song.id;
            musicItem.innerHTML = `
                <div class="song-number">${index + 1}</div>
                <div class="song-icon">
                    <i class="bi bi-music-note"></i>
                </div>
                <div class="song-details">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
                <div class="song-actions">
                    <button class="btn btn-outline-primary btn-sm play-song-btn" title="播放">
                        <i class="bi bi-play-fill"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm download-btn" title="下载">
                        <i class="bi bi-download"></i>
                    </button>
                </div>
            `;
            
            // 播放按钮
            musicItem.querySelector('.play-song-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.playSong(song);
            });
            
            // 下载按钮
            musicItem.querySelector('.download-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadSong(song);
            });
            
            // 点击整个项目
            musicItem.addEventListener('click', () => {
                this.playSong(song);
            });
            
            musicList.appendChild(musicItem);
        });
    }
    
    // 播放歌曲
    playSong(song) {
        this.currentTrack = song;
        // 通过服务器的 /music/ 路由访问音乐文件
        this.audioPlayer.src = `/music/${song.artist}/${encodeURIComponent(song.filename)}`;
        this.audioPlayer.play();
        this.isPlaying = true;
        
        // 更新播放状态
        this.updatePlayButton();
        this.updateNowPlaying();
        this.updateMusicListHighlight();
        
        // 添加到播放列表（如果不在列表中）
        if (!this.playlist.find(s => s.id === song.id)) {
            this.playlist.push(song);
            this.updatePlaylistCount();
        }
    }
    
    // 更新播放按钮
    updatePlayButton() {
        const playBtn = document.getElementById('playPauseBtn');
        if (this.isPlaying) {
            playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
        } else {
            playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
    }
    
    // 更新当前播放信息
    updateNowPlaying() {
        if (this.currentTrack) {
            document.getElementById('currentTrackName').textContent = this.currentTrack.title;
            document.getElementById('currentTrackArtist').textContent = this.currentTrack.artist;
        }
    }
    
    // 更新音乐列表高亮
    updateMusicListHighlight() {
        document.querySelectorAll('.music-item').forEach(item => {
            item.classList.remove('playing');
            if (item.dataset.songId == this.currentTrack?.id) {
                item.classList.add('playing');
            }
        });
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 播放/暂停按钮
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });
        // 添加触摸支持
        playPauseBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.togglePlayPause();
        });

        // 上一首
        const prevBtn = document.getElementById('prevBtn');
        prevBtn.addEventListener('click', () => {
            this.playPrevious();
        });
        prevBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.playPrevious();
        });

        // 下一首
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.addEventListener('click', () => {
            this.playNext();
        });
        nextBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.playNext();
        });

        // 随机播放
        const shuffleBtn = document.getElementById('shuffleBtn');
        const shuffleControlBtn = document.getElementById('shuffleControlBtn');
        
        shuffleBtn.addEventListener('click', () => {
            this.toggleShuffle();
        });
        shuffleBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.toggleShuffle();
        });
        
        shuffleControlBtn.addEventListener('click', () => {
            this.toggleShuffle();
        });
        shuffleControlBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.toggleShuffle();
        });

        // 循环模式
        const repeatBtn = document.getElementById('repeatBtn');
        repeatBtn.addEventListener('click', () => {
            this.toggleRepeat();
        });
        repeatBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.toggleRepeat();
        });

        // 音量控制
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            this.audioPlayer.volume = e.target.value / 100;
            this.updateVolumeIcon(e.target.value);
        });

        // 进度条 - 同时支持点击和触摸
        const progress = document.querySelector('.progress');
        const handleProgressSeek = (e) => {
            const rect = progress.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
        };

        progress.addEventListener('click', handleProgressSeek);
        progress.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleProgressSeek(e);
        });

        // 进度条拖动支持
        let isDragging = false;
        progress.addEventListener('mousedown', () => isDragging = true);
        progress.addEventListener('touchstart', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('touchend', () => isDragging = false);
        progress.addEventListener('mousemove', (e) => {
            if (isDragging) handleProgressSeek(e);
        });
        progress.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                handleProgressSeek(e);
            }
        });

        // 音频事件
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audioPlayer.addEventListener('ended', () => {
            this.onTrackEnd();
        });

        this.audioPlayer.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });

        this.audioPlayer.addEventListener('error', () => {
            console.error('音频加载失败:', this.currentTrack);
            // 自动跳到下一首
            this.playNext();
        });

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchMusic(e.target.value);
            }, 300);
        });

        // 播放列表按钮
        const playlistBtn = document.getElementById('playlistBtn');
        playlistBtn.addEventListener('click', () => {
            this.showPlaylist();
        });
        playlistBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.showPlaylist();
        });

        // 防止移动端双击缩放
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });

        // 处理移动端屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // 重新计算布局
                window.scrollTo(0, 0);
            }, 100);
        });
    }
    
    // 切换播放/暂停
    togglePlayPause() {
        if (!this.currentTrack) {
            if (this.musicLibrary.length > 0) {
                this.playSong(this.musicLibrary[0]);
            }
            return;
        }
        
        if (this.isPlaying) {
            this.audioPlayer.pause();
            this.isPlaying = false;
        } else {
            this.audioPlayer.play();
            this.isPlaying = true;
        }
        
        this.updatePlayButton();
    }
    
    // 上一首
    playPrevious() {
        if (this.playlist.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playSong(this.playlist[this.currentIndex]);
    }
    
    // 下一首
    playNext() {
        if (this.playlist.length === 0) return;
        
        if (this.isShuffle) {
            this.currentIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        
        this.playSong(this.playlist[this.currentIndex]);
    }
    
    // 切换随机播放
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const shuffleBtn = document.getElementById('shuffleControlBtn');
        const topShuffleBtn = document.getElementById('shuffleBtn');
        
        if (this.isShuffle) {
            shuffleBtn.classList.add('active');
            topShuffleBtn.classList.add('active');
        } else {
            shuffleBtn.classList.remove('active');
            topShuffleBtn.classList.remove('active');
        }
    }
    
    // 切换循环模式
    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        const repeatBtn = document.getElementById('repeatBtn');
        
        repeatBtn.classList.remove('active');
        repeatBtn.innerHTML = '<i class="bi bi-repeat"></i>';
        
        if (this.repeatMode === 1) {
            repeatBtn.classList.add('active');
            repeatBtn.innerHTML = '<i class="bi bi-repeat"></i>';
        } else if (this.repeatMode === 2) {
            repeatBtn.classList.add('active');
            repeatBtn.innerHTML = '<i class="bi bi-repeat-1"></i>';
        }
    }
    
    // 更新进度条
    updateProgress() {
        const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('currentTime').textContent = this.formatTime(this.audioPlayer.currentTime);
    }
    
    // 更新总时间
    updateTotalTime() {
        document.getElementById('totalTime').textContent = this.formatTime(this.audioPlayer.duration);
    }
    
    // 格式化时间
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 更新音量图标
    updateVolumeIcon(value) {
        const icon = document.getElementById('volumeIcon');
        if (value == 0) {
            icon.className = 'bi bi-volume-mute';
        } else if (value < 50) {
            icon.className = 'bi bi-volume-down';
        } else {
            icon.className = 'bi bi-volume-up';
        }
    }
    
    // 搜索音乐
    searchMusic(query) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        const results = this.musicLibrary.filter(song => 
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-item">未找到相关歌曲</div>';
            return;
        }
        
        resultsContainer.innerHTML = '';
        results.forEach(song => {
            const searchItem = document.createElement('div');
            searchItem.className = 'search-item';
            searchItem.innerHTML = `
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            `;
            searchItem.addEventListener('click', () => {
                this.playSong(song);
                resultsContainer.innerHTML = '';
                document.getElementById('searchInput').value = '';
            });
            resultsContainer.appendChild(searchItem);
        });
    }
    
    // 下载歌曲
    downloadSong(song) {
        const link = document.createElement('a');
        link.href = `/music/${song.artist}/${encodeURIComponent(song.filename)}`;
        link.download = `${song.artist} - ${song.title}`;
        link.click();
    }
    
    // 显示播放列表
    showPlaylist() {
        const modal = new bootstrap.Modal(document.getElementById('playlistModal'));
        const playlistItems = document.getElementById('playlistItems');
        
        playlistItems.innerHTML = '';
        
        if (this.playlist.length === 0) {
            playlistItems.innerHTML = '<div class="text-center text-muted py-4">播放列表为空</div>';
        } else {
            this.playlist.forEach((song, index) => {
                const item = document.createElement('div');
                item.className = 'playlist-item';
                if (this.currentTrack?.id === song.id) {
                    item.classList.add('current');
                }
                item.innerHTML = `
                    <div class="item-number">${index + 1}</div>
                    <div class="item-info">
                        <div class="item-title">${song.title}</div>
                        <div class="item-artist">${song.artist}</div>
                    </div>
                    <button class="btn btn-link item-remove" title="移除">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
                
                item.addEventListener('click', () => {
                    this.currentIndex = index;
                    this.playSong(song);
                    modal.hide();
                });
                
                item.querySelector('.item-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFromPlaylist(index);
                    this.showPlaylist();
                });
                
                playlistItems.appendChild(item);
            });
        }
        
        modal.show();
    }
    
    // 从播放列表移除
    removeFromPlaylist(index) {
        this.playlist.splice(index, 1);
        if (this.currentIndex >= index && this.currentIndex > 0) {
            this.currentIndex--;
        }
        this.updatePlaylistCount();
    }
    
    // 更新播放列表计数
    updatePlaylistCount() {
        document.getElementById('playlistCount').textContent = this.playlist.length;
    }
    
    // 曲目结束
    onTrackEnd() {
        if (this.repeatMode === 2) {
            // 循环单曲
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play();
        } else {
            // 播放下一首
            this.playNext();
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
});
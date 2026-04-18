// Course Video Player
import { APP_CONFIG } from './config.js';
import { authService } from './auth-service.js';

class CoursePlayer {
    constructor() {
        this.courseId = new URLSearchParams(window.location.search).get('id');
        this.courseData = null;
        this.currentVideoId = null;

        // DOM Elements
        this.video = document.getElementById('courseVideo');
        this.videoSource = document.getElementById('videoSource');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.progressSlider = document.getElementById('progressSlider');
        this.progressFilled = document.getElementById('progressFilled');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.playlistContainer = document.getElementById('playlistContainer');

        // Check auth and init
        this.init();
    }

    async init() {
        // 1. Check Authentication
        if (!authService.requireAuth()) {
            return;
        }

        if (!this.courseId) {
            alert('No course ID specified');
            window.location.href = '/subscription.html';
            return;
        }

        // 2. Fetch Course Data
        try {
            await this.fetchCourseData();
        } catch (error) {
            console.error('Failed to load course:', error);
            if (error.status === 403 || error.status === 401) {
                alert('You do not have access to this course. Please purchase it.');
                window.location.href = '/subscription.html';
            } else {
                alert('Error loading course. Please try again.');
            }
            return;
        }

        // 3. Initialize Player with Data
        this.loadCourseInfo();
        this.createPlaylist();

        // Load first video if available
        if (this.courseData.lessons && this.courseData.lessons.length > 0) {
            this.loadVideo(this.courseData.lessons[0]._id);
        }

        this.setupEventListeners();
        this.preventDownload();
    }

    async fetchCourseData() {
        const token = authService.getBackendToken();
        const response = await fetch(`${APP_CONFIG.apiUrl}/courses/${this.courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = new Error('Failed to fetch course');
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        if (data.success) {
            this.courseData = {
                ...data.data,
                lessons: data.data.lessonsData || []
            };
        } else {
            throw new Error(data.message || 'Failed to fetch course data');
        }
    }

    loadCourseInfo() {
        document.getElementById('courseIdDisplay').textContent = `ID: ${this.courseData.courseId || 'N/A'}`;
        document.getElementById('courseTitle').textContent = this.courseData.title;
        document.getElementById('courseDescription').textContent = this.courseData.description;
        // Format duration if it's an object {value, unit}
        const duration = this.courseData.estimatedDuration;
        document.getElementById('totalDuration').textContent = `${duration.value} ${duration.unit}`;
        document.getElementById('videoCount').textContent = `${this.courseData.lessons.length} lessons`;
        this.updatePlaylistProgress();
    }

    createPlaylist() {
        this.playlistContainer.innerHTML = '';

        this.courseData.lessons.forEach((lesson, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.dataset.videoId = lesson._id;

            // Format duration from minutes if needed, or use string
            const durationDisplay = typeof lesson.duration === 'number'
                ? `${lesson.duration}:00`
                : (lesson.duration || '10:00');

            item.innerHTML = `
                <div class="playlist-item-number">${index + 1}</div>
                <div class="playlist-item-thumbnail">
                    <img src="${lesson.videoThumbnail || 'https://via.placeholder.com/320x180?text=No+Thumbnail'}" alt="${lesson.title}">
                    <div class="play-overlay">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="playlist-item-info">
                    <h4>${lesson.title}</h4>
                    <span class="playlist-item-duration">${durationDisplay}</span>
                </div>
            `;

            item.addEventListener('click', () => this.loadVideo(lesson._id));
            this.playlistContainer.appendChild(item);
        });
    }

    loadVideo(videoId) {
        const lesson = this.courseData.lessons.find(l => l._id === videoId);
        if (!lesson) return;

        this.currentVideoId = videoId;

        // Update video source
        // Use a default video if URL is missing for testing
        this.videoSource.src = lesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        this.video.load();

        // Update video info
        document.getElementById('currentVideoTitle').textContent = lesson.title;
        document.getElementById('currentVideoDescription').textContent = lesson.description || '';

        // Update playlist active state
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.toggle('active', item.dataset.videoId === videoId);
        });

        this.updatePlaylistProgress();

        // Auto-play
        this.video.play().catch(e => console.log('Autoplay prevented:', e));
    }

    updatePlaylistProgress() {
        if (!this.courseData?.lessons) return;
        const currentIndex = this.courseData.lessons.findIndex(l => l._id === this.currentVideoId);
        document.getElementById('playlistProgress').textContent = `${currentIndex + 1} / ${this.courseData.lessons.length}`;
    }

    getNextVideoId() {
        const currentIndex = this.courseData.lessons.findIndex(l => l._id === this.currentVideoId);
        if (currentIndex !== -1 && currentIndex < this.courseData.lessons.length - 1) {
            return this.courseData.lessons[currentIndex + 1]._id;
        }
        return null;
    }

    setupEventListeners() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.video.addEventListener('click', () => this.togglePlayPause());

        // Progress
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.progressSlider.addEventListener('input', (e) => this.seek(e.target.value));

        // Volume
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Video events
        this.video.addEventListener('play', () => this.updatePlayPauseIcon(true));
        this.video.addEventListener('pause', () => this.updatePlayPauseIcon(false));
        this.video.addEventListener('loadedmetadata', () => this.updateDuration());
        this.video.addEventListener('ended', () => this.onVideoEnded());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    togglePlayPause() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    updatePlayPauseIcon(isPlaying) {
        this.playIcon.style.display = isPlaying ? 'none' : 'block';
        this.pauseIcon.style.display = isPlaying ? 'block' : 'none';
    }

    updateProgress() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        this.progressSlider.value = percent || 0;
        this.progressFilled.style.width = (percent || 0) + '%';
        this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
    }

    seek(percent) {
        const time = (percent / 100) * this.video.duration;
        this.video.currentTime = time;
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        this.volumeSlider.value = this.video.muted ? 0 : this.video.volume * 100;
    }

    setVolume(value) {
        this.video.volume = value / 100;
        this.video.muted = value == 0;
    }

    toggleFullscreen() {
        const wrapper = document.querySelector('.video-player-wrapper');
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.video.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    onVideoEnded() {
        const nextId = this.getNextVideoId();
        if (nextId) {
            setTimeout(() => {
                this.loadVideo(nextId);
            }, 1000);
        }
    }

    handleKeyboard(e) {
        if (document.activeElement.tagName === 'INPUT') return;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.video.currentTime = Math.max(0, this.video.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.video.volume = Math.min(1, this.video.volume + 0.1);
                this.volumeSlider.value = this.video.volume * 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.video.volume = Math.max(0, this.video.volume - 0.1);
                this.volumeSlider.value = this.video.volume * 100;
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
        }
    }

    preventDownload() {
        const wrapper = document.querySelector('.video-player-wrapper');
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        wrapper.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
                e.preventDefault();
                return false;
            }
        });
        this.video.style.userSelect = 'none';
        this.video.style.webkitUserSelect = 'none';
        this.video.style.msUserSelect = 'none';
        this.video.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CoursePlayer();
});

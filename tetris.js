class Tetris {
    constructor(canvasId) {
        // Fix: Add input validation
        if (!canvasId || !document.getElementById(canvasId)) {
            throw new Error('Invalid canvas ID provided');
        }
        
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Fix: Add proper error handling for canvas context
        if (!this.ctx) {
            throw new Error('Could not get 2D rendering context');
        }
        
        this.canvas.width = 400;
        this.canvas.height = 800;
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 40;
        
        this.board = this.createBoard();
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.userInfo = null;
        this.modalOpen = false;
        
        this.dropCounter = 0;
        this.dropInterval = 1500;
        this.lastTime = 0;
        
        this.colors = [
            '#000000', '#FF0000', '#00FF00', '#0000FF', 
            '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
        ];
        
        this.pieces = [
            [],
            [[[1,1,1,1]], [[1],[1],[1],[1]], [[1,1,1,1]], [[1],[1],[1],[1]]],
            [[[1,1],[1,1]]],
            [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]],
            [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]],
            [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]],
            [[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]],
            [[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]]
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupControls();
        this.setupAudio();
        this.spawnPiece();
        this.gameLoop();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupControls() {
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyP', 'KeyR', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        document.addEventListener('keydown', (e) => {
            // Prevent game controls when modal is open
            if (this.modalOpen) {
                return;
            }
            
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
                this.handleKeyPress(e.code);
            }
        });
    }
    
    handleKeyPress(code = '') {
        if (code === 'KeyR' && this.gameOver) {
            this.restart();
            return;
        }
        
        if (code === 'KeyP') {
            this.pause();
            return;
        }
        
        if (this.gameOver || this.isPaused) return;
        
        const actions = {
            'ArrowLeft': () => this.movePiece(-1, 0),
            'KeyA': () => this.movePiece(-1, 0),
            'ArrowRight': () => this.movePiece(1, 0),
            'KeyD': () => this.movePiece(1, 0),
            'ArrowDown': () => this.movePiece(0, 1),
            'KeyS': () => this.movePiece(0, 1),
            'ArrowUp': () => this.rotatePiece(),
            'KeyW': () => this.rotatePiece(),
            'Space': () => this.rotatePiece()
        };
        
        actions[code]?.();
    }
    
    setupAudio() {
        this.sounds = {
            move: document.getElementById('moveSFX'),
            rotate: document.getElementById('rotateSFX'),
            lineClear: document.getElementById('lineClearSFX'),
            drop: document.getElementById('dropSFX'),
            gameOver: document.getElementById('gameOverSFX')
        };
        
        this.isMuted = localStorage.getItem('tetrisMuted') === 'true';
        this.updateMuteButton();
        this.initializeAudioContext();
        this.createLineClearSounds();
        this.setupMusicPlaylist();
    }

    setupMusicPlaylist() {
        this.musicPlaylist = [
            { name: "Epic Adventure", url: "https://cdn.pixabay.com/audio/2025/02/14/audio_64c5ab0979.mp3" },
            { name: "Digital Dreams", url: "https://cdn.pixabay.com/audio/2024/12/18/audio_756b6ec597.mp3" },
            { name: "Retro Gaming", url: "https://cdn.pixabay.com/audio/2024/06/24/audio_5e108c4fc4.mp3" },
            { name: "Cosmic Journey", url: "https://cdn.pixabay.com/audio/2025/02/14/audio_963291a70a.mp3" }
        ];
        
        this.currentTrackIndex = -1;
        this.currentAudio = null;
        this.isPlaylistActive = false;
        this.musicPlaying = false;
        
        // Preload music tracks
        this.preloadedTracks = [];
        this.preloadMusic();
    }

    preloadMusic() {
        console.log('Preloading music tracks...');
        
        this.musicPlaylist.forEach((track, index) => {
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            audio.volume = 0.3;
            audio.loop = false;
            audio.preload = "auto";
            audio.src = track.url;
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`Preloaded: ${track.name}`);
                this.preloadedTracks[index] = audio;
            }, { once: true });
            
            audio.addEventListener('error', () => {
                console.warn(`Failed to preload: ${track.name}`);
                this.preloadedTracks[index] = null;
            }, { once: true });
            
            // Start loading
            audio.load();
        });
    }

    updateMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.title = this.isMuted ? 'Enable Sound' : 'Disable Sound';
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('tetrisMuted', this.isMuted.toString());
        this.updateMuteButton();
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else if (!this.gameOver && !this.isPaused) {
            this.playBackgroundMusic();
        }
    }

    playBackgroundMusic() {
        if (this.isMuted || this.isPlaylistActive) return;
        
        this.isPlaylistActive = true;
        this.playNextTrack();
    }

    playNextTrack() {
        if (this.isMuted || !this.isPlaylistActive) return;
        
        // Stop current track if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.removeEventListener('ended', this.handleTrackEnd);
            this.currentAudio.removeEventListener('error', this.handleTrackError);
            this.currentAudio = null;
        }
        
        // Move to next track
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicPlaylist.length;
        const track = this.musicPlaylist[this.currentTrackIndex];
        
        this.loadAndPlayTrack(track);
    }

    loadAndPlayTrack(track) {
        if (!track) return;
        
        const trackIndex = this.musicPlaylist.findIndex(t => t.name === track.name);
        let audio = this.preloadedTracks[trackIndex];
        
        // If preloaded audio exists and is ready, use it
        if (audio && audio.readyState >= 2) {
            console.log(`Using preloaded audio for: ${track.name}`);
            
            // Reset the audio to beginning
            audio.currentTime = 0;
            
            // Remove any existing event listeners to avoid duplicates
            audio.removeEventListener('ended', this.handleTrackEnd);
            audio.removeEventListener('error', this.handleTrackError);
            
            this.handleTrackEnd = () => {
                console.log(`Track ended: ${track.name}`);
                if (this.isPlaylistActive && !this.gameOver && !this.isPaused) {
                    // Wait a bit before playing next track to ensure clean transition
                    setTimeout(() => this.playNextTrack(), 500);
                }
            };
            
            this.handleTrackError = () => {
                console.log(`Playback failed for ${track.name}, trying next track`);
                if (this.isPlaylistActive) {
                    setTimeout(() => this.playNextTrack(), 1000);
                }
            };
            
            audio.addEventListener('ended', this.handleTrackEnd, { once: true });
            audio.addEventListener('error', this.handleTrackError, { once: true });
            
            this.currentAudio = audio;
            
            if (this.isPlaylistActive && !this.isMuted) {
                audio.play().then(() => {
                    console.log(`Now playing: ${track.name}`);
                    this.updateNowPlaying(track.name);
                    this.musicPlaying = true;
                }).catch(error => {
                    console.log('Playback failed:', error);
                    this.handleTrackError();
                });
            }
        } else {
            // Fallback to original loading method
            console.log(`Preloaded audio not ready, loading fresh: ${track.name}`);
            this.loadTrackFresh(track);
        }
    }

    loadTrackFresh(track) {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.volume = 0.3;
        audio.loop = false;
        audio.src = track.url;
        
        this.handleTrackEnd = () => {
            console.log(`Fresh track ended: ${track.name}`);
            if (this.isPlaylistActive && !this.gameOver && !this.isPaused) {
                setTimeout(() => this.playNextTrack(), 500);
            }
        };
        
        this.handleTrackError = () => {
            console.log(`Failed to load ${track.name}, trying next track`);
            if (this.isPlaylistActive) {
                setTimeout(() => this.playNextTrack(), 1000);
            }
        };
        
        audio.addEventListener('ended', this.handleTrackEnd, { once: true });
        audio.addEventListener('error', this.handleTrackError, { once: true });
        
        audio.addEventListener('canplaythrough', () => {
            if (this.isPlaylistActive && !this.isMuted) {
                audio.play().then(() => {
                    console.log(`Now playing: ${track.name}`);
                    this.updateNowPlaying(track.name);
                    this.musicPlaying = true;
                }).catch(error => {
                    console.log('Playback failed:', error);
                    this.handleTrackError();
                });
            }
        }, { once: true });
        
        this.currentAudio = audio;
        audio.load();
    }

    // Remove melody-based music system
    playMelodyLoop() {
        // This method is no longer used - replaced by playlist system
    }

    stopBackgroundMusic() {
        this.isPlaylistActive = false;
        this.musicPlaying = false;
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            // Clean up event listeners but don't destroy the audio object
            if (this.handleTrackEnd) {
                this.currentAudio.removeEventListener('ended', this.handleTrackEnd);
            }
            if (this.handleTrackError) {
                this.currentAudio.removeEventListener('error', this.handleTrackError);
            }
            this.currentAudio = null;
        }
        
        this.updateNowPlaying('');
    }

    createLineClearSounds() {
        // Create different sounds for different line clear counts
        this.lineClearSounds = {
            1: { frequency: 523.25, duration: 0.3 }, // C5
            2: { frequency: 659.25, duration: 0.4 }, // E5
            3: { frequency: 783.99, duration: 0.5 }, // G5
            4: { frequency: 1046.50, duration: 0.8 } // C6 (Tetris!)
        };
    }

    playLineClearSound(linesCleared) {
        if (!this.audioContext || this.isMuted) return;
        
        const soundData = this.lineClearSounds[linesCleared];
        if (!soundData) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = linesCleared === 4 ? 'sawtooth' : 'square';
        oscillator.frequency.setValueAtTime(soundData.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.1, this.audioContext.currentTime + soundData.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + soundData.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + soundData.duration);
        
        // Add harmony for Tetris (4 lines)
        if (linesCleared === 4) {
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const harmonyOsc = this.audioContext.createOscillator();
                const harmonyGain = this.audioContext.createGain();
                
                harmonyOsc.type = 'square';
                harmonyOsc.frequency.setValueAtTime(soundData.frequency * 1.5, this.audioContext.currentTime);
                
                harmonyGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                harmonyGain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
                harmonyGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
                
                harmonyOsc.connect(harmonyGain);
                harmonyGain.connect(this.masterGain);
                
                harmonyOsc.start(this.audioContext.currentTime);
                harmonyOsc.stop(this.audioContext.currentTime + 0.4);
            }, 100);
        }
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.4;
            
            const startAudioContext = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            };
            
            document.addEventListener('click', startAudioContext, { once: true });
            document.addEventListener('keydown', startAudioContext, { once: true });
            
        } catch (error) {
            console.warn('Web Audio API not supported');
            this.audioContext = null;
            this.masterGain = null;
        }
    }
    
    spawnPiece() {
        const pieceType = Math.floor(Math.random() * 7) + 1;
        this.currentPiece = {
            type: pieceType,
            shape: this.pieces[pieceType][0],
            x: Math.floor(this.BOARD_WIDTH / 2) - 1,
            y: 0,
            rotation: 0
        };
        
        if (this.collision()) {
            this.gameOver = true;
            this.playSound('gameOver');
            this.stopBackgroundMusic();
            if (this.score > 0) {
                setTimeout(() => this.showGameOverModal(), 1000);
            }
        }
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.playSound('drop');
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
            }
        } else {
            // Play appropriate sound based on movement direction
            if (dx !== 0) {
                this.playSound('move');
            } else if (dy > 0) {
                // Play move sound for downward movement
                this.playSound('move');
            }
        }
    }
    
    rotatePiece() {
        const nextRotation = (this.currentPiece.rotation + 1) % this.pieces[this.currentPiece.type].length;
        const originalRotation = this.currentPiece.rotation;
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.rotation = nextRotation;
        this.currentPiece.shape = this.pieces[this.currentPiece.type][nextRotation];
        
        if (this.collision()) {
            this.currentPiece.rotation = originalRotation;
            this.currentPiece.shape = originalShape;
        } else {
            this.playSound('rotate');
        }
    }
    
    // Fix: Improve collision detection performance
    collision() {
        const { shape, x, y } = this.currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // Check bounds first (faster)
                    if (newX < 0 || newX >= this.BOARD_WIDTH || newY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Then check board collision
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }
    
    // Fix: Add performance optimization for clearLines
    clearLines() {
        const clearedLineIndices = [];
        
        // Find all full lines in one pass
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                clearedLineIndices.push(y);
            }
        }
        
        if (clearedLineIndices.length === 0) return;
        
        const linesCleared = clearedLineIndices.length;
        
        // Create visual effects
        this.createLineClearEffects(clearedLineIndices);
        this.playLineClearSound(linesCleared);
        
        // Optimize line removal - remove from bottom to top
        setTimeout(() => {
            clearedLineIndices.sort((a, b) => b - a); // Sort descending
            clearedLineIndices.forEach(lineIndex => {
                this.board.splice(lineIndex, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
            });
            
            this.lines += linesCleared;
            this.updateScore(linesCleared);
            this.createScorePopup(linesCleared);
            
            if (linesCleared === 4) {
                this.createScreenFlash('#FFD700');
            } else if (linesCleared >= 3) {
                this.createScreenFlash('#FF6B6B');
            }
        }, 300);
    }
    
    createLineClearEffects(lineIndices) {
        lineIndices.forEach(lineIndex => {
            // Simple flash effect only
            const canvas = this.canvas;
            const flashOverlay = document.createElement('div');
            flashOverlay.style.cssText = `
                position: absolute;
                left: ${canvas.offsetLeft}px;
                top: ${canvas.offsetTop + lineIndex * this.BLOCK_SIZE}px;
                width: ${canvas.width}px;
                height: ${this.BLOCK_SIZE}px;
                background: rgba(255, 255, 255, 0.8);
                pointer-events: none;
                z-index: 1000;
                animation: lineFlash 0.3s ease-out;
            `;
            
            document.body.appendChild(flashOverlay);
            setTimeout(() => flashOverlay.remove(), 300);
        });
    }

    // Simplify score popup
    createScorePopup(linesCleared) {
        const scoreValues = [0, 100, 300, 500, 1000];
        const baseScore = scoreValues[Math.min(linesCleared, 4)] || (100 * linesCleared);
        const points = baseScore * this.level;
        
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        
        let text = `+${points.toLocaleString()}`;
        if (linesCleared === 4) {
            text = 'TETRIS! ' + text;
            popup.style.color = '#FFD700';
            popup.style.fontSize = '24px';
        }
        
        popup.textContent = text;
        popup.style.cssText += `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: #00FF00;
            font-weight: bold;
            font-size: 18px;
            pointer-events: none;
            z-index: 1000;
            animation: scoreFloat 1.5s ease-out forwards;
        `;
        
        this.canvas.parentElement.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }

    // Remove complex screen flash
    createScreenFlash(color) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${color};
            opacity: 0.3;
            pointer-events: none;
            z-index: 999;
            animation: screenFlash 0.2s ease-out;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
    }
    
    draw() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        this.drawBoard();
        
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
        
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.colors[this.board[y][x]]);
                }
            }
        }
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, this.colors[piece.type]);
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // Highlight effect
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         this.BLOCK_SIZE - 2, 2);
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         2, this.BLOCK_SIZE - 2);
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    gameLoop(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.gameOver && !this.isPaused) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropCounter = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    restart() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.dropCounter = 0;
        this.dropInterval = 1500;
        this.updateDisplay();
        this.spawnPiece();
        
        // Resume music if not muted and not already playing
        if (!this.isMuted && !this.musicPlaying) {
            setTimeout(() => this.playBackgroundMusic(), 100);
        }
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Pause current track but don't stop playlist
            if (this.currentAudio && !this.currentAudio.paused) {
                this.currentAudio.pause();
                this.musicPlaying = false;
                this.updateNowPlaying('Paused');
            }
        } else if (!this.isMuted) {
            // Resume current track or start playlist
            if (this.currentAudio && this.currentAudio.paused) {
                this.currentAudio.play().then(() => {
                    this.musicPlaying = true;
                    const currentTrack = this.musicPlaylist[this.currentTrackIndex];
                    this.updateNowPlaying(currentTrack ? currentTrack.name : 'Music');
                });
            } else {
                this.playBackgroundMusic();
            }
        }
    }
    
    updateScore(linesCleared = 0) {
        if (linesCleared > 0) {
            const scoreValues = [0, 100, 300, 500, 1000];
            const baseScore = scoreValues[Math.min(linesCleared, 4)] || (100 * linesCleared);
            this.score += baseScore * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateDropInterval();
        }
        
        this.updateDisplay();
        this.updateLeaderboard();
    }
    
    updateDropInterval() {
        if (this.level <= 2) {
            this.dropInterval = Math.max(1200, 1500 - (this.level - 1) * 150);
        } else if (this.level <= 4) {
            this.dropInterval = Math.max(700, 1150 - (this.level - 2) * 225);
        } else if (this.level <= 6) {
            this.dropInterval = Math.max(400, 750 - (this.level - 4) * 175);
        } else {
            this.dropInterval = Math.max(100, 450 - (this.level - 6) * 25);
        }
    }
    
    updateDisplay() {
        const elements = {
            'score-display': this.score.toLocaleString(),
            'level-display': this.level,
            'lines-display': this.lines
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    updateLeaderboard() {
        let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
        let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
        
        const today = new Date().toDateString();
        const currentWeek = this.getWeekNumber(new Date());
        
        if (this.gameOver && this.score > 0 && this.userInfo && this.userInfo.username) {
            const entry = {
                username: this.userInfo.username,
                email: this.userInfo.email,
                score: this.score,
                level: this.level,
                lines: this.lines,
                date: today,
                week: currentWeek,
                timestamp: new Date().toISOString()
            };
            
            todayLeaderboard = todayLeaderboard.filter(item => item.date === today);
            todayLeaderboard.push(entry);
            todayLeaderboard.sort((a, b) => b.score - a.score);
            todayLeaderboard = todayLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisTodayLeaderboard', JSON.stringify(todayLeaderboard));
            
            weekLeaderboard = weekLeaderboard.filter(item => item.week === currentWeek);
            weekLeaderboard.push(entry);
            weekLeaderboard.sort((a, b) => b.score - a.score);
            weekLeaderboard = weekLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisWeekLeaderboard', JSON.stringify(weekLeaderboard));
        }
        
        this.displayLeaderboards(todayLeaderboard, weekLeaderboard);
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    displayLeaderboards(todayData, weekData) {
        this.displayTabLeaderboard('today-panel', todayData);
        this.displayTabLeaderboard('week-panel', weekData);
    }
    
    displayTabLeaderboard(panelId, leaderboard) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        panel.innerHTML = '';
        
        // Filter out entries without usernames
        const validEntries = leaderboard.filter(entry => entry.username && entry.username.trim());
        
        if (validEntries.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'leaderboard-empty';
            emptyState.innerHTML = 'No heroes yet<br>Be the first to create a record!';
            panel.appendChild(emptyState);
            return;
        }
        
        validEntries.slice(0, 10).forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankIcons = ['🥇', '🥈', '🥉'];
            const rankIcon = rankIcons[index] || (index + 1);
            
            item.innerHTML = `
                <div class="leaderboard-item-top">
                    <span class="rank">${rankIcon}</span>
                    <span class="player-score">${entry.score.toLocaleString()}</span>
                </div>
                <div class="leaderboard-item-bottom">
                    <span class="player-name">${entry.username}</span>
                </div>
            `;
            panel.appendChild(item);
        });
    }
    
    async submitScore() {
        if (!this.userInfo || this.score === 0) return;
        
        // Update local storage with user info
        try {
            let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
            let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
            
            const today = new Date().toDateString();
            const currentWeek = this.getWeekNumber(new Date());
            
            const entry = {
                username: this.userInfo.username,
                email: this.userInfo.email,
                score: this.score,
                level: this.level,
                lines: this.lines,
                date: today,
                week: currentWeek,
                timestamp: new Date().toISOString()
            };
            
            // Update today's leaderboard - remove old entries for same user
            todayLeaderboard = todayLeaderboard.filter(item => 
                item.date === today && item.email !== this.userInfo.email
            );
            todayLeaderboard.push(entry);
            todayLeaderboard.sort((a, b) => b.score - a.score);
            todayLeaderboard = todayLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisTodayLeaderboard', JSON.stringify(todayLeaderboard));
            
            // Update week's leaderboard - remove old entries for same user
            weekLeaderboard = weekLeaderboard.filter(item => 
                item.week === currentWeek && item.email !== this.userInfo.email
            );
            weekLeaderboard.push(entry);
            weekLeaderboard.sort((a, b) => b.score - a.score);
            weekLeaderboard = weekLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisWeekLeaderboard', JSON.stringify(weekLeaderboard));
            
            this.displayLeaderboards(todayLeaderboard, weekLeaderboard);
            this.showMessage('Score saved successfully!', '#4CAF50');
            
        } catch (error) {
            console.error('Error saving score:', error);
            this.showMessage('Failed to save score. Please try again.', '#f44336');
        }
    }

    showMessage(text, color) {
        const existingMessage = document.getElementById('submission-message');
        existingMessage?.remove();
        
        const message = document.createElement('div');
        message.id = 'submission-message';
        message.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: ${color}; color: white; padding: 15px 25px; border-radius: 5px;
            font-size: 16px; z-index: 10001; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), color === '#4CAF50' ? 3000 : 5000);
    }
    
    async loadLeaderboard() {
        // Since API endpoints don't exist, just use local storage
        try {
            let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
            let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
            
            // Filter for current day/week
            const today = new Date().toDateString();
            const currentWeek = this.getWeekNumber(new Date());
            
            todayLeaderboard = todayLeaderboard.filter(item => item.date === today);
            weekLeaderboard = weekLeaderboard.filter(item => item.week === currentWeek);
            
            this.displayLeaderboards(todayLeaderboard, weekLeaderboard);
        } catch (error) {
            console.error('Error loading leaderboard from localStorage:', error);
            this.displayLeaderboards([], []);
        }
    }
    
    showGameOverModal() {
        if (this.score > 0) {
            this.modalOpen = true;
            showUserInfoModal();
        }
    }

    setModalState(isOpen) {
        this.modalOpen = isOpen;
    }

    updateNowPlaying(trackName) {
        let nowPlayingElement = document.getElementById('nowPlaying');
        
        if (!nowPlayingElement && trackName) {
            nowPlayingElement = document.createElement('div');
            nowPlayingElement.id = 'nowPlaying';
            nowPlayingElement.style.cssText = `
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: #ffd700;
                padding: 5px 10px;
                border-radius: 10px;
                font-size: 12px;
                white-space: nowrap;
                transition: opacity 0.3s ease;
            `;
            
            const gameBoard = document.querySelector('.game-board');
            if (gameBoard) {
                gameBoard.appendChild(nowPlayingElement);
            }
        }
        
        if (nowPlayingElement) {
            if (trackName) {
                nowPlayingElement.textContent = `♪ ${trackName}`;
                nowPlayingElement.style.display = 'block';
                nowPlayingElement.style.opacity = '1';
            } else {
                nowPlayingElement.style.opacity = '0';
                setTimeout(() => {
                    if (nowPlayingElement.style.opacity === '0') {
                        nowPlayingElement.style.display = 'none';
                    }
                }, 300);
            }
        }
    }

    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
        }
    }
    
    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Don't clean up preloaded tracks - keep them for reuse
        // this.preloadedTracks.forEach(audio => {
        //     if (audio) {
        //         audio.pause();
        //         audio.src = '';
        //         audio.load();
        //     }
        // });
        // this.preloadedTracks = [];
        
        this.gameOver = true;
        this.isPaused = true;
        
        document.querySelectorAll('.score-popup, .line-clear-effect, .particle').forEach(el => {
            el.remove();
        });
    }
}

// 初始化和事件处理
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    try {
        initializeCanvas();
        setupEventListeners();
        setupTabSwitching();
        loadInitialLeaderboard();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('Game initialization failed. Please refresh the page.');
    }
}

function initializeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 800;
    
    // Draw initial board pattern
    const BLOCK_SIZE = 40;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 400, 800);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#111';
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if ((x + y) % 2 === 0) {
                ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            }
        }
    }
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
    }
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function setupEventListeners() {
    const buttons = {
        startGame: () => {
            if (!window.tetrisGame || window.tetrisGame.gameOver) {
                window.tetrisGame = new Tetris('gameCanvas');
                
                if (!window.tetrisGame.isMuted) {
                    if (window.tetrisGame.audioContext && window.tetrisGame.audioContext.state === 'suspended') {
                        window.tetrisGame.audioContext.resume().then(() => {
                            setTimeout(() => window.tetrisGame.playBackgroundMusic(), 500);
                        });
                    } else {
                        setTimeout(() => window.tetrisGame.playBackgroundMusic(), 500);
                    }
                }
            }
        },
        pauseGame: () => {
            if (window.tetrisGame && !window.tetrisGame.gameOver) {
                window.tetrisGame.pause();
            }
        },
        muteButton: () => {
            if (window.tetrisGame) {
                if (window.tetrisGame.audioContext && window.tetrisGame.audioContext.state === 'suspended') {
                    window.tetrisGame.audioContext.resume().then(() => {
                        window.tetrisGame.toggleMute();
                    });
                } else {
                    window.tetrisGame.toggleMute();
                }
            }
        }
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', handler);
    });
}

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${targetTab}-panel`).classList.add('active');
        });
    });
}

async function loadInitialLeaderboard() {
    const tempLoader = {
        getWeekNumber: Tetris.prototype.getWeekNumber,
        displayLeaderboards: Tetris.prototype.displayLeaderboards,
        displayTabLeaderboard: Tetris.prototype.displayTabLeaderboard
    };
    
    try {
        let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
        let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
        
        const today = new Date().toDateString();
        const currentWeek = tempLoader.getWeekNumber(new Date());
        
        todayLeaderboard = todayLeaderboard.filter(item => item.date === today);
        weekLeaderboard = weekLeaderboard.filter(item => item.week === currentWeek);
        
        tempLoader.displayLeaderboards(todayLeaderboard, weekLeaderboard);
    } catch (error) {
        console.error('Error loading initial leaderboard:', error);
    }
}
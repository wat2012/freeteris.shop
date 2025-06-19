class Tetris {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
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
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
                this.handleKeyPress(e.code);
            }
        });
    }
    
    handleKeyPress(code) {
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
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
            this.setupMelody();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    setupMelody() {
        this.melody = [
            { note: 'E5', duration: 0.5 }, { note: 'B4', duration: 0.25 },
            { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
            { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 },
            { note: 'A4', duration: 0.5 }, { note: 'A4', duration: 0.25 },
            { note: 'C5', duration: 0.25 }, { note: 'E5', duration: 0.5 },
            { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 },
            { note: 'B4', duration: 0.75 }, { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.5 }, { note: 'E5', duration: 0.5 },
            { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 },
            { note: 'A4', duration: 1 }
        ];
        
        this.noteFrequencies = {
            'A4': 440, 'B4': 493.88, 'C5': 523.25,
            'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
        };
        
        this.musicPlaying = false;
    }
    
    create8BitOscillator(frequency, startTime, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.05, startTime + duration * 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        return oscillator;
    }
    
    playBackgroundMusic() {
        if (!this.audioContext || this.isMuted || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.playMelodyLoop();
    }
    
    playMelodyLoop() {
        if (!this.musicPlaying || this.isMuted) return;
        
        const currentTime = this.audioContext.currentTime;
        let timeOffset = 0;
        
        this.melody.forEach(note => {
            const frequency = this.noteFrequencies[note.note];
            const duration = note.duration * 0.4;
            
            this.create8BitOscillator(frequency, currentTime + timeOffset, duration);
            timeOffset += duration;
        });
        
        setTimeout(() => {
            if (this.musicPlaying && !this.gameOver && !this.isPaused) {
                this.playMelodyLoop();
            }
        }, timeOffset * 1000);
    }
    
    stopBackgroundMusic() {
        this.musicPlaying = false;
    }
    
    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
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
    
    updateMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.title = this.isMuted ? 'Enable Sound' : 'Disable Sound';
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
        } else if (dx !== 0) {
            this.playSound('move');
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
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
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
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.playSound('lineClear');
            this.lines += linesCleared;
            this.updateScore(linesCleared);
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
    
    draw() {
        // Clear canvas
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
        
        if (!this.isMuted) {
            setTimeout(() => this.playBackgroundMusic(), 100);
        }
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopBackgroundMusic();
        } else if (!this.isMuted) {
            this.playBackgroundMusic();
        }
    }
    
    updateLeaderboard() {
        let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
        let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
        
        const today = new Date().toDateString();
        const currentWeek = this.getWeekNumber(new Date());
        
        if (this.gameOver && this.score > 0) {
            const entry = {
                score: this.score,
                level: this.level,
                lines: this.lines,
                date: today,
                week: currentWeek
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
        
        if (leaderboard.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'leaderboard-empty';
            emptyState.innerHTML = 'No heroes yet<br>Be the first to create a record!';
            panel.appendChild(emptyState);
            return;
        }
        
        leaderboard.slice(0, 10).forEach((entry, index) => {
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
                    <span class="player-name">${entry.username || `Player ${String.fromCharCode(65 + index)}`}</span>
                </div>
            `;
            panel.appendChild(item);
        });
    }
    
    async submitScore() {
        if (!this.userInfo || this.score === 0) return;
        
        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.userInfo.username,
                    email: this.userInfo.email,
                    score: this.score,
                    level: this.level,
                    lines: this.lines
                })
            });
            
            if (response.ok) {
                console.log('Score submitted successfully');
                await this.loadLeaderboard?.() || this.updateLeaderboard();
                this.showMessage('Score submitted successfully!', '#4CAF50');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            this.showMessage(`Failed to submit score: ${error.message}`, '#f44336');
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
        try {
            const [todayResponse, weekResponse] = await Promise.all([
                fetch('/api/scores?type=today&limit=10'),
                fetch('/api/scores?type=week&limit=10')
            ]);
            
            if (todayResponse.ok && weekResponse.ok) {
                const todayData = await todayResponse.json();
                const weekData = await weekResponse.json();
                this.displayLeaderboards(todayData, weekData);
            } else {
                this.displayLeaderboards([], []);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.displayLeaderboards([], []);
        }
    }
    
    showGameOverModal() {
        if (this.score > 0) {
            showUserInfoModal();
        }
    }
}

// Optimized event handlers
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    initializeCanvas();
    setupEventListeners();
    setupTabSwitching();
    loadInitialLeaderboard();
}

function initializeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 800;
    
    drawInitialBoard(ctx);
}

function drawInitialBoard(ctx) {
    const BLOCK_SIZE = 40;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 400, 800);
    
    // Draw grid and pattern
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
    
    // Draw grid lines
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
                    setTimeout(() => window.tetrisGame.playBackgroundMusic(), 500);
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
                window.tetrisGame.toggleMute();
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
    const tempLeaderboard = {
        displayLeaderboards: Tetris.prototype.displayLeaderboards,
        displayTabLeaderboard: Tetris.prototype.displayTabLeaderboard,
        loadLeaderboard: Tetris.prototype.loadLeaderboard
    };
    
    await tempLeaderboard.loadLeaderboard();
}

// Modal functions
function showUserInfoModal() {
    const modal = document.getElementById('userInfoModal');
    modal.style.display = 'block';
    
    document.getElementById('username').value = '';
    document.getElementById('email').value = '';
    
    const modalContent = modal.querySelector('.modal-content p');
    if (window.tetrisGame && modalContent) {
        modalContent.textContent = `Great score of ${window.tetrisGame.score.toLocaleString()} points! Enter your details to save your high score to the leaderboard!`;
    }
    
    setTimeout(() => document.getElementById('username').focus(), 100);
}

function hideUserInfoModal() {
    document.getElementById('userInfoModal').style.display = 'none';
}

async function submitUserInfo() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const submitButton = document.querySelector('.modal-button.primary');
    
    if (!username || !email) {
        alert('Please fill in all fields to save your score');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving Score...';
    }
    
    if (window.tetrisGame) {
        window.tetrisGame.userInfo = { username, email };
        
        try {
            if (window.tetrisGame.gameOver && window.tetrisGame.score > 0) {
                await window.tetrisGame.submitScore();
            }
            hideUserInfoModal();
        } catch (error) {
            console.error('Error during score submission:', error);
            alert('Failed to save score. Please try again.');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Save Score';
            }
        }
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

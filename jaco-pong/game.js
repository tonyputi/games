// JacoPong - Game Engine
// Un gioco Pong personalizzato per Jacopo!

// ============================================
// AUDIO SYSTEM
// ============================================
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.muted = false;
        this.customHitSound = null;
        this.customScoreSound = null;
        this.loadCustomSounds();
    }

    initContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    loadCustomSounds() {
        const sounds = localStorage.getItem('jacoPong_sounds');
        if (sounds) {
            try {
                const parsed = JSON.parse(sounds);
                this.customHitSound = parsed.hit || null;
                this.customScoreSound = parsed.score || null;
            } catch (e) {
                console.warn('Failed to load custom sounds');
            }
        }
    }

    saveSounds() {
        localStorage.setItem('jacoPong_sounds', JSON.stringify({
            hit: this.customHitSound,
            score: this.customScoreSound
        }));
    }

    setHitSound(dataUrl) {
        this.customHitSound = dataUrl;
        this.saveSounds();
    }

    setScoreSound(dataUrl) {
        this.customScoreSound = dataUrl;
        this.saveSounds();
    }

    playCustomSound(dataUrl) {
        if (this.muted || !dataUrl) return;
        const audio = new Audio(dataUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (this.muted) return;
        this.initContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Suono "Ouch!" sintetizzato - simula una voce che dice ouch
    playHit() {
        if (this.customHitSound) {
            this.playCustomSound(this.customHitSound);
            return;
        }

        if (this.muted) return;
        this.initContext();

        // Simulazione vocale "ouch" con oscillatori
        const now = this.audioContext.currentTime;

        // "O" sound - lower frequency
        this.playToneAt(300, 0.08, 'sine', 0.4, now);
        // "U" sound - mid frequency
        this.playToneAt(400, 0.06, 'sine', 0.3, now + 0.06);
        // "CH" sound - noise burst
        this.playNoiseAt(0.05, 0.2, now + 0.1);
    }

    playToneAt(frequency, duration, type, volume, startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    playNoiseAt(duration, volume, startTime) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    // Suono punto
    playScore() {
        if (this.customScoreSound) {
            this.playCustomSound(this.customScoreSound);
            return;
        }

        if (this.muted) return;
        this.initContext();

        // Melodia vittoria - tre note ascendenti
        const now = this.audioContext.currentTime;
        this.playToneAt(523, 0.1, 'sine', 0.3, now);        // C5
        this.playToneAt(659, 0.1, 'sine', 0.3, now + 0.1);  // E5
        this.playToneAt(784, 0.2, 'sine', 0.4, now + 0.2);  // G5
    }

    // Suono muro
    playWall() {
        this.playHit(); // Usa lo stesso suono del colpo
    }

    // Suono paddle
    playPaddle() {
        this.playHit(); // Usa lo stesso suono del colpo
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    reset() {
        this.customHitSound = null;
        this.customScoreSound = null;
        localStorage.removeItem('jacoPong_sounds');
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.size = options.size || Math.random() * 4 + 2;
        this.color = options.color || '#fff';
        this.life = 1;
        this.decay = options.decay || 0.02;
        this.gravity = options.gravity || 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// ============================================
// MAIN GAME CLASS
// ============================================
class JacoPong {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();
        this.particles = [];

        // Game state
        this.state = 'menu';
        this.gameMode = '1p'; // '1p' or '2p'
        this.score1 = 0;
        this.score2 = 0;
        this.winningScore = 10;
        this.winner = '';

        // Difficulty settings
        this.difficulty = 'medium';
        this.aiSpeed = 4;
        this.aiReactionDelay = 0.15;

        // Custom ball image
        this.customBallImage = null;
        this.ballImageLoaded = false;
        this.loadCustomBallImage();

        // Game objects will be initialized on resize
        this.paddle1 = null;
        this.paddle2 = null;
        this.ball = null;

        // Touch tracking for mobile
        this.touches = {};
        this.isMobile = 'ontouchstart' in window;

        // High score
        this.highScore = parseInt(localStorage.getItem('jacoPong_highScore') || '0');

        // Callbacks
        this.onStateChange = null;
        this.onScoreChange = null;

        // Setup
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSettings();

        // Start game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    loadSettings() {
        const settings = localStorage.getItem('jacoPong_settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                this.difficulty = parsed.difficulty || 'medium';
                this.winningScore = parsed.winningScore || 10;
                this.updateDifficultySettings();
            } catch (e) {
                console.warn('Failed to load settings');
            }
        }
    }

    saveSettings() {
        localStorage.setItem('jacoPong_settings', JSON.stringify({
            difficulty: this.difficulty,
            winningScore: this.winningScore
        }));
    }

    loadCustomBallImage() {
        const imageData = localStorage.getItem('jacoPong_ballImage');
        if (imageData) {
            this.loadBallImage(imageData);
        }
    }

    loadBallImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.customBallImage = this.processImage(img);
            this.ballImageLoaded = true;
        };
        img.src = dataUrl;
    }

    processImage(img) {
        // Create circular cropped image
        const size = 200;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw circular clip
        tempCtx.beginPath();
        tempCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        tempCtx.closePath();
        tempCtx.clip();

        // Draw image centered and scaled to fill
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        tempCtx.drawImage(img, x, y, w, h);

        // Convert to image
        const processedImg = new Image();
        processedImg.src = tempCanvas.toDataURL();
        return processedImg;
    }

    setBallImage(dataUrl) {
        localStorage.setItem('jacoPong_ballImage', dataUrl);
        this.loadBallImage(dataUrl);
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.updateDifficultySettings();
        this.saveSettings();
    }

    updateDifficultySettings() {
        const settings = {
            easy: { aiSpeed: 3, aiReactionDelay: 0.25 },
            medium: { aiSpeed: 5, aiReactionDelay: 0.15 },
            hard: { aiSpeed: 7, aiReactionDelay: 0.08 },
            impossible: { aiSpeed: 10, aiReactionDelay: 0 }
        };
        const s = settings[this.difficulty] || settings.medium;
        this.aiSpeed = s.aiSpeed;
        this.aiReactionDelay = s.aiReactionDelay;
    }

    setWinningScore(score) {
        this.winningScore = parseInt(score);
        this.saveSettings();
    }

    setupCanvas() {
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();

            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;

            this.ctx.scale(dpr, dpr);

            this.width = rect.width;
            this.height = rect.height;

            // Initialize or update game objects
            this.initGameObjects();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    initGameObjects() {
        const paddleWidth = Math.max(10, this.width * 0.015);
        const paddleHeight = Math.max(60, this.height * 0.2);
        const ballRadius = Math.max(25, Math.min(this.width, this.height) * 0.07);

        // Paddle 1 (left - Player 1)
        this.paddle1 = {
            x: paddleWidth * 2,
            y: this.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: 8,
            color: '#3b82f6', // blue
            targetY: this.height / 2 - paddleHeight / 2
        };

        // Paddle 2 (right - Player 2 or AI)
        this.paddle2 = {
            x: this.width - paddleWidth * 3,
            y: this.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: 8,
            color: '#ef4444', // red
            targetY: this.height / 2 - paddleHeight / 2
        };

        // Ball
        if (!this.ball) {
            this.ball = {
                x: this.width / 2,
                y: this.height / 2,
                radius: ballRadius,
                speed: Math.max(4, this.width * 0.005),
                maxSpeed: Math.max(12, this.width * 0.015),
                vx: 0,
                vy: 0,
                rotation: 0,
                rotationSpeed: 0
            };
        } else {
            this.ball.radius = ballRadius;
        }

        this.baseSpeed = this.ball.speed;
    }

    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', () => this.handleClick());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    // Input tracking
    keys = {};

    handleKeyDown(e) {
        this.keys[e.code] = true;

        if (e.code === 'Space') {
            e.preventDefault();
            if (this.state === 'paused') {
                this.resume();
            } else if (this.state === 'playing') {
                this.pause();
            }
        }

        if (e.code === 'Escape' && this.state === 'playing') {
            this.pause();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleMouseMove(e) {
        if (this.state !== 'playing' || this.isMobile) return;

        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // In 1P mode, mouse controls left paddle
        // In 2P mode, mouse can control right paddle (right side of screen)
        const x = e.clientX - rect.left;

        if (this.gameMode === '1p') {
            this.paddle1.targetY = y - this.paddle1.height / 2;
        } else {
            // 2P: Left half controls paddle1, right half controls paddle2
            if (x < this.width / 2) {
                this.paddle1.targetY = y - this.paddle1.height / 2;
            } else {
                this.paddle2.targetY = y - this.paddle2.height / 2;
            }
        }
    }

    handleClick() {
        if (this.state === 'paused') {
            this.resume();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            this.touches[touch.identifier] = {
                x: touch.clientX,
                y: touch.clientY
            };
        }
        this.handleTouchMove(e);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();

        for (let touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches[touch.identifier] = { x, y };

            // Left half controls paddle1, right half controls paddle2
            if (x < this.width / 2) {
                this.paddle1.targetY = y - this.paddle1.height / 2;
            } else if (this.gameMode === '2p') {
                this.paddle2.targetY = y - this.paddle2.height / 2;
            }
        }
    }

    handleTouchEnd(e) {
        for (let touch of e.changedTouches) {
            delete this.touches[touch.identifier];
        }

        if (this.state === 'paused' && Object.keys(this.touches).length === 0) {
            this.resume();
        }
    }

    // Game state management
    start(mode = '1p') {
        this.gameMode = mode;
        this.score1 = 0;
        this.score2 = 0;
        this.winner = '';
        this.particles = [];
        this.initGameObjects();
        this.resetBall();
        this.state = 'playing';
        this.audio.initContext();
        this.notifyStateChange();
        this.notifyScoreChange();
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.notifyStateChange();
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.notifyStateChange();
        }
    }

    restart() {
        this.start(this.gameMode);
    }

    backToMenu() {
        this.state = 'menu';
        this.notifyStateChange();
    }

    gameOver(winner) {
        this.winner = winner;
        this.state = 'gameover';

        // Update high score for 1P mode
        if (this.gameMode === '1p' && this.score1 > this.highScore) {
            this.highScore = this.score1;
            localStorage.setItem('jacoPong_highScore', this.highScore.toString());
        }

        this.notifyStateChange();
    }

    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.state);
        }
    }

    notifyScoreChange() {
        if (this.onScoreChange) {
            this.onScoreChange(this.score1, this.score2);
        }
    }

    resetBall(direction = 0) {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.speed = this.baseSpeed;

        // Random direction if not specified
        if (direction === 0) {
            direction = Math.random() > 0.5 ? 1 : -1;
        }

        const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // -30 to +30 degrees
        this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
        this.ball.vy = Math.sin(angle) * this.ball.speed;
        this.ball.rotation = 0;
        this.ball.rotationSpeed = 0;
    }

    // Game loop
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }

        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        // Update paddles
        this.updatePaddle1();
        this.updatePaddle2();

        // Update ball
        this.updateBall();

        // Update particles
        this.particles = this.particles.filter(p => p.update());
    }

    updatePaddle1() {
        // Keyboard controls for paddle 1 (W/S or Arrow Up/Down on left)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.paddle1.targetY = this.paddle1.y - this.paddle1.speed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.paddle1.targetY = this.paddle1.y + this.paddle1.speed;
        }

        // Smooth movement towards target
        const diff = this.paddle1.targetY - this.paddle1.y;
        this.paddle1.y += diff * 0.3;

        // Keep in bounds
        this.paddle1.y = Math.max(0, Math.min(this.height - this.paddle1.height, this.paddle1.y));
    }

    updatePaddle2() {
        if (this.gameMode === '2p') {
            // Player 2 keyboard controls (Arrow keys)
            if (this.keys['ArrowUp']) {
                this.paddle2.targetY = this.paddle2.y - this.paddle2.speed;
            }
            if (this.keys['ArrowDown']) {
                this.paddle2.targetY = this.paddle2.y + this.paddle2.speed;
            }

            // Smooth movement towards target
            const diff = this.paddle2.targetY - this.paddle2.y;
            this.paddle2.y += diff * 0.3;
        } else {
            // AI control
            this.updateAI();
        }

        // Keep in bounds
        this.paddle2.y = Math.max(0, Math.min(this.height - this.paddle2.height, this.paddle2.y));
    }

    updateAI() {
        // Simple AI: track the ball with some delay
        const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
        const targetY = this.ball.y;

        // Add some reaction delay based on ball position
        const reactionZone = this.width * (1 - this.aiReactionDelay);
        if (this.ball.x > reactionZone && this.ball.vx > 0) {
            // Ball is coming towards AI
            const diff = targetY - paddleCenter;

            if (Math.abs(diff) > this.paddle2.height * 0.1) {
                const direction = diff > 0 ? 1 : -1;
                this.paddle2.y += direction * this.aiSpeed;
            }
        } else {
            // Return to center slowly
            const centerDiff = (this.height / 2) - paddleCenter;
            if (Math.abs(centerDiff) > 10) {
                this.paddle2.y += (centerDiff > 0 ? 1 : -1) * (this.aiSpeed * 0.3);
            }
        }
    }

    updateBall() {
        // Move ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Rotate ball (for visual effect)
        this.ball.rotation += this.ball.rotationSpeed;

        // Wall collision (top/bottom)
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -1;
            this.audio.playWall();
            this.spawnHitParticles(this.ball.x, this.ball.radius);
        }
        if (this.ball.y + this.ball.radius > this.height) {
            this.ball.y = this.height - this.ball.radius;
            this.ball.vy *= -1;
            this.audio.playWall();
            this.spawnHitParticles(this.ball.x, this.height - this.ball.radius);
        }

        // Paddle collision
        if (this.checkPaddleCollision(this.paddle1)) {
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
            this.reflectBall(this.paddle1);
            this.audio.playPaddle();
            this.spawnHitParticles(this.ball.x, this.ball.y);
        }

        if (this.checkPaddleCollision(this.paddle2)) {
            this.ball.x = this.paddle2.x - this.ball.radius;
            this.reflectBall(this.paddle2);
            this.audio.playPaddle();
            this.spawnHitParticles(this.ball.x, this.ball.y);
        }

        // Score check (ball goes off screen)
        if (this.ball.x < -this.ball.radius) {
            this.score2++;
            this.audio.playScore();
            this.spawnScoreParticles(this.width * 0.75, this.height / 2);
            this.notifyScoreChange();
            this.checkWin();
            if (this.state === 'playing') {
                this.resetBall(1); // Ball goes right
            }
        }

        if (this.ball.x > this.width + this.ball.radius) {
            this.score1++;
            this.audio.playScore();
            this.spawnScoreParticles(this.width * 0.25, this.height / 2);
            this.notifyScoreChange();
            this.checkWin();
            if (this.state === 'playing') {
                this.resetBall(-1); // Ball goes left
            }
        }
    }

    checkPaddleCollision(paddle) {
        return (
            this.ball.x - this.ball.radius < paddle.x + paddle.width &&
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y - this.ball.radius < paddle.y + paddle.height &&
            this.ball.y + this.ball.radius > paddle.y
        );
    }

    reflectBall(paddle) {
        // Calculate hit position relative to paddle center (-1 to 1)
        const paddleCenter = paddle.y + paddle.height / 2;
        const hitPos = (this.ball.y - paddleCenter) / (paddle.height / 2);

        // Calculate new angle based on hit position
        const maxAngle = Math.PI / 3; // 60 degrees
        const angle = hitPos * maxAngle;

        // Determine direction based on which paddle
        const direction = paddle === this.paddle1 ? 1 : -1;

        // Increase speed slightly (up to max)
        this.ball.speed = Math.min(this.ball.speed * 1.05, this.ball.maxSpeed);

        // Set new velocity
        this.ball.vx = Math.cos(angle) * this.ball.speed * direction;
        this.ball.vy = Math.sin(angle) * this.ball.speed;

        // Add rotation based on paddle movement (slow rotation)
        this.ball.rotationSpeed = hitPos * 0.08;
    }

    checkWin() {
        if (this.score1 >= this.winningScore) {
            const winnerName = this.gameMode === '1p' ? 'Hai vinto!' : 'Giocatore 1 vince!';
            this.gameOver(winnerName);
        } else if (this.score2 >= this.winningScore) {
            const winnerName = this.gameMode === '1p' ? 'L\'AI ha vinto!' : 'Giocatore 2 vince!';
            this.gameOver(winnerName);
        }
    }

    // Particle effects
    spawnHitParticles(x, y) {
        const colors = ['#fbbf24', '#f59e0b', '#ffffff', '#fef3c7'];
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                decay: 0.03,
                gravity: 0.1
            }));
        }
    }

    spawnScoreParticles(x, y) {
        const colors = ['#fbbf24', '#f59e0b', '#fef3c7'];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                decay: 0.015
            }));
        }
    }

    // Rendering
    draw() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw background pattern
        this.drawBackground();

        // Draw center line
        this.drawCenterLine();

        // Draw paddles
        this.drawPaddle(this.paddle1);
        this.drawPaddle(this.paddle2);

        // Draw ball
        this.drawBall();

        // Draw particles
        this.particles.forEach(p => p.draw(ctx));
    }

    drawBackground() {
        const ctx = this.ctx;

        // Draw subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    drawCenterLine() {
        const ctx = this.ctx;
        const dashLength = 20;
        const gapLength = 15;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([dashLength, gapLength]);

        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawPaddle(paddle) {
        const ctx = this.ctx;

        // Glow effect
        ctx.shadowColor = paddle.color;
        ctx.shadowBlur = 15;

        // Paddle body
        ctx.fillStyle = paddle.color;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    drawBall() {
        const ctx = this.ctx;
        const ball = this.ball;

        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.rotation);

        // Glow effect
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;

        if (this.ballImageLoaded && this.customBallImage) {
            // Draw custom image
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(
                this.customBallImage,
                -ball.radius,
                -ball.radius,
                ball.radius * 2,
                ball.radius * 2
            );

            // Add border
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius - 1.5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Draw fallback (smiley face)
            this.drawFallbackBall(ctx, ball.radius);
        }

        ctx.restore();
    }

    drawFallbackBall(ctx, radius) {
        // Yellow circle
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#000';

        // Eyes
        const eyeY = -radius * 0.2;
        const eyeX = radius * 0.3;
        const eyeRadius = radius * 0.12;

        ctx.beginPath();
        ctx.arc(-eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = radius * 0.08;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, radius * 0.1, radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Border
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Reset all settings
    reset() {
        this.audio.reset();
        this.customBallImage = null;
        this.ballImageLoaded = false;
        this.difficulty = 'medium';
        this.winningScore = 10;
        this.updateDifficultySettings();
        localStorage.removeItem('jacoPong_ballImage');
        localStorage.removeItem('jacoPong_settings');
        localStorage.removeItem('jacoPong_highScore');
        this.highScore = 0;
    }
}

// ============================================
// ALPINE.JS UI COMPONENT
// ============================================
function gameUI() {
    return {
        game: null,
        gameState: 'menu',
        score1: 0,
        score2: 0,
        highScore: 0,
        winner: '',
        muted: false,
        showSettings: false,
        difficulty: 'medium',
        winningScore: '10',
        customBallImage: null,
        customHitSound: null,
        customScoreSound: null,
        isMobile: false,

        init() {
            const canvas = document.getElementById('gameCanvas');
            this.game = new JacoPong(canvas);

            // Setup callbacks
            this.game.onStateChange = (state) => {
                this.gameState = state;
                this.winner = this.game.winner;
                this.highScore = this.game.highScore;
            };

            this.game.onScoreChange = (s1, s2) => {
                this.score1 = s1;
                this.score2 = s2;
            };

            // Load saved settings
            this.highScore = this.game.highScore;
            this.difficulty = this.game.difficulty;
            this.winningScore = this.game.winningScore.toString();
            this.isMobile = this.game.isMobile;

            // Load custom assets preview
            const ballImage = localStorage.getItem('jacoPong_ballImage');
            if (ballImage) this.customBallImage = ballImage;

            const sounds = localStorage.getItem('jacoPong_sounds');
            if (sounds) {
                try {
                    const parsed = JSON.parse(sounds);
                    this.customHitSound = parsed.hit || null;
                    this.customScoreSound = parsed.score || null;
                } catch (e) {}
            }
        },

        startGame(mode) {
            this.game.start(mode);
        },

        restartGame() {
            this.game.restart();
        },

        backToMenu() {
            this.game.backToMenu();
        },

        toggleMute() {
            this.muted = this.game.audio.toggleMute();
        },

        updateDifficulty() {
            this.game.setDifficulty(this.difficulty);
        },

        updateWinningScore() {
            this.game.setWinningScore(this.winningScore);
        },

        handleBallImage(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.customBallImage = e.target.result;
                this.game.setBallImage(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        handleHitSound(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.customHitSound = e.target.result;
                this.game.audio.setHitSound(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        handleScoreSound(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.customScoreSound = e.target.result;
                this.game.audio.setScoreSound(e.target.result);
            };
            reader.readAsDataURL(file);
        },

        testHitSound() {
            this.game.audio.playHit();
        },

        testScoreSound() {
            this.game.audio.playScore();
        },

        resetSettings() {
            this.game.reset();
            this.customBallImage = null;
            this.customHitSound = null;
            this.customScoreSound = null;
            this.difficulty = 'medium';
            this.winningScore = '10';
            this.highScore = 0;
        }
    };
}

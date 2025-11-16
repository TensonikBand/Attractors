// Main Application Logic

class StrangeAttractorApp {
    constructor() {
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Custom systems
        this.particleSystem = null;
        this.audioSystem = null;

        // State
        this.attractorType = 'thomas';
        this.particleCount = 65536;
        this.timeSpeed = 1.0;
        this.isRunning = false;

        // Performance tracking
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;

        // Camera control
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 30;

        this.init();
    }

    async init() {
        console.log('Initializing Strange Attractor Application...');

        // Initialise Three.js
        this.initThreeJS();

        // Initialise particle system (pass renderer)
        this.particleSystem = new ParticleSystem(this.particleCount, this.attractorType);
        this.particleSystem.init(this.renderer);
        this.scene.add(this.particleSystem.getMesh());

        // Initialise audio system
        this.audioSystem = new AudioSystem(8);

        // Setup UI event listeners
        this.setupUI();

        // Setup camera controls
        this.setupCameraControls();

        // Hide loading screen
        document.getElementById('loading').style.display = 'none';

        // Start render loop
        this.isRunning = true;
        this.animate();

        console.log('Initialization complete!');
    }

    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 20, 100);

        // Create camera
        const canvas = document.getElementById('canvas');
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, this.cameraDistance);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add ambient lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupCameraControls() {
        const canvas = this.renderer.domElement;

        // Mouse drag to rotate
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.cameraRotation.y += deltaX * 0.005;
            this.cameraRotation.x += deltaY * 0.005;

            // Clamp vertical rotation
            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            this.updateCameraPosition();
        });

        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Mouse wheel to zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(5, Math.min(100, this.cameraDistance));
            this.updateCameraPosition();
        });

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                this.isDragging = true;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;

            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;

            this.cameraRotation.y += deltaX * 0.005;
            this.cameraRotation.x += deltaY * 0.005;

            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;

            this.updateCameraPosition();
        });

        canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    updateCameraPosition() {
        const x = this.cameraDistance * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
        const y = this.cameraDistance * Math.sin(this.cameraRotation.x);
        const z = this.cameraDistance * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    setupUI() {
        // Attractor type selector
        document.getElementById('attractorType').addEventListener('change', (e) => {
            this.setAttractorType(e.target.value);
        });

        // Parameter A slider
        const paramASlider = document.getElementById('paramA');
        paramASlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('paramAValue').textContent = value.toFixed(3);
            this.setParameterA(value);
        });

        // Audio voices slider
        document.getElementById('audioVoices').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('voicesValue').textContent = value;
            this.audioSystem.setNumVoices(value);
        });

        // Master volume slider
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('volumeValue').textContent = value + '%';
            this.audioSystem.setMasterVolume(value);
        });

        // Time speed slider
        document.getElementById('timeSpeed').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = value.toFixed(1) + 'x';
            this.timeSpeed = value;
        });

        // Particle count slider
        document.getElementById('particleCount').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const displayValue = value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value;
            document.getElementById('particleCountValue').textContent = displayValue;
            this.setParticleCount(value);
        });

        // Start audio button
        document.getElementById('startButton').addEventListener('click', async () => {
            await this.toggleAudio();
        });

        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.reset();
        });
    }

    async toggleAudio() {
        const button = document.getElementById('startButton');
        const indicator = document.getElementById('audioIndicator');
        const status = document.getElementById('audioStatus');

        if (this.audioSystem.isPlaying) {
            this.audioSystem.stop();
            button.textContent = '▶ Start Audio';
            indicator.classList.add('inactive');
            status.textContent = 'Stopped';
        } else {
            try {
                await this.audioSystem.start();
                button.textContent = '⏸ Pause Audio';
                indicator.classList.remove('inactive');
                status.textContent = 'Playing';
            } catch (error) {
                console.error('Failed to start audio:', error);
                alert('Failed to start audio. Please check browser permissions.');
            }
        }
    }

    setAttractorType(type) {
        this.attractorType = type;
        
        // Update particle system
        this.scene.remove(this.particleSystem.getMesh());
        this.particleSystem.dispose();
        this.particleSystem = new ParticleSystem(this.particleCount, type);
        this.particleSystem.init(this.renderer);
        this.scene.add(this.particleSystem.getMesh());

        // Update audio timbre
        this.audioSystem.updateAttractorType(type);

        // Update UI
        const attractor = getAttractorInfo(type);
        document.getElementById('attractorInfo').textContent = 
            `${attractor.name} (a=${document.getElementById('paramA').value})`;

        console.log('Switched to', attractor.name, 'attractor');
    }

    setParameterA(value) {
        // Map the generic 'a' parameter to attractor-specific parameters
        const params = mapParameterA(this.attractorType, value);
        
        for (const [key, val] of Object.entries(params)) {
            this.particleSystem.setParameter(key, val);
        }

        // Update info display
        const attractor = getAttractorInfo(this.attractorType);
        document.getElementById('attractorInfo').textContent = 
            `${attractor.name} (a=${value.toFixed(3)})`;
    }

    setParticleCount(count) {
        // Recreate particle system with new count
        this.particleCount = count;
        this.scene.remove(this.particleSystem.getMesh());
        this.particleSystem.dispose();
        this.particleSystem = new ParticleSystem(count, this.attractorType);
        this.particleSystem.init(this.renderer);
        this.scene.add(this.particleSystem.getMesh());

        console.log('Particle count set to', count);
    }

    reset() {
        // Reset camera
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 30;
        this.updateCameraPosition();

        // Reset particle system
        this.scene.remove(this.particleSystem.getMesh());
        this.particleSystem.dispose();
        this.particleSystem = new ParticleSystem(this.particleCount, this.attractorType);
        this.particleSystem.init(this.renderer);
        this.scene.add(this.particleSystem.getMesh());

        // Reset UI values
        document.getElementById('attractorType').value = 'thomas';
        document.getElementById('paramA').value = 0.19;
        document.getElementById('paramAValue').textContent = '0.19';
        document.getElementById('timeSpeed').value = 1.0;
        document.getElementById('speedValue').textContent = '1.0x';

        this.attractorType = 'thomas';
        this.timeSpeed = 1.0;

        console.log('System reset');
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        // Update particle system
        this.particleSystem.update(this.renderer, this.timeSpeed);

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Update audio (every few frames to reduce CPU load)
        if (this.frameCount % 3 === 0 && this.audioSystem.isPlaying) {
            const particles = this.particleSystem.getNearestParticles(
                this.audioSystem.numVoices,
                this.camera.position,
                this.renderer
            );
            this.audioSystem.update(particles);
        }

        // Update FPS counter
        this.updateFPS();

        this.frameCount++;
    }

    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            document.getElementById('fps').textContent = this.fps;
            
            // Update particle info
            const displayCount = this.particleCount >= 1000 ? 
                (this.particleCount / 1000).toFixed(0) + 'K' : 
                this.particleCount;
            document.getElementById('particleInfo').textContent = displayCount;

            this.frameCount = 0;
            this.lastTime = now;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.isRunning = false;
        
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        
        if (this.audioSystem) {
            this.audioSystem.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new StrangeAttractorApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.dispose();
    }
});

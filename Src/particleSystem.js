// GPU-Accelerated Particle System with Ping-Pong Rendering

class ParticleSystem {
    constructor(particleCount, attractorType = 'thomas') {
        this.particleCount = particleCount;
        this.textureSize = Math.ceil(Math.sqrt(particleCount));
        this.attractorType = attractorType;
        
        // Ping-pong render targets
        this.currentTarget = 0;
        this.renderTargets = [];
        
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.computeScene = null;
        this.computeCamera = null;
        this.particleMesh = null;
        this.computeMaterial = null;
        
        // Don't auto-initialize - wait for explicit init() call with renderer
    }

    init(renderer) {
        if (!renderer) {
            throw new Error('ParticleSystem.init() requires a renderer parameter. Call after creating THREE.WebGLRenderer.');
        }

        // Create render targets for ping-pong
        this.createRenderTargets();
        
        // Initialize positions (needs renderer)
        this.initializePositions(renderer);
        
        // Create compute scene for GPU calculation
        this.createComputeScene();
        
        // Create particle rendering mesh
        this.createParticleMesh();
    }

    createRenderTargets() {
        const options = {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        };

        // Create two render targets for ping-pong
        for (let i = 0; i < 2; i++) {
            this.renderTargets.push(
                new THREE.WebGLRenderTarget(
                    this.textureSize,
                    this.textureSize,
                    options
                )
            );
        }

        // Create previous positions target for velocity calculation
        this.prevPositionsTarget = new THREE.WebGLRenderTarget(
            this.textureSize,
            this.textureSize,
            options
        );
    }

    initializePositions(renderer) {
        if (!renderer) {
            throw new Error('ParticleSystem.initializePositions() requires a renderer parameter');
        }

        // Create initial position data
        const data = new Float32Array(this.textureSize * this.textureSize * 4);
        const attractor = getAttractorInfo(this.attractorType);
        
        for (let i = 0; i < this.particleCount; i++) {
            const [x, y, z] = attractor.initialConditions(i, this.particleCount);
            
            const idx = i * 4;
            data[idx + 0] = x;
            data[idx + 1] = y;
            data[idx + 2] = z;
            data[idx + 3] = 1.0;
        }

        // Create texture from data
        const texture = new THREE.DataTexture(
            data,
            this.textureSize,
            this.textureSize,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        texture.needsUpdate = true;

        // Fill both render targets with initial data
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);

        const scene = new THREE.Scene();
        scene.add(mesh);
        
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const oldTarget = renderer.getRenderTarget();

        this.renderTargets.forEach(target => {
            renderer.setRenderTarget(target);
            renderer.render(scene, camera);
        });
        
        renderer.setRenderTarget(this.prevPositionsTarget);
        renderer.render(scene, camera);
        
        renderer.setRenderTarget(oldTarget);
        
        texture.dispose();
        geometry.dispose();
        material.dispose();
    }

    createComputeScene() {
        this.computeScene = new THREE.Scene();
        this.computeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Get attractor info
        const attractor = getAttractorInfo(this.attractorType);
        
        // Create shader material for computation
        const uniforms = {
            positions: { value: null },
            resolution: { value: new THREE.Vector2(this.textureSize, this.textureSize) },
            ...this.createUniformsForAttractor(attractor)
        };

        this.computeMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: Shaders.computeVertex,
            fragmentShader: Shaders[attractor.shader]
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.computeMaterial);
        this.computeScene.add(mesh);
    }

    createUniformsForAttractor(attractor) {
        const uniforms = {};
        
        // Add all parameters from attractor definition
        for (const [key, value] of Object.entries(attractor.params)) {
            uniforms[key] = { value: value };
        }
        
        return uniforms;
    }

    createParticleMesh() {
        // Create geometry - each particle is a point in texture space
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 2);
        
        for (let i = 0; i < this.particleCount; i++) {
            const x = (i % this.textureSize) / this.textureSize;
            const y = Math.floor(i / this.textureSize) / this.textureSize;
            
            positions[i * 2 + 0] = x;
            positions[i * 2 + 1] = y;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 2));
        
        // Don't compute bounding sphere for 2D texture coordinates
        geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Infinity);

        // Get color scheme for this attractor
        const colors = ColorSchemes[this.attractorType] || ColorSchemes.thomas;

        // Create shader material for rendering
        const material = new THREE.ShaderMaterial({
            uniforms: {
                positions: { value: null },
                prevPositions: { value: null },
                pointSize: { value: 2.0 },
                colorStart: { value: new THREE.Vector3(...colors.start) },
                colorEnd: { value: new THREE.Vector3(...colors.end) }
            },
            vertexShader: Shaders.renderVertex,
            fragmentShader: Shaders.renderFragment,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleMesh = new THREE.Points(geometry, material);
    }

    update(renderer, deltaTime = 1.0) {
        // Get current and next render targets
        const current = this.renderTargets[this.currentTarget];
        const next = this.renderTargets[1 - this.currentTarget];

        // Update compute shader uniforms
        this.computeMaterial.uniforms.positions.value = current.texture;
        
        // Scale dt by deltaTime for variable speed
        const attractor = getAttractorInfo(this.attractorType);
        const baseDt = attractor.params.dt;
        
        if (this.computeMaterial.uniforms.dt) {
            this.computeMaterial.uniforms.dt.value = baseDt * deltaTime;
        }

        // Render to next target (GPU computation)
        renderer.setRenderTarget(next);
        renderer.render(this.computeScene, this.computeCamera);
        renderer.setRenderTarget(null);

        // Update particle mesh uniforms
        this.particleMesh.material.uniforms.positions.value = next.texture;
        this.particleMesh.material.uniforms.prevPositions.value = current.texture;

        // Swap targets
        this.currentTarget = 1 - this.currentTarget;
    }

    getMesh() {
        return this.particleMesh;
    }

    setParameter(name, value) {
        if (this.computeMaterial.uniforms[name]) {
            this.computeMaterial.uniforms[name].value = value;
        }
    }

    setAttractorType(type, renderer) {
        if (type === this.attractorType) return;
        
        this.attractorType = type;
        
        // Recreate the system with new attractor
        this.dispose();
        this.init(renderer);
    }

    // Get nearest particles for audio synthesis - with spatial spreading
    getNearestParticles(count, cameraPosition = { x: 0, y: 0, z: 30 }, renderer) {
        if (!renderer) {
            console.warn('No renderer provided to getNearestParticles');
            return [];
        }

        // Read pixel data from current render target
        const pixels = new Float32Array(this.textureSize * this.textureSize * 4);
        
        const oldTarget = renderer.getRenderTarget();
        
        renderer.setRenderTarget(this.renderTargets[this.currentTarget]);
        renderer.readRenderTargetPixels(
            this.renderTargets[this.currentTarget],
            0, 0,
            this.textureSize, this.textureSize,
            pixels
        );
        
        // Get previous positions for velocity calculation
        const prevPixels = new Float32Array(this.textureSize * this.textureSize * 4);
        renderer.setRenderTarget(this.prevPositionsTarget);
        renderer.readRenderTargetPixels(
            this.prevPositionsTarget,
            0, 0,
            this.textureSize, this.textureSize,
            prevPixels
        );

        // Copy current positions to prev for next frame
        const copyMaterial = new THREE.MeshBasicMaterial({ 
            map: this.renderTargets[this.currentTarget].texture 
        });
        const copyGeometry = new THREE.PlaneGeometry(2, 2);
        const copyMesh = new THREE.Mesh(copyGeometry, copyMaterial);
        const copyScene = new THREE.Scene();
        copyScene.add(copyMesh);
        const copyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        renderer.setRenderTarget(this.prevPositionsTarget);
        renderer.render(copyScene, copyCamera);
        
        renderer.setRenderTarget(oldTarget);
        
        copyGeometry.dispose();
        copyMaterial.dispose();

        // Calculate distances and velocities
        const particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 4;
            const x = pixels[idx + 0];
            const y = pixels[idx + 1];
            const z = pixels[idx + 2];
            
            // Skip invalid particles
            if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
            
            const prevX = prevPixels[idx + 0];
            const prevY = prevPixels[idx + 1];
            const prevZ = prevPixels[idx + 2];
            
            const vx = x - prevX;
            const vy = y - prevY;
            const vz = z - prevZ;
            
            const distance = Math.sqrt(
                Math.pow(x - cameraPosition.x, 2) +
                Math.pow(y - cameraPosition.y, 2) +
                Math.pow(z - cameraPosition.z, 2)
            );
            
            particles.push({ x, y, z, vx, vy, vz, distance });
        }

        // Sort by distance
        particles.sort((a, b) => a.distance - b.distance);
        
        // Instead of just taking the nearest, spread them out spatially
        const selected = [];
        const minSeparation = 1.5; // Minimum distance between selected particles
        
        for (let i = 0; i < particles.length && selected.length < count; i++) {
            const candidate = particles[i];
            
            // Check if this particle is far enough from already selected ones
            let tooClose = false;
            for (let j = 0; j < selected.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(candidate.x - selected[j].x, 2) +
                    Math.pow(candidate.y - selected[j].y, 2) +
                    Math.pow(candidate.z - selected[j].z, 2)
                );
                if (dist < minSeparation) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                selected.push(candidate);
            }
        }
        
        // If we couldn't find enough separated particles, fill with nearest
        if (selected.length < count) {
            for (let i = 0; i < particles.length && selected.length < count; i++) {
                if (!selected.includes(particles[i])) {
                    selected.push(particles[i]);
                }
            }
        }
        
        return selected;
    }

    dispose() {
        this.renderTargets.forEach(target => target.dispose());
        this.prevPositionsTarget.dispose();
        
        if (this.particleMesh) {
            this.particleMesh.geometry.dispose();
            this.particleMesh.material.dispose();
        }
        
        if (this.computeMaterial) {
            this.computeMaterial.dispose();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}

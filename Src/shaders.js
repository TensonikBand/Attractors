// GLSL Shaders for GPU Particle Computation

const Shaders = {
    // Vertex shader for position computation
    computeVertex: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // Fragment shader for Thomas attractor
    thomasFragment: `
        uniform sampler2D positions;
        uniform float a;
        uniform float dt;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec3 thomasAttractor(vec3 pos) {
            float x = pos.x;
            float y = pos.y;
            float z = pos.z;
            
            float dx = -a * x + sin(y);
            float dy = -a * y + sin(z);
            float dz = -a * z + sin(x);
            
            return vec3(dx, dy, dz);
        }

        void main() {
            vec3 pos = texture2D(positions, vUv).xyz;
            vec3 delta = thomasAttractor(pos);
            
            vec3 newPos = pos + delta * dt;
            
            gl_FragColor = vec4(newPos, 1.0);
        }
    `,

    // Fragment shader for Lorenz attractor
    lorenzFragment: `
        uniform sampler2D positions;
        uniform float sigma;
        uniform float rho;
        uniform float beta;
        uniform float dt;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec3 lorenzAttractor(vec3 pos) {
            float x = pos.x;
            float y = pos.y;
            float z = pos.z;
            
            float dx = sigma * (y - x);
            float dy = x * (rho - z) - y;
            float dz = x * y - beta * z;
            
            return vec3(dx, dy, dz);
        }

        void main() {
            vec3 pos = texture2D(positions, vUv).xyz;
            vec3 delta = lorenzAttractor(pos);
            
            vec3 newPos = pos + delta * dt;
            
            gl_FragColor = vec4(newPos, 1.0);
        }
    `,

    // Fragment shader for Rössler attractor
    rosslerFragment: `
        uniform sampler2D positions;
        uniform float a;
        uniform float b;
        uniform float c;
        uniform float dt;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec3 rosslerAttractor(vec3 pos) {
            float x = pos.x;
            float y = pos.y;
            float z = pos.z;
            
            float dx = -y - z;
            float dy = x + a * y;
            float dz = b + z * (x - c);
            
            return vec3(dx, dy, dz);
        }

        void main() {
            vec3 pos = texture2D(positions, vUv).xyz;
            vec3 delta = rosslerAttractor(pos);
            
            vec3 newPos = pos + delta * dt;
            
            gl_FragColor = vec4(newPos, 1.0);
        }
    `,

    // Fragment shader for Aizawa attractor
    aizawaFragment: `
        uniform sampler2D positions;
        uniform float a;
        uniform float b;
        uniform float c;
        uniform float d;
        uniform float e;
        uniform float f;
        uniform float dt;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec3 aizawaAttractor(vec3 pos) {
            float x = pos.x;
            float y = pos.y;
            float z = pos.z;
            
            float dx = (z - b) * x - d * y;
            float dy = d * x + (z - b) * y;
            float dz = c + a * z - (z * z * z) / 3.0 - (x * x + y * y) * (1.0 + e * z) + f * z * x * x * x;
            
            return vec3(dx, dy, dz);
        }

        void main() {
            vec3 pos = texture2D(positions, vUv).xyz;
            vec3 delta = aizawaAttractor(pos);
            
            vec3 newPos = pos + delta * dt;
            
            gl_FragColor = vec4(newPos, 1.0);
        }
    `,

    // Vertex shader for particle rendering
    renderVertex: `
        uniform sampler2D positions;
        uniform float pointSize;
        varying vec3 vPosition;
        varying float vVelocity;
        
        // Previous positions for velocity calculation
        uniform sampler2D prevPositions;

        void main() {
            // Get position from texture
            vec4 posData = texture2D(positions, position.xy);
            vec3 pos = posData.xyz;
            
            // Calculate velocity from position change
            vec4 prevPosData = texture2D(prevPositions, position.xy);
            vec3 prevPos = prevPosData.xyz;
            vec3 velocity = pos - prevPos;
            vVelocity = length(velocity);
            
            vPosition = pos;
            
            // Project to screen space
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size based on distance and velocity
            float distanceScale = 300.0 / -mvPosition.z;
            gl_PointSize = pointSize * distanceScale * (1.0 + vVelocity * 2.0);
        }
    `,

    // Fragment shader for particle rendering
    renderFragment: `
        varying vec3 vPosition;
        varying float vVelocity;
        uniform vec3 colorStart;
        uniform vec3 colorEnd;

        void main() {
            // Circular particle shape
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;
            
            // Smooth edges
            float alpha = smoothstep(0.5, 0.3, dist);
            
            // Color based on position and velocity
            float colorMix = (vPosition.y + 10.0) / 20.0; // Height-based color
            vec3 color = mix(colorStart, colorEnd, colorMix);
            
            // Brightness based on velocity
            float brightness = 0.5 + vVelocity * 0.5;
            color *= brightness;
            
            gl_FragColor = vec4(color, alpha * 0.8);
        }
    `
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Shaders;
}

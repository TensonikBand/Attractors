# Strange Attractors V2

Real-time GPU-accelerated visualisation of chaotic dynamical systems with interactive controls and granular audio synthesis.

## Features

- **14 Strange Attractors**: Thomas, Lorenz, Rössler, Aizawa, Arneodo, Chen-Lee, Chua's Circuit, Dadras, Dequan Li, Halvorsen, Lorenz Mod 2, Simone, Three Scroll, Wang-Sun
- **65K Particles**: GPU-accelerated particle system running at 60fps
- **Granular Audio Synthesis**: Spatial audio mapping with reverb
- **Interactive Controls**: Mouse rotation, zoom, keyboard navigation
- **Dynamic Camera**: Auto-positions for optimal viewing of each attractor
- **Modern TypeScript**: Type-safe, modular architecture

## Quick Start

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Run development server
pnpm dev

# Run tests
pnpm test
```

Open http://localhost:3000 in your browser.

## Controls

- **Mouse Drag**: Rotate the attractor
- **Scroll Wheel**: Zoom in/out
- **H Key**: Hide/show UI panels
- **Arrow Keys**: Cycle through attractors
- **Audio Button**: Toggle granular synthesis audio
- **Volume/Reverb**: Adjust audio parameters

## Architecture

### GPU Particle System
- **Ping-Pong Rendering**: Dual WebGLRenderTarget for position computation
- **GLSL Compute Shaders**: Attractor equations run entirely on GPU
- **Vertex Shader**: Distance-based particle sizing and gradient coloring
- **Performance**: 65,536 particles at 60fps

### Audio System
- **Granular Synthesis**: 400ms grains with 6-grain overlap
- **Spatial Mapping**:
  - Y position → Musical frequency (pentatonic minor scale)
  - X position → Stereo pan
  - Z position → Filter cutoff (200-8000Hz)
- **Effects**: Convolution reverb at 50% mix
- **Update Rate**: 5Hz (200ms intervals)

### Attractor Mathematics
Each attractor implements its differential equations as GLSL fragment shaders:
- **Thomas**: Cyclically symmetric with sinusoidal nonlinearity
- **Lorenz**: Classic butterfly attractor (σ=10, ρ=28, β=8/3)
- **Rössler**: Single-banded spiral
- **Aizawa**: Complex 5-parameter system
- And 10 more unique systems

## Project Structure

```
V2/
├── src/
│   ├── attractors/           # Attractor definitions
│   │   ├── definitions/      # 14 attractor configs with params
│   │   ├── types.ts          # Type definitions
│   │   └── AttractorRegistry.ts
│   ├── rendering/            # GPU particle system
│   │   ├── core/             # GPUComputeEngine
│   │   ├── geometry/         # Particle geometry
│   │   ├── materials/        # Compute and render shaders
│   │   ├── shaders/          # GLSL code
│   │   └── ParticleSystem.ts # High-level orchestration
│   ├── audio/                # Granular synthesis
│   │   ├── GranularVoice.ts  # Grain generation
│   │   ├── AudioEngine.ts    # Voice management
│   │   └── AudioSpatialMapper.ts
│   └── main.ts               # Application entry point
├── tests/                    # Vitest unit tests
├── public/
│   └── favicon.svg
└── index.html
```

## Technologies

- **TypeScript** 5.6
- **Three.js** r170
- **Vite** 5.4
- **Vitest** 2.1
- **WebGL** (GLSL ES 1.0)
- **Web Audio API**

## References

For mathematical background on strange attractors and chaos theory, see the parent directory's README.md

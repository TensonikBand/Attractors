// Strange Attractor Definitions

const Attractors = {
    thomas: {
        name: 'Thomas',
        params: {
            a: 0.19,
            dt: 0.015
        },
        shader: 'thomasFragment',
        initialConditions: (i, total) => {
            // Cube distribution
            const size = Math.cbrt(total);
            const x = (i % size) / size * 2 - 1;
            const y = (Math.floor(i / size) % size) / size * 2 - 1;
            const z = Math.floor(i / (size * size)) / size * 2 - 1;
            return [x * 0.5, y * 0.5, z * 0.5];
        },
        bounds: {
            min: { x: -5, y: -5, z: -5 },
            max: { x: 5, y: 5, z: 5 }
        },
        paramRanges: {
            a: { min: 0.10, max: 0.30, default: 0.19 }
        }
    },

    lorenz: {
        name: 'Lorenz',
        params: {
            sigma: 10.0,
            rho: 28.0,
            beta: 8.0 / 3.0,
            dt: 0.005
        },
        shader: 'lorenzFragment',
        initialConditions: (i, total) => {
            // Small sphere around origin
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * 0.1;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            return [x, y, z + 25]; // Offset to center of attractor
        },
        bounds: {
            min: { x: -25, y: -25, z: 0 },
            max: { x: 25, y: 25, z: 50 }
        },
        paramRanges: {
            sigma: { min: 5.0, max: 15.0, default: 10.0 },
            rho: { min: 20.0, max: 35.0, default: 28.0 },
            beta: { min: 1.0, max: 4.0, default: 8.0/3.0 }
        }
    },

    rossler: {
        name: 'Rössler',
        params: {
            a: 0.2,
            b: 0.2,
            c: 5.7,
            dt: 0.02
        },
        shader: 'rosslerFragment',
        initialConditions: (i, total) => {
            // Random points in small region
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            const z = (Math.random() - 0.5) * 2;
            return [x, y, z];
        },
        bounds: {
            min: { x: -15, y: -15, z: -5 },
            max: { x: 15, y: 15, z: 25 }
        },
        paramRanges: {
            a: { min: 0.1, max: 0.3, default: 0.2 },
            b: { min: 0.1, max: 0.3, default: 0.2 },
            c: { min: 4.0, max: 8.0, default: 5.7 }
        }
    },

    aizawa: {
        name: 'Aizawa',
        params: {
            a: 0.95,
            b: 0.7,
            c: 0.6,
            d: 3.5,
            e: 0.25,
            f: 0.1,
            dt: 0.01
        },
        shader: 'aizawaFragment',
        initialConditions: (i, total) => {
            // Small random perturbations
            const x = (Math.random() - 0.5) * 0.5;
            const y = (Math.random() - 0.5) * 0.5;
            const z = (Math.random() - 0.5) * 0.5;
            return [x, y, z];
        },
        bounds: {
            min: { x: -3, y: -3, z: -3 },
            max: { x: 3, y: 3, z: 3 }
        },
        paramRanges: {
            a: { min: 0.5, max: 1.5, default: 0.95 },
            b: { min: 0.5, max: 1.0, default: 0.7 },
            c: { min: 0.3, max: 0.9, default: 0.6 }
        }
    }
};

// Helper function to get attractor info
function getAttractorInfo(type) {
    return Attractors[type] || Attractors.thomas;
}

// Helper function to map parameter 'a' from UI to attractor-specific parameter
function mapParameterA(type, value) {
    const attractor = Attractors[type];
    
    switch(type) {
        case 'thomas':
            return { a: value };
        case 'lorenz':
            // Map to rho for Lorenz (most visually interesting parameter)
            return { rho: 20 + (value - 0.10) / 0.20 * 15 }; // Maps 0.1-0.3 to 20-35
        case 'rossler':
            // Map to c for Rössler
            return { c: 4 + (value - 0.10) / 0.20 * 4 }; // Maps 0.1-0.3 to 4-8
        case 'aizawa':
            // Map to a for Aizawa
            return { a: 0.5 + (value - 0.10) / 0.20 }; // Maps 0.1-0.3 to 0.5-1.5
        default:
            return { a: value };
    }
}

// Color schemes for different attractors
const ColorSchemes = {
    thomas: {
        start: [0.2, 0.4, 1.0],  // Blue
        end: [1.0, 0.3, 0.8]      // Pink
    },
    lorenz: {
        start: [0.3, 1.0, 0.4],  // Green
        end: [1.0, 0.9, 0.2]      // Yellow
    },
    rossler: {
        start: [1.0, 0.3, 0.2],  // Red
        end: [0.3, 0.8, 1.0]      // Cyan
    },
    aizawa: {
        start: [0.8, 0.3, 1.0],  // Purple
        end: [0.3, 1.0, 0.9]      // Aqua
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Attractors, getAttractorInfo, mapParameterA, ColorSchemes };
}

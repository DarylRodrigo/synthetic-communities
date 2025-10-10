// @ts-nocheck
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Torus, Environment } from '@react-three/drei';
import { useState } from 'react';

interface ThreeSceneProps {
    className?: string;
}

export default function ThreeScene({ className = '' }: ThreeSceneProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [clicked, setClicked] = useState<string | null>(null);

    const handleClick = (name: string) => {
        setClicked(clicked === name ? null : name);
    };

    const handlePointerOver = (name: string) => {
        setHovered(name);
    };

    const handlePointerOut = () => {
        setHovered(null);
    };

    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [5, 5, 5], fov: 60 }}
                className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
            >
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff6b6b" />
                <pointLight position={[10, -10, -5]} intensity={0.5} color="#4ecdc4" />

                {/* Environment */}
                <Environment preset="night" />

                {/* Interactive Objects */}
                <Box
                    position={[-2, 0, 0]}
                    args={[1, 1, 1]}
                    onClick={() => handleClick('box')}
                    onPointerOver={() => handlePointerOver('box')}
                    onPointerOut={handlePointerOut}
                    scale={clicked === 'box' ? 1.2 : hovered === 'box' ? 1.1 : 1}
                >
                    <meshStandardMaterial
                        color={hovered === 'box' ? '#ff6b6b' : '#4ecdc4'}
                        metalness={0.7}
                        roughness={0.3}
                    />
                </Box>

                <Sphere
                    position={[0, 0, 0]}
                    args={[0.8, 32, 32]}
                    onClick={() => handleClick('sphere')}
                    onPointerOver={() => handlePointerOver('sphere')}
                    onPointerOut={handlePointerOut}
                    scale={clicked === 'sphere' ? 1.2 : hovered === 'sphere' ? 1.1 : 1}
                >
                    <meshStandardMaterial
                        color={hovered === 'sphere' ? '#ff6b6b' : '#45b7d1'}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </Sphere>

                <Torus
                    position={[2, 0, 0]}
                    args={[0.6, 0.2, 16, 32]}
                    onClick={() => handleClick('torus')}
                    onPointerOver={() => handlePointerOver('torus')}
                    onPointerOut={handlePointerOut}
                    scale={clicked === 'torus' ? 1.2 : hovered === 'torus' ? 1.1 : 1}
                >
                    <meshStandardMaterial
                        color={hovered === 'torus' ? '#ff6b6b' : '#96ceb4'}
                        metalness={0.6}
                        roughness={0.4}
                    />
                </Torus>

                {/* Ground plane */}
                <Box
                    position={[0, -2, 0]}
                    args={[20, 0.1, 20]}
                    rotation={[0, 0, 0]}
                >
                    <meshStandardMaterial
                        color="#2c3e50"
                        metalness={0.3}
                        roughness={0.7}
                    />
                </Box>

                {/* Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 text-white bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Synthetic Communities Demo</h3>
                <p className="text-sm text-gray-300 mb-2">
                    Click and drag to rotate • Scroll to zoom • Right-click to pan
                </p>
                <div className="text-xs space-y-1">
                    <p>Hovered: {hovered || 'None'}</p>
                    <p>Clicked: {clicked || 'None'}</p>
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 text-white bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-xs">
                <h4 className="font-semibold mb-2">Controls:</h4>
                <ul className="text-xs space-y-1">
                    <li>• Left click + drag: Rotate view</li>
                    <li>• Right click + drag: Pan view</li>
                    <li>• Scroll wheel: Zoom in/out</li>
                    <li>• Click objects: Select/interact</li>
                    <li>• Hover objects: Highlight</li>
                </ul>
            </div>
        </div>
    );
}

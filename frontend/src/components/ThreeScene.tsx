// @ts-nocheck
'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Torus, Environment, Html, Billboard } from '@react-three/drei';
import { useState, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
    className?: string;
}

// Audience configuration - defined outside component to prevent recreation
const AUDIENCE_CONFIG = {
    count: 17,
    colors: [
        '#4ecdc4', '#45b7d1', '#96ceb4', '#f39c12', '#e74c3c',
        '#9b59b6', '#2ecc71', '#1abc9c', '#34495e', '#e67e22',
        '#8e44ad', '#16a085', '#f1c40f', '#e74c3c', '#95a5a6',
        '#d35400', '#c0392b'
    ],
    gridSize: 5,
    spacing: 2,
    height: 0.5
};

// Candidates configuration
const CANDIDATES_CONFIG = {
    count: 3,
    colors: ['#e74c3c', '#f39c12', '#2ecc71'], // Red, Orange, Green
    stagePosition: [10, 0, 0], // Stage position
    spacing: 2.5,
    height: 1.2
};

// Generate audience array with fixed positions
const generateAudience = () => {
    const audience = [];
    const halfGrid = Math.floor(AUDIENCE_CONFIG.gridSize / 2);

    for (let i = 0; i < AUDIENCE_CONFIG.count; i++) {
        const row = Math.floor(i / AUDIENCE_CONFIG.gridSize);
        const col = i % AUDIENCE_CONFIG.gridSize;

        audience.push({
            id: `audience${i + 1}`,
            color: AUDIENCE_CONFIG.colors[i % AUDIENCE_CONFIG.colors.length],
            position: [
                (col - halfGrid) * AUDIENCE_CONFIG.spacing,
                AUDIENCE_CONFIG.height,
                (row - halfGrid) * AUDIENCE_CONFIG.spacing
            ]
        });
    }

    return audience;
};

// Generate candidates array positioned on stage
const generateCandidates = () => {
    const candidates = [];
    const stageX = CANDIDATES_CONFIG.stagePosition[0];
    const stageZ = CANDIDATES_CONFIG.stagePosition[2];
    const startZ = stageZ - (CANDIDATES_CONFIG.count - 1) * CANDIDATES_CONFIG.spacing / 2;

    for (let i = 0; i < CANDIDATES_CONFIG.count; i++) {
        candidates.push({
            id: `candidate${i + 1}`,
            color: CANDIDATES_CONFIG.colors[i],
            position: [
                stageX,
                CANDIDATES_CONFIG.height + 0.5,
                startZ + i * CANDIDATES_CONFIG.spacing
            ]
        });
    }

    return candidates;
};

// Pre-generate arrays
const AUDIENCE = generateAudience();
const CANDIDATES = generateCandidates();

// Component to show speech bubble above hovered object
function SpeechBubble({ position, children, visible }: { position: [number, number, number], children: React.ReactNode, visible: boolean }) {
    if (!visible) return null;

    // Calculate dynamic size based on text length
    const text = String(children);
    const textLength = text.length;
    const bubbleWidth = Math.max(1.5, Math.min(0.5, textLength * 0.15 + 0.5));
    const bubbleHeight = 0.4;

    return (
        <Billboard
            position={[position[0], position[1] + 2, position[2]]}
            follow={true}
            lockX={false}
            lockY={false}
            lockZ={false}
        >
            <group>
                {/* Speech bubble background - rounded oval using ellipsoid */}
                <mesh position={[0, 0, 0]} scale={[bubbleWidth, bubbleHeight, 0.2]}>
                    <sphereGeometry args={[1, 32, 16]} />
                    <meshPhysicalMaterial transmission={0.8} roughness={0.2}
                        metalness={0.1} ior={1.35} depthTest={false} />
                </mesh>

                {/* Speech bubble tail - cone shape */}
                <mesh position={[0, -bubbleHeight / 2 - 0.34, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.15, 0.3, 32, 1, false]} />
                    <meshPhysicalMaterial transmission={0.7} roughness={0.3}
                        metalness={0.2} ior={1.35} depthTest={false} />
                </mesh>

                {/* Text using Html component */}
                <Html
                    center
                    distanceFactor={8}
                    occlude={false}
                >
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#333',
                            textAlign: 'center',
                            width: `${bubbleWidth * 60}px`,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {children}
                    </div>
                </Html>
            </group>
        </Billboard>
    );
}

export default function ThreeScene({ className = '' }: ThreeSceneProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [clicked, setClicked] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<[number, number, number] | null>(null);

    const handleClick = (name: string) => {
        setClicked(clicked === name ? null : name);
    };

    const handlePointerOver = (name: string, position: [number, number, number]) => {
        setHovered(name);
        setHoveredPosition(position);
    };

    const handlePointerOut = () => {
        setHovered(null);
        setHoveredPosition(null);
    };

    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [10, 10, 10], fov: 60 }}
                className="bg-sky-200"
                shadows
                gl={{ logarithmicDepthBuffer: true }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.3} />
                <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
                <pointLight position={[-10, -10, -5]} intensity={1} color="#ff6b6b" castShadow />
                <pointLight position={[10, -10, -5]} intensity={1} color="#4ecdc4" castShadow />

                {/* Environment */}
                <Environment preset="dawn" />

                {/* Audience - Ovals in grid formation */}
                {AUDIENCE.map((obj) => (
                    <Sphere
                        key={obj.id}
                        position={obj.position}
                        args={[0.6, 32, 32]}
                        onClick={() => handleClick(obj.id)}
                        onPointerOver={() => handlePointerOver(obj.id, obj.position)}
                        onPointerOut={handlePointerOut}
                        scale={clicked === obj.id ? [1.2, 1.8, 1.2] : hovered === obj.id ? [1.1, 1.5, 1.1] : [1, 1.4, 1]}
                        castShadow
                    >
                        <meshStandardMaterial
                            color={hovered === obj.id ? '#ff6b6b' : obj.color}
                            metalness={0.7}
                            roughness={0.3}
                        />
                    </Sphere>
                ))}

                {/* Candidates - Ovals on stage */}
                {CANDIDATES.map((obj) => (
                    <Sphere
                        key={obj.id}
                        position={obj.position}
                        args={[0.6, 32, 32]}
                        onClick={() => handleClick(obj.id)}
                        onPointerOver={() => handlePointerOver(obj.id, obj.position)}
                        onPointerOut={handlePointerOut}
                        scale={clicked === obj.id ? [1.2, 1.8, 1.2] : hovered === obj.id ? [1.1, 1.5, 1.1] : [1, 1.4, 1]}
                        castShadow
                    >
                        <meshStandardMaterial
                            color={hovered === obj.id ? '#ff6b6b' : obj.color}
                            metalness={0.7}
                            roughness={0.3}
                        />
                    </Sphere>
                ))}

                {/* Ground plane */}
                <Box
                    position={[0, 0, 0]}
                    args={[50, 0.1, 50]}
                    rotation={[0, 0, 0]}
                    receiveShadow
                >
                    <meshStandardMaterial
                        color="#ecf0f1"
                        metalness={0.1}
                        roughness={0.8}
                    />
                </Box>

                {/* Stage */}
                <Box
                    position={[10, 0.5, 0]}
                    args={[2, 1, 10]}
                    rotation={[0, 0, 0]}
                    receiveShadow
                >
                    <meshStandardMaterial
                        color="#ecf0f1"
                        metalness={0.1}
                        roughness={0.8}
                    />
                </Box>

                {/* Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={false}
                />

                {/* Speech bubble for hovered object */}
                {hovered && hoveredPosition && (
                    <SpeechBubble position={hoveredPosition} visible={true}>
                        {hovered}
                    </SpeechBubble>
                )}
            </Canvas>

        </div>
    );
}

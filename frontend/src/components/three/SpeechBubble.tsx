// @ts-nocheck
'use client';

import { Billboard, Html } from '@react-three/drei';

interface SpeechBubbleProps {
    position: [number, number, number];
    children: React.ReactNode;
    visible: boolean;
}

// Component to show speech bubble above hovered object
export function SpeechBubble({ position, children, visible }: SpeechBubbleProps) {
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

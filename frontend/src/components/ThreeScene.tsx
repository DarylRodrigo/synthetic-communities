// @ts-nocheck
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useState, useRef } from 'react';
import { 
    SpeechBubble, 
    AnimatedCharacter, 
    InstancedAudience,
    SceneLighting, 
    SceneEnvironment, 
    FullscreenButton,
    AnimationControlButton,
    AUDIENCE_INSTANCE_POSITIONS,
    getRandomAnimation
} from './three';

interface ThreeSceneProps {
    className?: string;
}



export default function ThreeScene({ className = '' }: ThreeSceneProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<[number, number, number] | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isAnimating, setIsAnimating] = useState(false); // Start in paused state
    const canvasRef = useRef<HTMLDivElement>(null);
    
    // Random animations for each character
    const [joshAnimation] = useState(() => {
        const anim = getRandomAnimation();
        console.log('Josh animation:', anim);
        return anim;
    });
    const [claireAnimation] = useState(() => {
        const anim = getRandomAnimation();
        console.log('Claire animation:', anim);
        return anim;
    });
    const [brianAnimation] = useState(() => {
        const anim = getRandomAnimation();
        console.log('Brian animation:', anim);
        return anim;
    });

    const handlePointerOver = (name: string, position: [number, number, number]) => {
        setHovered(name);
        setHoveredPosition(position);
    };

    const handlePointerOut = () => {
        setHovered(null);
        setHoveredPosition(null);
    };

    const toggleAnimation = () => {
        setIsAnimating(prev => !prev);
    };

    // Mouse position tracking
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setMousePosition({ x, y });
    };

    return (
        <div
            ref={canvasRef}
            className={`w-full h-full relative ${className}`}
            onMouseMove={handleMouseMove}
        >
            <Canvas
                camera={{ 
                    position: [0, 8, 5], // Position camera above and in front of stage
                    fov: 60 
                }}
                className="bg-sky-200"
                shadows
                gl={{ logarithmicDepthBuffer: true }}
            >
                {/* Scene Lighting */}
                <SceneLighting />

                {/* Scene Environment */}
                <SceneEnvironment />

                {/* Audience - Instanced character models in 2x2 grid formation (STATIC - no animations) */}
                <InstancedAudience
                    characterFile="character male josh.fbx"
                    animationFile="animation Standing Greeting.fbx"
                    instanceCount={4}
                    instancePositions={AUDIENCE_INSTANCE_POSITIONS}
                    isAnimating={false} // Always static for audience
                    onPointerOver={(instanceId, position) => handlePointerOver(`Audience ${instanceId + 1}`, position)}
                    onPointerOut={handlePointerOut}
                />

                {/* Main Characters (CANDIDATES - animated) */}
                <AnimatedCharacter
                    characterFile="character male josh.fbx"
                    animationFile={joshAnimation}
                    position={[-3, 1, -10]} // Standing on stage (Y=1)
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    isAnimating={isAnimating}
                    onPointerOver={() => handlePointerOver('Josh', [-3, 1, -10])}
                    onPointerOut={handlePointerOut}
                />

                <AnimatedCharacter
                    characterFile="character female claire.fbx"
                    animationFile={claireAnimation}
                    position={[0, 1, -10]} // Standing on stage (Y=1)
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    isAnimating={isAnimating}
                    onPointerOver={() => handlePointerOver('Claire', [0, 1, -10])}
                    onPointerOut={handlePointerOut}
                />

                <AnimatedCharacter
                    characterFile="character male brian.fbx"
                    animationFile={brianAnimation}
                    position={[3, 1, -10]} // Standing on stage (Y=1)
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    isAnimating={isAnimating}
                    onPointerOver={() => handlePointerOver('Brian', [3, 1, -10])}
                    onPointerOut={handlePointerOut}
                />

                {/* Controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={false}
                    target={[0, 1, -10]} // Focus on the stage/candidates area (updated Y position)
                    minDistance={5} // Minimum zoom distance
                    maxDistance={20} // Maximum zoom distance
                    maxPolarAngle={Math.PI / 2} // Prevent camera from going below ground
                />

                {/* Speech bubble for hovered object */}
                {hovered && hoveredPosition && (
                    <SpeechBubble position={hoveredPosition} visible={true}>
                        {hovered}
                    </SpeechBubble>
                )}
            </Canvas>

            {/* Animation Control Button */}
            <AnimationControlButton 
                isPlaying={isAnimating} 
                onToggle={toggleAnimation} 
            />

            {/* Fullscreen Toggle Button */}
            <FullscreenButton canvasRef={canvasRef} mousePosition={mousePosition} />

        </div>
    );
}

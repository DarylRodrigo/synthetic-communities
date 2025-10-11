// @ts-nocheck
'use client';

import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Torus, Environment, Html, Billboard } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

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

// Pre-generate arrays
const AUDIENCE = generateAudience();

// Available animations for random selection
const AVAILABLE_ANIMATIONS = [
    "animation Angry.fbx",
    "animation Defeat Idle.fbx",
    "animation Standing Arguing.fbx",
    "animation Standing Greeting.fbx",
    "animation Talking.fbx",
    "animation Telling A Secret.fbx",
    "animation Texting While Standing.fbx",
    "animation Throw.fbx",
    "animation Victory.fbx",
    "animation Victory Idle.fbx",
    "animation Yelling While Standing.fbx"
];

// Function to get a random animation
const getRandomAnimation = () => {
    return AVAILABLE_ANIMATIONS[Math.floor(Math.random() * AVAILABLE_ANIMATIONS.length)];
};

// Function to get a fallback animation (guaranteed to work)
const getFallbackAnimation = () => {
    // Use a simple, reliable animation as fallback
    return "animation Standing Greeting.fbx";
};

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

// AnimatedCharacter component to load and display FBX models with separate animation files
function AnimatedCharacter({
    characterFile,
    animationFile,
    position = [0, 0, 0],
    scale = [1, 1, 1],
    onPointerOver,
    onPointerOut
}: {
    characterFile: string,
    animationFile: string,
    position?: [number, number, number],
    scale?: [number, number, number],
    onPointerOver?: () => void,
    onPointerOut?: () => void
}) {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionRef = useRef<THREE.AnimationAction | null>(null);
    const [model, setModel] = useState<THREE.Group | null>(null);
    const [adjustedPosition, setAdjustedPosition] = useState<[number, number, number]>(position);
    const [adjustedScale, setAdjustedScale] = useState<[number, number, number]>(scale);

    // Function to calculate bounding box and adjust position/scale
    const adjustCharacterPosition = (loadedModel: THREE.Group) => {
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const min = box.min;
        const max = box.max;

        // Calculate scale to make character approximately 2 units tall
        const targetHeight = 2;
        const currentHeight = size.y;
        const scaleFactor = targetHeight / currentHeight;
        const newScale: [number, number, number] = [scaleFactor, scaleFactor, scaleFactor];

        // Calculate position to place feet on ground (y = 0)
        // The bottom of the bounding box should be at y = 0
        const bottomY = min.y * scaleFactor;
        const newY = position[1] - bottomY; // Move up by the distance from origin to bottom

        const newPosition: [number, number, number] = [position[0], newY, position[2]];

        console.log(`${characterFile} - Original size:`, size);
        console.log(`${characterFile} - Min Y:`, min.y, 'Max Y:', max.y);
        console.log(`${characterFile} - Scale factor:`, scaleFactor);
        console.log(`${characterFile} - Bottom Y after scale:`, bottomY);
        console.log(`${characterFile} - New position:`, newPosition);

        setAdjustedScale(newScale);
        setAdjustedPosition(newPosition);
    };

    // Function to validate bone compatibility between animation and character model
    const validateBoneCompatibility = (characterModel: THREE.Group, animationClip: THREE.AnimationClip) => {
        // Get all bone names from the character model
        const characterBones = new Set<string>();
        characterModel.traverse((child) => {
            if (child instanceof THREE.Bone) {
                characterBones.add(child.name);
            }
        });

        console.log(`Character ${characterFile} has bones:`, Array.from(characterBones));

        // Filter animation tracks to only include bones that exist in the character
        if (animationClip.tracks) {
            const originalTrackCount = animationClip.tracks.length;
            animationClip.tracks = animationClip.tracks.filter(track => {
                // Extract bone name from track name (e.g., "mixamorig12Head.quaternion" -> "mixamorig12Head")
                const boneName = track.name.split('.')[0];
                
                // Check if this bone exists in the character model
                const boneExists = characterBones.has(boneName);
                
                if (!boneExists) {
                    console.warn(`Filtering out track for missing bone: ${track.name}`);
                }
                
                return boneExists;
            });

            const filteredTrackCount = animationClip.tracks.length;
            console.log(`Filtered animation tracks: ${originalTrackCount} -> ${filteredTrackCount} (removed ${originalTrackCount - filteredTrackCount} incompatible tracks)`);

            // If no tracks remain, the animation is incompatible
            if (filteredTrackCount === 0) {
                console.warn(`Animation ${animationFile} has no compatible tracks for character ${characterFile}`);
                return false;
            }
        }

        return true;
    };

    // Function to load and setup animation with fallback
    const loadAnimationWithFallback = async (loader: FBXLoader, characterModel: THREE.Group, primaryAnimationFile: string) => {
        // List of animations to try in order of preference
        const animationsToTry = [
            primaryAnimationFile,
            getFallbackAnimation(),
            "animation Talking.fbx",
            "animation Standing Greeting.fbx",
            "animation Victory Idle.fbx"
        ];

        for (let i = 0; i < animationsToTry.length; i++) {
            const animationFile = animationsToTry[i];
            try {
                console.log(`Attempting to load animation (attempt ${i + 1}/${animationsToTry.length}): ${animationFile}`);
                
                const animationModel = await new Promise<THREE.Group>((resolve, reject) => {
                    loader.load(
                        `/characters/${animationFile}`,
                        resolve,
                        undefined,
                        reject
                    );
                });

                // Check if animation loaded successfully
                if (animationModel.animations && animationModel.animations.length > 0) {
                    const clip = animationModel.animations[0];
                    
                    // Validate bone compatibility before returning
                    const isCompatible = validateBoneCompatibility(characterModel, clip);
                    
                    if (isCompatible) {
                        console.log(`Successfully loaded compatible animation: ${animationFile}`);
                        return animationModel;
                    } else {
                        console.warn(`Animation ${animationFile} is not compatible with character, trying next...`);
                        throw new Error(`Animation ${animationFile} has incompatible bone structure`);
                    }
                } else {
                    throw new Error(`No animations found in ${animationFile}`);
                }
            } catch (error) {
                console.warn(`Failed to load animation ${animationFile} (attempt ${i + 1}):`, error);
                
                // If this is not the last attempt, continue to next animation
                if (i < animationsToTry.length - 1) {
                    continue;
                } else {
                    console.error(`All animation attempts failed for ${characterFile}`);
                    return null;
                }
            }
        }

        return null;
    };

    // Animation loop
    useFrame((state, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    useEffect(() => {
        // Load character and animation files
        const loadModel = async () => {
            try {
                const loader = new FBXLoader();

                // Load character model
                const loadedModel = await new Promise<THREE.Group>((resolve, reject) => {
                    loader.load(
                        `/characters/${characterFile}`,
                        resolve,
                        undefined,
                        reject
                    );
                });

                // Load animation file with fallback
                const animationModel = await loadAnimationWithFallback(loader, loadedModel, animationFile);

                // Set up animations from the animation file
                if (animationModel && animationModel.animations && animationModel.animations.length > 0) {
                    const clip = animationModel.animations[0];
                    
                    mixerRef.current = new THREE.AnimationMixer(loadedModel);
                    actionRef.current = mixerRef.current.clipAction(clip);
                    actionRef.current.setLoop(THREE.LoopRepeat, Infinity); // Loop continuously
                    actionRef.current.clampWhenFinished = false; // Allow looping

                    // Additional filtering for root bone translation to prevent going underground
                    if (clip.tracks) {
                        clip.tracks = clip.tracks.filter(track => {
                            // Keep rotation and scale tracks, but exclude position tracks for root
                            return !(track.name.includes('.position') &&
                                (track.name.includes('mixamorigHips') ||
                                    track.name.includes('Hips') ||
                                    track.name.includes('root')));
                        });
                    }

                    // Auto-start the animation
                    actionRef.current.play();
                    console.log(`Auto-started animation for ${characterFile}: ${animationFile}`);
                } else {
                    console.error(`Failed to load any animation for ${characterFile}. Character will remain in T-pose.`);
                    
                    // As a last resort, try to create a simple idle animation
                    try {
                        console.log(`Attempting to create simple idle animation for ${characterFile}`);
                        
                        // Create a simple rotation animation as a last resort
                        mixerRef.current = new THREE.AnimationMixer(loadedModel);
                        
                        // Create a simple rotation clip
                        const times = [0, 2];
                        const values = [0, Math.PI * 2];
                        const rotationKF = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);
                        const clip = new THREE.AnimationClip('idle-rotation', 2, [rotationKF]);
                        
                        actionRef.current = mixerRef.current.clipAction(clip);
                        actionRef.current.setLoop(THREE.LoopRepeat, Infinity);
                        actionRef.current.play();
                        
                        console.log(`Created fallback rotation animation for ${characterFile}`);
                    } catch (rotationError) {
                        console.error(`Failed to create fallback animation for ${characterFile}:`, rotationError);
                    }
                }

                // Apply shadow properties to character
                loadedModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Adjust position and scale to ensure feet touch ground
                adjustCharacterPosition(loadedModel);

                setModel(loadedModel);
            } catch (error) {
                console.error(`Failed to load character ${characterFile}:`, error);
                // Create a fallback geometry
                const fallbackGroup = new THREE.Group();
                const geometry = new THREE.ConeGeometry(0.5, 2, 8);
                const material = new THREE.MeshStandardMaterial({ color: '#ff6b6b' });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                fallbackGroup.add(mesh);
                setModel(fallbackGroup);
            }
        };

        loadModel();
    }, [characterFile, animationFile]);

    if (!model) {
        return null; // Don't render anything while loading
    }

    return (
        <group
            ref={groupRef}
            position={adjustedPosition}
            scale={adjustedScale}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
        >
            {/* Wrapper group to maintain ground position during animation */}
            <group position={[0, 0, 0]}>
                <primitive object={model} />
            </group>
        </group>
    );
}

export default function ThreeScene({ className = '' }: ThreeSceneProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [clicked, setClicked] = useState<string | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<[number, number, number] | null>(null);
    const [joshHovered, setJoshHovered] = useState(false);
    const [claireHovered, setClaireHovered] = useState(false);
    const [brianHovered, setBrianHovered] = useState(false);
    
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenButton, setShowFullscreenButton] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

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

    const handleJoshPointerOver = () => {
        setJoshHovered(true);
    };

    const handleJoshPointerOut = () => {
        setJoshHovered(false);
    };

    const handleClairePointerOver = () => {
        setClaireHovered(true);
    };

    const handleClairePointerOut = () => {
        setClaireHovered(false);
    };

    const handleBrianPointerOver = () => {
        setBrianHovered(true);
    };

    const handleBrianPointerOut = () => {
        setBrianHovered(false);
    };

    // Fullscreen functionality
    const toggleFullscreen = async () => {
        if (!canvasRef.current) return;

        try {
            if (!isFullscreen) {
                if (canvasRef.current.requestFullscreen) {
                    await canvasRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    // Mouse position tracking
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setMousePosition({ x, y });

        // Show button when mouse is in top right corner (within 100px of top-right)
        const threshold = 100;
        const showButton = x > rect.width - threshold && y < threshold;
        setShowFullscreenButton(showButton);
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div
            ref={canvasRef}
            className={`w-full h-full relative ${className}`}
            onMouseMove={handleMouseMove}
        >
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


                {/* Josh Character Model */}
                <AnimatedCharacter
                    characterFile="character male josh.fbx"
                    animationFile={joshAnimation}
                    position={[-3, 1.5, -10]}
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    onPointerOver={handleJoshPointerOver}
                    onPointerOut={handleJoshPointerOut}
                />

                {/* Claire Character Model */}
                <AnimatedCharacter
                    characterFile="character female claire.fbx"
                    animationFile={claireAnimation}
                    position={[0, 1.5, -10]}
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    onPointerOver={handleClairePointerOver}
                    onPointerOut={handleClairePointerOut}
                />

                {/* Brian Character Model */}
                <AnimatedCharacter
                    characterFile="character male brian.fbx"
                    animationFile={brianAnimation}
                    position={[3, 1.5, -10]}
                    scale={[1, 1, 1]} // Will be automatically adjusted
                    onPointerOver={handleBrianPointerOver}
                    onPointerOut={handleBrianPointerOut}
                />

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
                    position={[0, 0.5, -10]}
                    args={[10, 1, 2]}
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

            {/* Fullscreen Toggle Button */}
            <button
                onClick={toggleFullscreen}
                className={`absolute top-4 right-4 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ease-in-out ${showFullscreenButton ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                style={{
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                {isFullscreen ? (
                    // Exit fullscreen icon (compress)
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700"
                    >
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                ) : (
                    // Enter fullscreen icon (expand)
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-700"
                    >
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                )}
            </button>

        </div>
    );
}

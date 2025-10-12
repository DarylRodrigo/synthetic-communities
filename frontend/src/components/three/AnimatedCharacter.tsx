// @ts-nocheck
'use client';

import { useFrame, useLoader } from '@react-three/fiber';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { getFallbackAnimation } from './constants';

interface AnimatedCharacterProps {
    characterFile: string;
    animationFile: string;
    position?: [number, number, number];
    scale?: [number, number, number];
    onPointerOver?: () => void;
    onPointerOut?: () => void;
    isAnimating?: boolean; // New prop to control animation state
}

// AnimatedCharacter component to load and display FBX models with separate animation files
export function AnimatedCharacter({
    characterFile,
    animationFile,
    position = [0, 0, 0],
    scale = [1, 1, 1],
    onPointerOver,
    onPointerOut,
    isAnimating = true // Default to true for backward compatibility
}: AnimatedCharacterProps) {
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
        if (mixerRef.current && isAnimating) {
            mixerRef.current.update(delta);
        }
    });

    // Handle animation state changes
    useEffect(() => {
        if (actionRef.current && typeof actionRef.current.play === 'function' && typeof actionRef.current.pause === 'function') {
            if (isAnimating) {
                actionRef.current.play();
            } else {
                actionRef.current.pause();
            }
        }
    }, [isAnimating]);

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

                    // Start animation only if isAnimating is true
                    if (isAnimating && actionRef.current && typeof actionRef.current.play === 'function') {
                        actionRef.current.play();
                        console.log(`Started animation for ${characterFile}: ${animationFile}`);
                    } else {
                        console.log(`Animation loaded but paused for ${characterFile}: ${animationFile}`);
                    }
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
                        
                        // Start fallback animation only if isAnimating is true
                        if (isAnimating && actionRef.current && typeof actionRef.current.play === 'function') {
                            actionRef.current.play();
                            console.log(`Created and started fallback rotation animation for ${characterFile}`);
                        } else {
                            console.log(`Created fallback rotation animation (paused) for ${characterFile}`);
                        }
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
    }, [characterFile, animationFile, isAnimating]);

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

// @ts-nocheck
'use client';

import { useFrame } from '@react-three/fiber';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface InstancedAudienceProps {
  characterFile: string;
  animationFile: string;
  instanceCount: number;
  instancePositions: [number, number, number][];
  isAnimating?: boolean;
  onPointerOver?: (instanceId: number, position: [number, number, number]) => void;
  onPointerOut?: () => void;
}

export function InstancedAudience({
  characterFile,
  animationFile,
  instanceCount,
  instancePositions,
  isAnimating = true,
  onPointerOver,
  onPointerOut,
}: InstancedAudienceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [mixers, setMixers] = useState<THREE.AnimationMixer[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Update animation
  useFrame((_, delta) => {
    if (isAnimating) {
      mixers.forEach((m) => m.update(delta));
    }
  });

  useEffect(() => {
    const load = async () => {
      const loader = new FBXLoader();

      // Load character model
      const model = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(`/characters/${characterFile}`, resolve, undefined, reject);
      });

      // Load animation
      const animModel = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(`/characters/${animationFile}`, resolve, undefined, reject);
      });

      // Calculate scale to make character ~2 units tall
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const targetHeight = 2;
      const scale = targetHeight / size.y;
      setScaleFactor(scale);

      const group = groupRef.current;
      const newMixers: THREE.AnimationMixer[] = [];

      for (let i = 0; i < instanceCount; i++) {
        const clone = model.clone(true);
        clone.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Position clone
        const pos = instancePositions[i % instancePositions.length];
        clone.position.set(pos[0], pos[1], pos[2]);
        clone.scale.set(scale, scale, scale);
        clone.rotation.y = Math.PI; // face stage

        // Add animation
        if (animModel.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(clone);
          const clip = animModel.animations[0];

          // Filter root motion so they don't slide
          clip.tracks = clip.tracks.filter(
            (t) =>
              !(
                t.name.includes('.position') &&
                (t.name.includes('mixamorigHips') || t.name.includes('Hips') || t.name.includes('root'))
              )
          );

          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          if (isAnimating) action.play();

          newMixers.push(mixer);
        }

        group?.add(clone);
      }

      setMixers(newMixers);
    };

    load();
  }, [characterFile, animationFile, instanceCount, instancePositions, isAnimating]);

  return <group ref={groupRef} />;
}
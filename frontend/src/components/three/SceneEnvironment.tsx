// @ts-nocheck
'use client';

import { Box, Environment } from '@react-three/drei';

// SceneEnvironment component for environment and static objects
export function SceneEnvironment() {
    return (
        <>
            {/* Environment preset for sky and atmosphere */}
            <Environment preset="dawn" />

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

            {/* Stage/platform */}
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
        </>
    );
}

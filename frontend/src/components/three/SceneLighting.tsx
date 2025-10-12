// @ts-nocheck
'use client';

// SceneLighting component for lighting setup
export function SceneLighting() {
    return (
        <>
            {/* Ambient lighting for overall scene illumination */}
            <ambientLight intensity={0.3} />
            
            {/* Main directional light for shadows and primary illumination */}
            <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
            
            {/* Colored point lights for atmosphere */}
            <pointLight position={[-10, -10, -5]} intensity={1} color="#ff6b6b" castShadow />
            <pointLight position={[10, -10, -5]} intensity={1} color="#4ecdc4" castShadow />
        </>
    );
}

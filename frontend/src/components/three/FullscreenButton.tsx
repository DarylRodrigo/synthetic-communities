// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';

interface FullscreenButtonProps {
    canvasRef: React.RefObject<HTMLDivElement>;
    mousePosition: { x: number; y: number };
}

// FullscreenButton component for toggling fullscreen mode
export function FullscreenButton({ canvasRef, mousePosition }: FullscreenButtonProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenButton, setShowFullscreenButton] = useState(false);

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

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Show button when mouse is in top right corner
    useEffect(() => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const threshold = 100;
        const showButton = mousePosition.x > rect.width - threshold && mousePosition.y < threshold;
        setShowFullscreenButton(showButton);
    }, [mousePosition, canvasRef]);

    return (
        <button
            onClick={toggleFullscreen}
            className={`absolute top-4 right-4 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ease-in-out ${
                showFullscreenButton ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
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
    );
}

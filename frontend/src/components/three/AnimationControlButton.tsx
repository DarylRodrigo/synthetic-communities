// @ts-nocheck
'use client';

interface AnimationControlButtonProps {
    isPlaying: boolean;
    onToggle: () => void;
    className?: string;
}

// AnimationControlButton component for play/pause functionality
export function AnimationControlButton({ isPlaying, onToggle, className = '' }: AnimationControlButtonProps) {
    return (
        <button
            onClick={onToggle}
            className={`absolute top-4 left-4 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-300 ease-in-out ${className}`}
            style={{
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            title={isPlaying ? 'Pause Candidate Animations' : 'Play Candidate Animations'}
        >
            {isPlaying ? (
                // Pause icon
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
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                </svg>
            ) : (
                // Play icon
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
                    <polygon points="5,3 19,12 5,21" />
                </svg>
            )}
        </button>
    );
}

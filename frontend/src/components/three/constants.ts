// Available character models for audience
export const AVAILABLE_CHARACTERS = [
    "character female claire.fbx",
    "character female martha.fbx", 
    "character female suzie.fbx",
    "character male brian.fbx",
    "character male joe.fbx",
    "character male josh.fbx",
    "character male lewis.fbx",
    "character male pete.fbx",
    "character male Remy.fbx",
    "character male roth.fbx",
    "character male shannon.fbx"
];

// Available animations for random selection
export const AVAILABLE_ANIMATIONS = [
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

// Audience configuration - defined outside component to prevent recreation
export const AUDIENCE_CONFIG = {
    count: 17,
    gridSize: 5,
    spacing: 2.5, // Increased spacing for character models
    height: 0   // Standing on ground level
};

// Function to get a random animation
export const getRandomAnimation = () => {
    return AVAILABLE_ANIMATIONS[Math.floor(Math.random() * AVAILABLE_ANIMATIONS.length)];
};

// Function to get a fallback animation (guaranteed to work)
export const getFallbackAnimation = () => {
    // Use a simple, reliable animation as fallback
    return "animation Standing Greeting.fbx";
};

// Generate audience array with random characters and animations
export const generateAudience = () => {
    const audience = [];
    const halfGrid = Math.floor(AUDIENCE_CONFIG.gridSize / 2);

    for (let i = 0; i < AUDIENCE_CONFIG.count; i++) {
        const row = Math.floor(i / AUDIENCE_CONFIG.gridSize);
        const col = i % AUDIENCE_CONFIG.gridSize;

        // Select random character and animation
        const randomCharacter = AVAILABLE_CHARACTERS[Math.floor(Math.random() * AVAILABLE_CHARACTERS.length)];
        const randomAnimation = AVAILABLE_ANIMATIONS[Math.floor(Math.random() * AVAILABLE_ANIMATIONS.length)];

        audience.push({
            id: `audience${i + 1}`,
            characterFile: randomCharacter,
            animationFile: randomAnimation,
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
export const AUDIENCE = generateAudience();

// Log audience character assignments
console.log('Audience character assignments:');
AUDIENCE.forEach((member, index) => {
    console.log(`Audience ${index + 1}: ${member.characterFile} with ${member.animationFile}`);
});

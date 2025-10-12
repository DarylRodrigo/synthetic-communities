# Three.js Components

This directory contains modular components for the Three.js scene, extracted from the main `ThreeScene.tsx` file for better organization and maintainability.

## Components

### `constants.ts`
Contains all configuration constants and utility functions:
- Character model file names
- Animation file names  
- Audience configuration
- Utility functions for random animation selection and fallback handling

### `SpeechBubble.tsx`
A reusable component for displaying speech bubbles above 3D objects:
- Dynamic sizing based on text length
- Glass-like material with transparency
- Billboard behavior to always face the camera
- HTML text overlay for crisp text rendering

### `AnimationControlButton.tsx`
Play/pause button for controlling all animations:
- Clean play/pause icons with smooth transitions
- Positioned in top-left corner for easy access
- Glass-like styling consistent with other UI elements
- Tooltip support for better UX

### `AnimatedCharacter.tsx`
Complex component for loading and animating FBX character models:
- Loads character and animation files separately
- Bone compatibility validation
- Automatic fallback animation system
- Position and scale adjustment for proper ground placement
- Shadow casting and receiving
- Error handling with fallback geometry
- **NEW**: Animation control via `isAnimating` prop

### `SceneLighting.tsx`
Manages all lighting for the 3D scene:
- Ambient light for overall illumination
- Directional light for shadows and primary lighting
- Colored point lights for atmospheric effects

### `SceneEnvironment.tsx`
Handles static environment objects:
- Environment preset for sky and atmosphere
- Ground plane with proper materials
- Stage/platform for characters

### `FullscreenButton.tsx`
Interactive fullscreen toggle button:
- Appears when mouse is in top-right corner
- Smooth animations and transitions
- Proper fullscreen API handling
- Responsive design with backdrop blur

### `index.ts`
Central export file for all components and constants.

## Usage

```tsx
import { 
    SpeechBubble, 
    AnimatedCharacter, 
    SceneLighting, 
    SceneEnvironment, 
    FullscreenButton,
    AnimationControlButton,
    AUDIENCE,
    getRandomAnimation
} from './three';
```

## Performance Features

### Animation Control
- **Play/Pause Button**: Toggle candidate animations on/off (audience stays static)
- **Starts Paused**: Scene loads with candidate animations paused for better performance
- **Selective Control**: Only controls the 3 main candidates (Josh, Claire, Brian)
- **Static Audience**: 17 audience members remain static to prevent performance issues
- **Smooth Transitions**: Animations pause/resume smoothly without jarring stops

## Benefits of Modularization

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be used in other scenes
3. **Maintainability**: Easier to debug and modify individual features
4. **Testability**: Each component can be tested in isolation
5. **Code Organization**: Cleaner file structure and imports
6. **Performance**: Better tree-shaking and code splitting opportunities

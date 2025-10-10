# Synthetic Communities Frontend

A Next.js application with Three.js integration for visualizing synthetic communities simulation.

## Features

- **3D Visualization**: Interactive Three.js scene with multiple geometric objects
- **Real-time Interaction**: Click, hover, and camera controls
- **Modern UI**: Built with Next.js 15, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Demo Scene

The demo scene includes:
- **Interactive Objects**: Box, Sphere, and Torus with hover and click effects
- **Dynamic Lighting**: Ambient, directional, and point lights with colors
- **Camera Controls**: Orbit controls with auto-rotation
- **Environment**: Night preset environment for atmospheric lighting
- **Ground Plane**: Large platform for objects to rest on

## Controls

- **Left Click + Drag**: Rotate camera around the scene
- **Right Click + Drag**: Pan camera view
- **Scroll Wheel**: Zoom in/out
- **Click Objects**: Select and interact with 3D objects
- **Hover Objects**: Highlight objects on mouse over

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm 8.19.2 or higher

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Three.js**: 3D graphics library
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for react-three-fiber

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       └── ThreeScene.tsx
├── public/
├── package.json
└── README.md
```

## Development

The application uses:
- **ESLint**: Code linting and formatting
- **TypeScript**: Type checking
- **Tailwind CSS**: Styling and responsive design

## Future Enhancements

- Integration with backend API for real-time data
- More complex 3D models and animations
- User interface panels for simulation controls
- Data visualization components
- Multi-user collaboration features
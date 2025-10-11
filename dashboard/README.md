# Persona Dashboard

Interactive visualization dashboard for synthetic community personas.

## Features

- **Demographics Tab**: Age distribution, ethnicity breakdown, and socioeconomic snapshots
- **Geographic Tab**: Interactive heat map showing population distribution across Swiss cities
- **Psychological Tab**: K-means clustering visualization of personality profiles with PCA dimensionality reduction
- **Cultural Tab**: Religious diversity, cultural backgrounds, and interest distributions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
cd dashboard
npm install
```

### Running the Dashboard

1. Make sure you have persona data at `dashboard/public/personas.jsonl`
2. Start the development server:

```bash
npm run dev
```

3. Open your browser at `http://localhost:3000`

### Updating Data

To refresh the persona data:

```bash
# From the project root
Copy-Item "backend\data\personas.jsonl" "dashboard\public\personas.jsonl"
```

Or use the 'Refresh Data' button in the dashboard sidebar.

## Technologies

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Plotly.js** - Interactive charts and graphs
- **Leaflet** - Interactive maps
- **ml-pca** - Principal Component Analysis
- **ml-kmeans** - K-means clustering

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── DemographicsTab.jsx
│   │   ├── GeographicTab.jsx
│   │   ├── PsychologicalTab.jsx
│   │   └── CulturalTab.jsx
│   ├── utils/
│   │   ├── dataLoader.js
│   │   ├── clustering.js
│   │   └── geocoding.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
└── public/
    └── personas.jsonl
```

## Future Enhancements

- Filter personas by demographic attributes
- Export visualizations as images
- Compare different persona subsets
- Real-time data updates


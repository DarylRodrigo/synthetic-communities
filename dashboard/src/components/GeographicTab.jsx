import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCityCounts, getDatasetLocation } from '../utils/dataLoader';
import { geocodeCities } from '../utils/geocoding';

export default function GeographicTab({ personas }) {
  const [geocodedData, setGeocodedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topN, setTopN] = useState(20);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Memoize city counts to avoid recalculating on every render
  const cityCounts = useMemo(() => {
    return getCityCounts(personas);
  }, [personas]);

  // Memoize top cities to avoid recalculating on every render
  const topCities = useMemo(() => {
    const sortedCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    return Object.fromEntries(sortedCities);
  }, [cityCounts, topN]);

  // Detect the primary location/country from the dataset
  const datasetLocation = useMemo(() => {
    return getDatasetLocation(personas);
  }, [personas]);

  // Map center coordinates based on detected location
  const mapCenter = useMemo(() => {
    const centers = {
      'CH': [46.8182, 8.2275], // Switzerland
      'DE': [51.1657, 10.4515], // Germany
      'FR': [46.2276, 2.2137],  // France
      'IT': [41.8719, 12.5674], // Italy
      'AT': [47.5162, 14.5501]  // Austria
    };
    return centers[datasetLocation] || [46.8182, 8.2275]; // Default to Switzerland
  }, [datasetLocation]);

  const loadGeoData = useCallback(async () => {
    setLoading(true);
    setProgress({ current: 0, total: Object.keys(topCities).length });

    try {
      const geocoded = await geocodeCities(topCities, (current, total) => {
        setProgress({ current, total });
      }, datasetLocation);

      setGeocodedData(geocoded);
    } catch (error) {
      console.error('Error loading geographic data:', error);
    } finally {
      setLoading(false);
    }
  }, [topCities, datasetLocation]);

  useEffect(() => {
    // Only load geo data if we have cities to geocode
    if (Object.keys(topCities).length > 0) {
      loadGeoData();
    }
  }, [loadGeoData]);

  const handleSampleChange = (e) => {
    setTopN(parseInt(e.target.value));
  };

  // Memoize max count for normalization to avoid recalculation
  const maxCount = useMemo(() => {
    return geocodedData.length > 0 ? Math.max(...geocodedData.map(d => d.count)) : 1;
  }, [geocodedData]);

  // Memoize radius calculation
  const getRadius = useCallback((count) => {
    return Math.sqrt(count / maxCount) * 30 + 5;
  }, [maxCount]);

  // Memoize color calculation
  const getColor = useCallback((count) => {
    const intensity = count / maxCount;
    return `rgba(255, 0, 0, ${0.3 + intensity * 0.7})`;
  }, [maxCount]);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Geographic Distribution</h2>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
            🗺️ Loading map data...
          </div>
          <div style={{ fontSize: '1.2rem', color: '#555' }}>
            Geocoding cities: {progress.current} / {progress.total}
          </div>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            height: '20px',
            backgroundColor: '#ddd',
            borderRadius: '10px',
            margin: '20px auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#4A90E2',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '10px' }}>
            This may take a moment as we fetch coordinates from OpenStreetMap...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='tab-content'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Geographic Distribution</h2>
          <p>
            Population heatmap across {datasetLocation === 'DE' ? 'German' : datasetLocation === 'CH' ? 'Swiss' : 'regional'} cities
            {datasetLocation !== 'CH' && ` • Detected location: ${datasetLocation}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor='topN' style={{ fontWeight: 'bold' }}>Show top:</label>
          <select 
            id='topN'
            value={topN} 
            onChange={handleSampleChange}
            style={{ 
              padding: '8px 12px', 
              fontSize: '1rem',
              borderRadius: '5px',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            <option value={10}>10 cities</option>
            <option value={20}>20 cities</option>
            <option value={30}>30 cities</option>
            <option value={50}>50 cities</option>
            <option value={100}>100 cities</option>
            <option value={9999}>All cities</option>
          </select>
        </div>
      </div>
      
      <div className='chart-card' style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ height: '600px', width: '100%' }}>
        <MapContainer
          center={mapCenter}
          zoom={datasetLocation === 'CH' ? 8 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {geocodedData.map((data, idx) => (
            <CircleMarker
              key={idx}
              center={[data.lat, data.lon]}
              radius={getRadius(data.count)}
              fillColor={getColor(data.count)}
              color='#ff0000'
              weight={1}
              fillOpacity={0.6}
            >
              <Popup>
                <strong>{data.city}</strong>
                <br />
                Population: {data.count}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        </div>
      </div>

      <div className='chart-card'>
        <h3>Top Cities by Population</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Rank</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>City</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {geocodedData
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((data, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{idx + 1}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{data.city}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{data.count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


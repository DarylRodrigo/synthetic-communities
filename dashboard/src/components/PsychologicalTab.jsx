import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { extractPersonalityFeatures, performPCA, performKMeansClustering, getClusterStats } from '../utils/clustering';

export default function PsychologicalTab({ personas }) {
  const { pcaData, clusters, clusterStats } = useMemo(() => {
    try {
      const features = extractPersonalityFeatures(personas);
      
      if (!features || features.length === 0) {
        return { pcaData: [], clusters: [], clusterStats: {} };
      }
      
      const pcaResult = performPCA(features, 2);
      
      if (!pcaResult || !Array.isArray(pcaResult) || pcaResult.length === 0) {
        console.error('PCA result is invalid');
        return { pcaData: [], clusters: [], clusterStats: {} };
      }
      
      const clusterLabels = performKMeansClustering(features, 5);
      const stats = getClusterStats(personas, clusterLabels);
      
      return {
        pcaData: pcaResult.map((point, idx) => ({
          x: point[0],
          y: point[1],
          cluster: clusterLabels[idx],
          name: personas[idx].name,
          ethnicity: personas[idx].ethnicity,
          age: personas[idx].age
        })),
        clusters: clusterLabels,
        clusterStats: stats
      };
    } catch (error) {
      console.error('Error in psychological clustering:', error);
      return { pcaData: [], clusters: [], clusterStats: {} };
    }
  }, [personas]);
  
  if (!pcaData || pcaData.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Psychological Clustering</h2>
        <p>No data available for clustering analysis.</p>
      </div>
    );
  }

  // Prepare data for Plotly scatter plot
  const traces = Object.keys(clusterStats).map(clusterId => {
    const clusterData = pcaData.filter(d => d.cluster === parseInt(clusterId));
    return {
      x: clusterData.map(d => d.x),
      y: clusterData.map(d => d.y),
      mode: 'markers',
      type: 'scatter',
      name: `Cluster ${parseInt(clusterId) + 1}`,
      text: clusterData.map(d => `${d.name}<br>Age: ${d.age}<br>Ethnicity: ${d.ethnicity}`),
      marker: { size: 8 }
    };
  });

  return (
    <div className='tab-content'>
      <h2>Psychological Clustering</h2>
      <p>K-means clustering (k=5) based on personality traits and behavioral indicators</p>
      
      <div className='chart-card'>
        <h3>2D Visualization (PCA)</h3>
        <Plot
          data={traces}
          layout={{
            width: 1000,
            height: 600,
            title: 'Persona Clusters in 2D Psychological Space',
            xaxis: { title: 'Principal Component 1' },
            yaxis: { title: 'Principal Component 2' },
            hovermode: 'closest'
          }}
        />
      </div>

      <h2 className='section-header'>Cluster Characteristics</h2>
      <div>
        {Object.entries(clusterStats).map(([clusterId, stats]) => (
          <div key={clusterId} className='chart-card' style={{ marginBottom: '24px' }}>
            <h4>Cluster {parseInt(clusterId) + 1} (n={stats.count})</h4>
            
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div>
                <h5>Average Personality Traits</h5>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li><strong>Openness:</strong> {stats.avgTraits.openness.toFixed(2)}</li>
                  <li><strong>Conscientiousness:</strong> {stats.avgTraits.conscientiousness.toFixed(2)}</li>
                  <li><strong>Extraversion:</strong> {stats.avgTraits.extraversion.toFixed(2)}</li>
                  <li><strong>Agreeableness:</strong> {stats.avgTraits.agreeableness.toFixed(2)}</li>
                  <li><strong>Neuroticism:</strong> {stats.avgTraits.neuroticism.toFixed(2)}</li>
                </ul>
              </div>
              
              <div>
                <h5>Behavioral Indicators</h5>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li><strong>Susceptibility:</strong> {stats.avgSusceptibility.toFixed(2)}</li>
                  <li><strong>Trust in Institutions:</strong> {stats.avgTrust.toFixed(2)}</li>
                  <li><strong>Average Age:</strong> {stats.avgAge.toFixed(1)} years</li>
                </ul>
              </div>
              
              <div>
                <h5>Top Ethnicities</h5>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {Object.entries(stats.ethnicities)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([eth, count]) => (
                      <li key={eth}>{eth}: {count}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


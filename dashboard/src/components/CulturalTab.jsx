import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { getReligionCounts, getCulturalBackgroundCounts, getReligionByEthnicity, getInterestsFrequency } from '../utils/dataLoader';

export default function CulturalTab({ personas }) {
  const religions = useMemo(() => getReligionCounts(personas), [personas]);
  const culturalBgs = useMemo(() => getCulturalBackgroundCounts(personas), [personas]);
  const religionByEth = useMemo(() => getReligionByEthnicity(personas), [personas]);
  const interests = useMemo(() => getInterestsFrequency(personas), [personas]);

  // Prepare data for stacked bar chart (religion by ethnicity)
  const ethnicities = Object.keys(religionByEth);
  const allReligions = [...new Set(Object.values(religionByEth).flatMap(r => Object.keys(r)))];
  
  const stackedTraces = allReligions.map(religion => ({
    x: ethnicities,
    y: ethnicities.map(eth => religionByEth[eth][religion] || 0),
    name: religion,
    type: 'bar'
  }));

  // Top interests
  const topInterests = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  return (
    <div className='tab-content'>
      <h2>Cultural & Diversity Insights</h2>
      <p>Religious affiliations, cultural backgrounds, and interest patterns</p>
      
      <div className='chart-card'>
        <h3>Religious Distribution</h3>
        <Plot
          data={[{
            values: Object.values(religions),
            labels: Object.keys(religions),
            type: 'pie',
            hole: 0.4,
            marker: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#C39BD3'] }
          }]}
          layout={{
            width: 600,
            height: 400,
            title: 'Religion Distribution'
          }}
        />
      </div>

      <div className='chart-card'>
        <h3>Cultural Background</h3>
        <Plot
          data={[{
            x: Object.keys(culturalBgs),
            y: Object.values(culturalBgs),
            type: 'bar',
            marker: { color: '#E67E22' }
          }]}
          layout={{
            width: 1000,
            height: 400,
            title: 'Cultural Background Distribution',
            xaxis: { title: 'Cultural Background', tickangle: -45 },
            yaxis: { title: 'Count' }
          }}
        />
      </div>

      <div className='chart-card'>
        <h3>Religion by Ethnicity</h3>
        <Plot
          data={stackedTraces}
          layout={{
            width: 1200,
            height: 500,
            title: 'Religious Composition by Ethnicity',
            barmode: 'stack',
            xaxis: { title: 'Ethnicity', tickangle: -45 },
            yaxis: { title: 'Count' }
          }}
        />
      </div>

      <div className='chart-card'>
        <h3>Top Interests</h3>
        <Plot
          data={[{
            x: topInterests.map(i => i[0]),
            y: topInterests.map(i => i[1]),
            type: 'bar',
            marker: { color: '#8E44AD' }
          }]}
          layout={{
            width: 1000,
            height: 400,
            title: 'Most Common Interests',
            xaxis: { title: 'Interest', tickangle: -45 },
            yaxis: { title: 'Frequency' }
          }}
        />
      </div>

      <div className='chart-card'>
        <h3>Cultural Diversity Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <p><strong>Total Religions:</strong> {Object.keys(religions).length}</p>
          <p><strong>Total Cultural Backgrounds:</strong> {Object.keys(culturalBgs).length}</p>
          <p><strong>Total Unique Interests:</strong> {Object.keys(interests).length}</p>
          <p><strong>Most Common Religion:</strong> {
            Object.entries(religions).sort((a, b) => b[1] - a[1])[0]?.[0]
          } ({Object.entries(religions).sort((a, b) => b[1] - a[1])[0]?.[1]} personas)</p>
          <p><strong>Most Common Cultural Background:</strong> {
            Object.entries(culturalBgs).sort((a, b) => b[1] - a[1])[0]?.[0]
          } ({Object.entries(culturalBgs).sort((a, b) => b[1] - a[1])[0]?.[1]} personas)</p>
        </div>
      </div>
    </div>
  );
}


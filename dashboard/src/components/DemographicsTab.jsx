import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { getAgeBins, getEthnicityCounts, getEducationCounts, getIncomeCounts, getSectorCounts } from '../utils/dataLoader';

export default function DemographicsTab({ personas }) {
  const ageBins = useMemo(() => getAgeBins(personas), [personas]);
  const ethnicities = useMemo(() => getEthnicityCounts(personas), [personas]);
  const education = useMemo(() => getEducationCounts(personas), [personas]);
  const income = useMemo(() => getIncomeCounts(personas), [personas]);
  const sectors = useMemo(() => getSectorCounts(personas), [personas]);

  return (
    <div className='tab-content'>
      <h2>Demographics Overview</h2>
      <p>Population distribution across age groups, ethnicities, and socioeconomic factors</p>
      
      <div className='chart-card'>
        <h3>Age Distribution</h3>
        <Plot
          data={[{
            x: Object.keys(ageBins),
            y: Object.values(ageBins),
            type: 'bar',
            marker: { color: '#4A90E2' }
          }]}
          layout={{
            width: 800,
            height: 400,
            title: 'Population by Age Group',
            xaxis: { title: 'Age Group' },
            yaxis: { title: 'Count' }
          }}
        />
      </div>

      <div className='chart-card'>
        <h3>Ethnicity Distribution</h3>
        <Plot
          data={[{
            x: Object.keys(ethnicities),
            y: Object.values(ethnicities),
            type: 'bar',
            marker: { color: '#E94B3C' }
          }]}
          layout={{
            width: 1000,
            height: 400,
            title: 'Population by Ethnicity',
            xaxis: { title: 'Ethnicity', tickangle: -45 },
            yaxis: { title: 'Count' }
          }}
        />
      </div>

      <h2 className='section-header'>Socioeconomic Snapshots</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className='chart-card'>
          <h3>Education Level</h3>
          <Plot
            data={[{
              values: Object.values(education),
              labels: Object.keys(education),
              type: 'pie',
              marker: { colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'] }
            }]}
            layout={{
              width: 450,
              height: 400,
              title: 'Education Distribution'
            }}
          />
        </div>

        <div className='chart-card'>
          <h3>Income Bracket</h3>
          <Plot
            data={[{
              x: Object.keys(income),
              y: Object.values(income),
              type: 'bar',
              marker: { color: '#6C5CE7' }
            }]}
            layout={{
              width: 450,
              height: 400,
              title: 'Income Distribution',
              xaxis: { tickangle: -45 }
            }}
          />
        </div>
      </div>

      <div className='chart-card'>
        <h3>Job Sectors</h3>
        <Plot
          data={[{
            x: Object.keys(sectors),
            y: Object.values(sectors),
            type: 'bar',
            marker: { color: '#00B894' }
          }]}
          layout={{
            width: 1000,
            height: 400,
            title: 'Employment by Sector',
            xaxis: { title: 'Sector', tickangle: -45 },
            yaxis: { title: 'Count' }
          }}
        />
      </div>
    </div>
  );
}


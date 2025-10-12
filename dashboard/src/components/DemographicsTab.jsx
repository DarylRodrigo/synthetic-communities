import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { getAgeBins, getEthnicityCounts, getEducationCounts, getIncomeCounts, getSectorCounts, getInterestsFrequency, getEducationIncomeFlows, getAgeGenderDistribution, getEthnicityWorldMap } from '../utils/dataLoader';

// Simple word cloud component
function WordCloud({ data, title }) {
  const words = useMemo(() => {
    const sorted = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50); // Top 50 words

    const maxCount = sorted[0]?.[1] || 1;
    const minCount = sorted[sorted.length - 1]?.[1] || 1;

    return sorted.map(([word, count]) => {
      // Normalize size based on frequency (10px to 30px)
      const size = 10 + ((count - minCount) / (maxCount - minCount)) * 20;
      // Random position (in a real implementation, you'd use a proper layout algorithm)
      const x = Math.random() * 80 + 10; // 10-90%
      const y = Math.random() * 80 + 10; // 10-90%

      return {
        word,
        count,
        size,
        x,
        y,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    });
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fafafa' }}>
      <h4 style={{ textAlign: 'center', margin: '16px 0', color: '#1e293b' }}>{title}</h4>
      {words.map((item, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
            fontWeight: 'bold',
            color: item.color,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            cursor: 'default',
            userSelect: 'none',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap'
          }}
          title={`${item.word}: ${item.count} occurrences`}
        >
          {item.word}
        </div>
      ))}
    </div>
  );
}

export default function DemographicsTab({ personas }) {
  const ageBins = useMemo(() => getAgeBins(personas), [personas]);
  const ethnicities = useMemo(() => getEthnicityCounts(personas), [personas]);
  const education = useMemo(() => getEducationCounts(personas), [personas]);
  const income = useMemo(() => getIncomeCounts(personas), [personas]);
  const sectors = useMemo(() => getSectorCounts(personas), [personas]);
  const interests = useMemo(() => getInterestsFrequency(personas), [personas]);
  const educationIncomeFlows = useMemo(() => getEducationIncomeFlows(personas, 50), [personas]);
  const ageGenderData = useMemo(() => getAgeGenderDistribution(personas), [personas]);
  const ethnicityWorldMap = useMemo(() => getEthnicityWorldMap(personas), [personas]);

  // Sort income brackets from low to high
  const sortedIncome = useMemo(() => {
    // Define proper income order mapping (case-insensitive)
    const incomeOrderMap = {
      'low': 0,
      'lower_middle': 1,
      'middle_low': 1, // Alternative spelling
      'middle': 2,
      'upper_middle': 3,
      'middle_high': 3, // Alternative spelling
      'high': 4
    };

    // Label mapping for better readability
    const incomeLabels = {
      'low': 'Low',
      'lower_middle': 'Lower Middle',
      'middle_low': 'Lower Middle', // Alternative spelling
      'middle': 'Middle',
      'upper_middle': 'Upper Middle',
      'middle_high': 'Upper Middle', // Alternative spelling
      'high': 'High'
    };

    const sortedKeys = Object.keys(income).sort((a, b) => {
      const aKey = a.toLowerCase();
      const bKey = b.toLowerCase();

      const indexA = incomeOrderMap[aKey] !== undefined ? incomeOrderMap[aKey] : 999;
      const indexB = incomeOrderMap[bKey] !== undefined ? incomeOrderMap[bKey] : 999;

      return indexA - indexB;
    });

    return {
      keys: sortedKeys.map(key => incomeLabels[key.toLowerCase()] || key),
      values: sortedKeys.map(key => income[key])
    };
  }, [income]);

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

      {/* World Map for Ethnicity Distribution */}
      <div className='chart-card'>
        <h3>Global Ethnicity Distribution</h3>
        <Plot
          data={[{
            type: 'choropleth',
            locations: ethnicityWorldMap.isoCodes,
            z: ethnicityWorldMap.values,
            text: ethnicityWorldMap.hoverText,
            colorscale: [
              [0, '#f7fbff'],
              [0.2, '#deebf7'],
              [0.4, '#c6dbef'],
              [0.6, '#9ecae1'],
              [0.8, '#6baed6'],
              [1, '#2171b5']
            ],
            colorbar: {
              title: 'Population Count',
              thickness: 20,
              len: 0.7
            },
            hovertemplate: '<b>%{text}</b><extra></extra>',
            showscale: true
          }]}
          layout={{
            width: 1000,
            height: 500,
            title: 'Ethnic Origins by Country',
            geo: {
              showframe: false,
              showcoastlines: true,
              projection: {
                type: 'natural earth'
              },
              center: { lon: 8, lat: 47 }, // Center on Europe/Switzerland
              scope: 'world'
            }
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
              x: sortedIncome.keys,
              y: sortedIncome.values,
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

      {/* Word Cloud for Interests */}
      <div className='chart-card'>
        <h3>Popular Interests</h3>
        <WordCloud data={interests} title="Most Common Interests" />
      </div>

      {/* Sankey Diagram: Education -> Income Flows */}
      <div className='chart-card'>
        <h3>Education to Income Pathways</h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
          Shows career progression from education levels to income brackets (filtered to education levels with ≥50 data points)
        </p>
        <Plot
          data={[{
            type: 'sankey',
            orientation: 'h',
            node: {
              pad: 15,
              thickness: 20,
              line: { color: 'black', width: 0.5 },
              label: [...new Set([...educationIncomeFlows.map(f => f.source), ...educationIncomeFlows.map(f => f.target)])],
              color: 'rgba(31, 119, 180, 0.8)'
            },
            link: {
              source: educationIncomeFlows.map(f => [...new Set([...educationIncomeFlows.map(f => f.source), ...educationIncomeFlows.map(f => f.target)])].indexOf(f.source)),
              target: educationIncomeFlows.map(f => [...new Set([...educationIncomeFlows.map(f => f.source), ...educationIncomeFlows.map(f => f.target)])].indexOf(f.target)),
              value: educationIncomeFlows.map(f => f.value),
              color: 'rgba(255, 127, 14, 0.3)'
            }
          }]}
          layout={{
            width: 1000,
            height: 500,
            title: 'Education to Income Flow',
            font: { size: 12 }
          }}
        />
      </div>

      {/* Population Pyramid by Gender */}
      <div className='chart-card'>
        <h3>Population Pyramid by Gender</h3>
        <Plot
          data={[
            {
              x: Object.values(ageGenderData).map(d => -d.male), // Negative for males (left side)
              y: Object.keys(ageGenderData),
              type: 'bar',
              name: 'Male',
              orientation: 'h',
              marker: { color: '#4A90E2' }
            },
            {
              x: Object.values(ageGenderData).map(d => d.female), // Positive for females (right side)
              y: Object.keys(ageGenderData),
              type: 'bar',
              name: 'Female',
              orientation: 'h',
              marker: { color: '#E94B3C' }
            }
          ]}
          layout={{
            width: 800,
            height: 400,
            title: 'Population Distribution by Age and Gender',
            barmode: 'overlay',
            xaxis: {
              title: 'Population Count',
              tickformat: ','
            },
            yaxis: {
              title: 'Age Group',
              autorange: 'reversed' // Reverse to show youngest at top
            },
            legend: {
              x: 0.8,
              y: 0.9
            }
          }}
        />
      </div>
    </div>
  );
}


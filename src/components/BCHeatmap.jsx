import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

const BCHeatmap = ({ isCompact = false }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load GeoJSON data
        const geojsonResponse = await fetch('/data/chsa_2022_wgs (3).geojson');
        if (!geojsonResponse.ok) {
          throw new Error('Failed to load GeoJSON data');
        }
        const geojson = await geojsonResponse.json();
        console.log('GeoJSON loaded:', geojson.features.length, 'features');
        setGeojsonData(geojson);

        // Load CSV data
        const csvResponse = await fetch('/data/CHSA_costs (3).csv');
        if (!csvResponse.ok) {
          throw new Error('Failed to load CSV data');
        }
        const csvText = await csvResponse.text();
        const csv = parseCSV(csvText);
        console.log('CSV loaded:', csv.length, 'rows');
        setCsvData(csv);

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const calculateAverageCosts = () => {
    if (!csvData) return {};

    const costsByCHSA = {};
    
    csvData.forEach(row => {
      const chsaName = row.CHSA_Name;
      const unitCost = parseFloat(row.unit_cost);
      
      if (chsaName && !isNaN(unitCost)) {
        if (!costsByCHSA[chsaName]) {
          costsByCHSA[chsaName] = [];
        }
        costsByCHSA[chsaName].push(unitCost);
      }
    });

    const averageCosts = {};
    Object.keys(costsByCHSA).forEach(chsaName => {
      const costs = costsByCHSA[chsaName];
      const average = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      averageCosts[chsaName] = average;
    });

    console.log('Average costs calculated for', Object.keys(averageCosts).length, 'CHSAs');
    return averageCosts;
  };

  if (loading) {
    return <div>Loading heatmap data...</div>;
  }

  if (error) {
    return <div>Error loading data: {error}</div>;
  }

  if (!geojsonData || !csvData) {
    return <div>No data available</div>;
  }

  const averageCosts = calculateAverageCosts();
  
  // Prepare data for choropleth map
  const locations = [];
  const z = [];
  const text = [];
  let matchedCount = 0;

  geojsonData.features.forEach(feature => {
    const chsaName = feature.properties.CHSA_Name;
    const averageCost = averageCosts[chsaName];
    
    if (averageCost !== undefined) {
      matchedCount++;
      locations.push(chsaName);
      z.push(averageCost);
      text.push(`${chsaName}<br>Average Cost: $${averageCost.toFixed(2)}`);
    }
  });

  console.log('Choropleth data prepared:', matchedCount, 'matched CHSAs');

  const layout = {
    title: isCompact ? 'BC Health Costs' : 'British Columbia Health Service Areas - Unit Costs',
    mapbox: {
      style: 'carto-positron',
      center: {
        lat: 55,
        lon: -127.6476
      },
      zoom: 3.5
    },
    autosize: true,
    margin: {
      l: 0,
      r: 0,
      t: isCompact ? 10 : 50,
      b: 0
    },
    showlegend: false
  };

  const data = [{
    type: 'choroplethmapbox',
    geojson: geojsonData,
    featureidkey: 'properties.CHSA_Name',
    locations: locations,
    z: z,
    text: text,
    colorscale: 'blues',
    colorbar: {
      title: 'Average Unit Cost ($)',
      thickness: 8,
      len: isCompact ? 0.1 : 0.5
    },
    hovertemplate: '%{text}<extra></extra>',
    marker: {
      opacity: 0.8,
      line: {
        width: 1,
        color: 'white'
      }
    }
  }];

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      minHeight: isCompact ? '25px' : '400px'
    }}>
      <Plot
        data={data}
        layout={layout}
        config={{ 
          responsive: true,
          displayModeBar: !isCompact,
          mapboxAccessToken: '' // Empty token for carto-positron style
        }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default BCHeatmap; 
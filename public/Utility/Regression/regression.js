import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

const API_URL = {
    "newMembers": 'https://unitweb.sytes.net/api/joinDates',
    "globalMembers": 'https://unitweb.sytes.net/api/regionStats',
    "pointMembers": 'https://unitweb.sytes.net/api/pointsDistribution'

}
// Fetch api
async function fetchStuff(url) {
    // const url = `${API_URL["ptsLeaderboard"] + pageNum}`; 
  try {
    const response = await fetch(url);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error("Invalid content type received, expected JSON.");
    }

    const data = await response.json();
    console.log(data)
    return data; // This is now directly your array of dates
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

fetch('https://unitweb.sytes.net/api/getPredictionMap')
.then(response => {
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return response.json();
})
.then(data => {
  const { rawDays, rawRanks, rawDivisions, uniqueDivs, gridX, gridY, zMatrix, maxDays, maxRank, test_days, test_rank, probDistribution, modelInsights } = data;
  // const { rawDays, rawRanks, rawDivisions, uniqueDivs, gridX, gridY, zMatrix, maxDays, maxRank } = data;
  const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2'];
  const traces = [];

  // 1. Render Background Regions
  traces.push({
      x: gridX,
      y: gridY,
      z: zMatrix,
      type: 'contour',
      colorscale: uniqueDivs.map((_, i) => [i / (uniqueDivs.length - 1 || 1), colorPalette[i % colorPalette.length]]),
      opacity: 0.45,
      zmin: 0,
      zmax: uniqueDivs.length - 1,
      showscale: false,
      hoverinfo: 'skip',
      contours: { coloring: 'heatmap' }
  });

  // 2. Render Member Dots
  uniqueDivs.forEach((div, idx) => {
      const x = [], y = [];
      for (let i = 0; i < rawDays.length; i++) {
          if (rawDivisions[i] === div) {
              x.push(rawDays[i]);
              y.push(rawRanks[i]);
          }
      }
      traces.push({
          x: x, y: y,
          mode: 'markers',
          type: 'scatter',
          name: div,
          marker: { 
              size: 9, 
              opacity: 0.9, 
              color: colorPalette[idx % colorPalette.length],
              line: { color: '#ffffff', width: 1 } 
          }
      });
  });

  // 3. Apply Initial Layout
  const themeTextColor = getComputedStyle(document.documentElement).getPropertyValue('--txt-color').trim();

  const layout = {
      xaxis: { title: 'Days in Server', range: [0, maxDays], constrain: 'domain' },
      yaxis: { title: 'Rank Weight', range: [0, maxRank], constrain: 'domain' },
      hovermode: 'closest',
      plot_bgcolor: 'rgba(255, 255, 255, 0.2)',
      paper_bgcolor: 'transparent',
      font: { color: 'rgb(132, 132, 132)' },
      legend: {
        orientation: 'h',
        yanchor: 'top',
        y: -0.2,            // Pushes it below the x-axis
        xanchor: 'center',
        x: 0.5
      },
      margin: { l: 60, r: 20, t: 30, b: 80 }
  };

  Plotly.newPlot('chartJoinDate', traces, layout, {responsive: true});

  // --- ADD THIS TO PRINT PROBABILITIES ON THE SCREEN ---
  const probContainer = document.getElementById('probDistribution');
  if (probContainer) {
      // Apply inline styles to format it neatly. You can move these to your CSS file later.
      let htmlStr = `<div style="margin-top: 20px; padding: 20px; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; text-align: left;">`;
      htmlStr += `<h4 style="margin-bottom: 15px; font-weight: bold;">Probability Breakdown (Average Profile: ${test_days} Days, ${test_rank} Rank Weight)</h4>`;
      
      // Print each division dynamically based on the highest probability
      probDistribution.forEach(item => {
          htmlStr += `<p style="margin: 5px 0; font-size: 1.1em;"><strong>${item.division}:</strong> ${item.probability}%</p>`;
      });
      
      htmlStr += `</div>`;
      probContainer.innerHTML = htmlStr;
  }
  // 4. Dynamic Theme Observer
  const themeObserver = new MutationObserver(() => {
      const updatedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--txt-color').trim();
      const update = { 'font.color': updatedTextColor };
      
      const chart = document.getElementById('chartJoinDate');
      if (chart && chart.data) {
          Plotly.relayout('chartJoinDate', update);
      }
  });
  
  const insightsContainer = document.getElementById('modelInsights');
  if (insightsContainer && Array.isArray(modelInsights)) {
      let insightHtml = `<div style="margin-top: 20px; padding: 20px; border: 1px solid rgba(128,128,128,0.2); border-radius: 8px; text-align: left;">`;
      insightHtml += `<h4 style="margin-bottom: 15px; font-weight: bold;">Automated Model Insights</h4>`;
      
      // Loop through the array of strings and print them
      modelInsights.forEach(textLine => {
          insightHtml += `<p style="margin: 10px 0; font-size: 1.1em; line-height: 1.5;">${textLine}</p>`;
      });
      
      insightHtml += `</div>`;
      insightsContainer.innerHTML = insightHtml;
  }

  // Observe the body or root HTML element for theme class changes
  themeObserver.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class', 'data-theme', 'theme'] 
  });
})
.catch(err => console.error("Error loading prediction map:", err));

var latexDiv = document.getElementById('latexDiv')
const latexText = latexDiv.querySelector('.latexText');
const arrow = document.getElementById('arrowExplain');

latexDiv.addEventListener(("click"), function() {
  latexText.classList.toggle('active')
  arrow.classList.toggle('active');
})
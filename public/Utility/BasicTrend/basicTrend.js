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


// fetchStuff(API_URL["globalMembers"])
// fetchStuff(API_URL["pointMembers"])

// Draw bar chart
let joinDateChart
async function buildChart() {
    const rawDates = await fetchStuff(API_URL["newMembers"]); 
    
    const monthlyCounts = {};
    rawDates.forEach(isoDate => {
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        monthlyCounts[`${year}-${month}`] = (monthlyCounts[`${year}-${month}`] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthlyCounts).sort()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            
    const labels = sortedKeys.map(key => {
        const [year, month] = key.split('-')
        return `${monthNames[parseInt(month) - 1]} ${year}`
    })

    const dataValues = sortedKeys.map(key => monthlyCounts[key]);
    console.log(dataValues)
    const ctx = document.getElementById('chartJoinDate').getContext('2d');
    joinDateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount of new members joined (excluded left members)',
                data: dataValues,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--txt-color)'
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: 'var(--txt-color)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Members',
                        font: { weight: 'bold' },
                        color: 'var(--txt-color)'
                    },
                    ticks: {
                        color: 'var(--txt-color)'
                    }
                }
            }
        }
    })
}

buildChart()

document.addEventListener('themeChanged', () => {
    if (joinDateChart) {
        setTimeout(() => {
            const rootStyle = getComputedStyle(document.documentElement)
            let newTextColor
            if (localStorage.getItem('light')) {
                newTextColor = rootStyle.getPropertyValue('--txt-color').trim()
                console.log("lighted chart")
            } else {
                console.log("tis")
                newTextColor = '#1A272D'
            }
            joinDateChart.options.plugins.legend.labels.color = newTextColor;
            joinDateChart.options.scales.x.ticks.color = newTextColor;
            joinDateChart.options.scales.y.ticks.color = newTextColor;
            joinDateChart.options.scales.y.title.color = newTextColor;

            // Now redraw
            joinDateChart.update();
        }, 10)
    }
})

// Draw map
let map = null;
let geoJson = null;

function drawMap(geo, data) {
    // 1. Initialize map only once
    // console.log(data)
    if (!map) {
        map = L.map('chartMap', {
            minZoom: 2
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    }

    // 2. Clear previous GeoJSON layer if redrawing
    if (geoJson) {
        map.removeLayer(geoJson);
    }

    // 3. Find the maximum member count to scale the green gradient properly
    const counts = Object.values(data).map(v => parseInt(v) || 0);
    const maxVal = Math.max(...counts, 1);

    // 4. Render GeoJSON with your interactive events & dynamic styling
    geoJson = L.geoJson(geo, {
        onEachFeature: (feature, layer) => {
            const continentName = feature.properties.CONTINENT;
            if (!continentName) return;

            const value = data["[R] " + continentName] ?? 0;

            layer.bindTooltip(`<b>${continentName}</b>: ${value} Personnel`);
            layer.bindPopup(`<h2>${continentName}</h2><p><b>${value}</b> UNIT Personnel</p>`);

            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({
                        weight: 3,
                        color: '#009EDB',
                        fillOpacity: 0.3
                    });
                    l.bringToFront();
                },
                mouseout: (e) => {
                    geoJson.resetStyle(e.target);
                },
                click: (e) => {
                    if (typeof drawChart === 'function') {
                        drawChart(continentName);
                    }
                }
            });
        },
        style: (feature) => {
            const continentName = feature.properties.CONTINENT;
            const value = data["[R] " + continentName] ?? 0;

            // Scale hue from 0 (Red) to 120 (Pure Green)
            let hslHue = (value / maxVal) * 120;
            if (hslHue > 120) hslHue = 120;

            return {
                fillColor: `hsl(${hslHue}, 80%, 45%)`, // The more members, the more green
                color: '#333333',                      // Border color
                weight: 1,
                fillOpacity: 0.5
            };
        }
    }).addTo(map);

    map.fitBounds(geoJson.getBounds());
}

// Fetch helper for continents.json
async function getGeoJson() {
    try {
        const response = await fetch('./continents.json');
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error loading GeoJSON:", error.message);
    }
}

// Main execution function
async function initRegionMap() {
    try {
        // Fetch GeoJSON and Region Stats concurrently
        const [geo, statsResponse] = await Promise.all([
            getGeoJson(),
            fetchStuff(API_URL["globalMembers"])
        ]);

        const statsData = await statsResponse;

        // Convert API array to a key-value dictionary: { "Europe": 15, "Asia": 42, ... }
        const dataMap = {};
        statsData.forEach(item => {
            dataMap[item.region] = item.member_count;
        });

        drawMap(geo, dataMap);
    } catch (error) {
        console.error("Failed to initialize region map:", error);
    }
}

// Call on load
initRegionMap();

// Distribution histogram
let histogramChart
async function renderHistogram() {
    try {
        // const response = await ;
        const data = await fetchStuff(API_URL["pointMembers"]);

        // Separate our coordinates
        const labels = data.map(row => row.points);
        const counts = data.map(row => parseInt(row.member_count) || 0);

        const sortedCounts = [...counts].sort((a, b) => b - a);
        const maxMembers = Math.ceil((sortedCounts[1] || 10) * 1.2);

        const ctx = document.getElementById('pointsHistogram').getContext('2d');
        
        histogramChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Members',
                    data: counts,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    barPercentage: 1.0, // Removes gap between bars
                    categoryPercentage: 1.0 // Removes gap between categories
                }]
            },
            options: {
                responsive: true,
                // maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Points' }
                    },
                    y: {
                        title: { display: true, text: 'Members' },
                        beginAtZero: true,
                        max: maxMembers,
                        ticks: { precision: 0 } // Prevents decimals on member counts
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error loading histogram data:", error);
    }
}

document.addEventListener('themeChanged', () => {
    if (histogramChart) {
        setTimeout(() => {
            const rootStyle = getComputedStyle(document.documentElement)
            let newTextColor
            if (localStorage.getItem('light')) {
                newTextColor = rootStyle.getPropertyValue('--txt-color').trim()
            } else {
                newTextColor = '#1A272D'
            }
            histogramChart.options.plugins.legend.labels.color = newTextColor;
            histogramChart.options.scales.x.ticks.color = newTextColor;
            histogramChart.options.scales.y.ticks.color = newTextColor;
            histogramChart.options.scales.y.title.color = newTextColor;

            // Now redraw
            histogramChart.update();
        }, 10)
    }
})

// Initialize the chart
renderHistogram();
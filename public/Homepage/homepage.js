import {loadFile} from "../Components/shared.js";
// Load navbar
loadFile("../Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("../Components/Footer/footer.html", "footer");

// Fetch csv: DEPRECATED, USE THE API INSTEAD
async function getCsvCol(path, colIdx) {
    const res = await fetch(path)
    const csv = await res.text()
    const rows = csv.trim().split('\n')
    return rows.map(row => row.split(',')[colIdx])
}

// Fetch api
const API_URL = "/api/joinDates"; 

async function fetchJoinDates() {
  try {
    const response = await fetch(API_URL);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error("Invalid content type received, expected JSON.");
    }

    const data = await response.json();
    return data; // This is now directly your array of dates
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

// Draw chart
let chart
async function buildChart() {
    const rawDates = await fetchJoinDates(); 
    
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
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
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
    if (chart) {
        setTimeout(() => {
            const rootStyle = getComputedStyle(document.documentElement)
            const newTextColor = rootStyle.getPropertyValue('--txt-color').trim()
            chart.options.plugins.legend.labels.color = newTextColor;
            chart.options.scales.x.ticks.color = newTextColor;
            chart.options.scales.y.ticks.color = newTextColor;
            chart.options.scales.y.title.color = newTextColor;

            // Now redraw
            chart.update();
        }, 10)
    }
})


const gates = document.querySelectorAll('.inBetween');

const checkGates = () => {
const triggerPoint = window.innerHeight * 0.75;
const bufferZone = 150; 

// Checks how far down the user has scrolled. 
// 10px gives a tiny buffer for phones that have "bouncy" scrolling.
const isAtTop = window.scrollY < 10; 

gates.forEach(gate => {
    const gateTop = gate.getBoundingClientRect().top;
    const isOpen = gate.classList.contains('open');

    // NEW RULE: If we are at the very top of the webpage, force close!
    if (isAtTop) {
        if (isOpen) gate.classList.remove('open');
        return; // Stop running the rest of the math for this gate
    }

    // Normal scroll math
    if (!isOpen && gateTop < triggerPoint) {
        gate.classList.add('open');
    } 
    else if (isOpen && gateTop > (triggerPoint + bufferZone)) {
        gate.classList.remove('open');
    }
});
};

window.addEventListener('scroll', checkGates);
checkGates();
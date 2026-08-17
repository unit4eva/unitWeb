import {loadFile} from "../Components/shared.js";
// Load navbar
loadFile("../Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("../Components/Footer/footer.html", "footer");

// Fetch csv
async function getCsvCol(path, colIdx) {
    const res = await fetch(path)
    const csv = await res.text()
    const rows = csv.trim().split('\n')
    return rows.map(row => row.split(',')[colIdx])
}

let chart
async function buildChart() {
    const rawDates = await getCsvCol("/data/members/memberList.csv", 3)
    // console.log(rawDates)
    const monthlyCounts = {}
    rawDates.forEach(isoDate => {
        const date = new Date(isoDate)
        if (isNaN(date.getTime())) return
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')

        monthlyCounts[`${year}-${month}`] = (monthlyCounts[`${year}-${month}`] || 0) + 1
    })

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
        // The standard tripwire (3/4 of the screen)
        const triggerPoint = window.innerHeight * 0.65;
        
        // A 150px cushion to prevent the layout from bouncing
        const bufferZone = 150; 

        gates.forEach(gate => {
            const gateTop = gate.getBoundingClientRect().top;
            
            // Check if the gate is currently open
            const isOpen = gate.classList.contains('open');

            // IF CLOSED: Open it when it crosses the normal tripwire
            if (!isOpen && gateTop < triggerPoint) {
                gate.classList.add('open');
            } 
            // IF OPEN: Don't close it until it passes the tripwire + the buffer zone
            else if (isOpen && gateTop > (triggerPoint + bufferZone)) {
                gate.classList.remove('open');
            }
        });
    };

    window.addEventListener('scroll', checkGates);
    checkGates();
import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// API URL
var API_URL = {
    getRoleInfo: "https://unitweb.sytes.net/api/getRoleInfo?role_id="
}

const apiCache = {}

// Fetch
async function fetchRole(roleId) {
    const cacheKey = `roleInfo_${roleId}`
    if (apiCache[cacheKey]) {
        console.log("Loaded from cache:", cacheKey);
        return apiCache[cacheKey];
    }

    try {
        const response = await fetch(`${API_URL["getRoleInfo"]}${roleId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        // console.log(data)
        apiCache[cacheKey] = data;
        return data;
        // will return this
        // {
        //     "role_id": "1438934492298346566",
        //     "role_name": "WO1 - Warrant Officer Class One",
        //     "role_color": "#206694"
        // }
    } catch (error) {
        console.error("Error fetching role info:", error);
    }
}

// Roadmap json
const roadmap = [
    {
        type: "event",
        requirement: "",
        desc: "Join the server"
    },
    {
        type: "rank",
        rankId: "1542231291213381663",
        requirement: ""
    },
    {
        type: "rank",
        rankId: "1452633724247216209",
        requirement: "Filled an application"
    },
    {
        type: "rank",
        rankId: "1438952941624230070",
        requirement: "Obtained 15 points"
    },
    {
        type: "rank",
        rankId: "1438932542194712657",
        requirement: "Obtained 25 points"
    },
    {
        type: "rank",
        rankId: "1438953085706703048",
        requirement: "Obtained 40 points"
    },
    {
        type: "rank",
        rankId: "1438953224806596729",
        requirement: "Obtained 60 points<br>Additional requirement: Have at least 2 qualifications"
    },
    {
        type: "rank",
        rankId: "1455689403904163921",
        requirement: "Obtained 70 points"
    },
    {
        type: "rank",
        rankId: "1455688490233757849",
        requirement: "Obtained 85 points"
    },
    {
        type: "rank",
        rankId: "1438933144538710026",
        requirement: "Obtained 115 points<br>Additional requirement: Have at least 3 qualifications and pass the NCO test (keep an eye out in internal announcement for news on when NCO applications open and close). Also must have a mic."
    },
    {
        type: "rank",
        rankId: "1438933201337978940",
        requirement: "Obtained 130 points"
    },
    {
        type: "rank",
        rankId: "1455686179289825575",
        requirement: "Obtained 150 points"
    },
    {
        type: "rank",
        rankId: "1452634746231328842",
        requirement: "Obtained 180 points<br>Additional requirement: Have the Event Host qualification and host/have hosted 3 events. (gamenights don't count)"
    },
    {
        type: "rank",
        rankId: "1438933243524153514",
        requirement: "Obtained 195 points"
    },
    {
        type: "rank",
        rankId: "1438933820320518275",
        requirement: "Obtained 215 points"
    },
    {
        type: "rank",
        rankId: "1455685894114906355",
        requirement: "Obtained 245 points<br>Additional requirements: Have 5 qualifications, host/have hosted 5 events. (gamenights don't count)"
    },
    {
        type: "rank",
        rankId: "1439432983202365511",
        requirement: "Obtained 260 points"
    },
    {
        type: "rank",
        rankId: "1438934492298346566",
        requirement: "Obtained 280 points"
    },
    {
        type: "event",
        requirement: "Have at least 300 points and voted by Oversight Committee members",
        desc: "ADVANCEMENT BEYOND NCO"
    },
]


function hexToRgba(hex, alpha = 0.28) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Renders the roadmap in order
 */
async function renderRoadmap() {
    const container = document.getElementById("roadmapContainer");
    container.innerHTML = "";

    // Pre-fetch all rank roles in parallel for fast loading
    const rolePromises = roadmap.map(item => 
        item.type === "rank" ? fetchRole(item.rankId) : Promise.resolve(null)
    );
    const rolesData = await Promise.all(rolePromises);

    roadmap.forEach((item, index) => {
        // 1. Render incoming connector arrow & requirement (for every node after the first)
        if (index > 0) {
            const connectorWrapper = document.createElement("div");
            connectorWrapper.className = "connector-wrapper";

            const line = document.createElement("div");
            line.className = "connector-line";
            connectorWrapper.appendChild(line);

            if (item.requirement && item.requirement.trim() !== "") {
                const reqText = document.createElement("div");
                reqText.className = "requirement-text roboto-condensed-regular";
                reqText.innerHTML = item.requirement; // Supports <br> tags in requirement strings
                connectorWrapper.appendChild(reqText);
            }

            container.appendChild(connectorWrapper);
        }

        // 2. Render the Node (Event or Rank)
        const node = document.createElement("div");

        if (item.type === "event") {
            node.className = "node event-node zen-dots-regular";
            node.textContent = item.desc;
        } else if (item.type === "rank") {
            const roleInfo = rolesData[index];
            const color = roleInfo?.role_color || "#206694";
            
            node.className = "node rank-node zen-dots-regular";
            node.textContent = roleInfo?.role_name || "Unknown Rank";
            node.style.color = color;
            node.style.backgroundColor = hexToRgba(color, 0.28);
        }

        container.appendChild(node);
    });
}

// Initialize on page load
renderRoadmap()
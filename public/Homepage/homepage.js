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

async function buildChart() {
    const rawDates = await getCsvCol("/data/members/memberList.csv")
    
}
import {loadFile} from "../Components/shared.js";
// Load navbar
loadFile("../Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("../Components/Footer/footer.html", "footer");

const API_URL = {
    "ptsLeaderboard": "/api/pointsLeaderboard?page=",
    "searchUsers": "/api/searchUserPoint?q="

}
// Fetch api
async function fetchLeaderboard(pageNum = 1) {
    const url = `${API_URL["ptsLeaderboard"] + pageNum}`; 
  try {
    const response = await fetch(url);
    
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

// fetchLeaderboard().then(data => console.log(data));

// Populate podium
async function populatePodium() {
    const rawLeaderboard = await fetchLeaderboard()
    const top3 = rawLeaderboard["top3"]
    // console.log(top3)
    const rankClasses = ['.step1', '.step2', '.step3']
    top3.forEach((member, idx) => {
        const stepElement = document.querySelector(rankClasses[idx]);
  
    if (stepElement) {
        const nameEl = stepElement.querySelector('.namePodium');
        nameEl.textContent = `'${member.nickname}'`;
        
        const pointsEl = stepElement.querySelector('.pointsPodium');
        const ptsPod = pointsEl.querySelector(".ptsNumPod")
        ptsPod.textContent = member.points.toLocaleString('de-DE'); 
        
        const avatarEl = stepElement.querySelector('.avtPodium');
        avatarEl.src = `${member.avatar}` || './img/some_dish.jpg';
    }
    })
}

populatePodium()
// Page selection
let curPage = 1
const rawData = await fetchLeaderboard()
const totalPages = rawData["maxPage"]
const pageCtnNum = document.getElementById("page-numbers")

const prevBtn = document.getElementById("prev-btn")
const nextBtn = document.getElementById("next-btn")

function renderPagination() {
    let html = ''
    const addPage = (num) => {
        const activeClass = num === curPage ? 'active' : '';
        html += `<button class="page-num ${activeClass}" onclick="changePage(${num})">${num}</button>`;
    };
    
    const addEllipsis = () => {
        html += `<span class="page-num ellipsis">...</span>`;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const delta = isMobile ? 1 : 2;
    let rangeStart = Math.max(2, curPage - delta);
    let rangeEnd = Math.min(totalPages - 1, curPage + delta);

    addPage(1);

    // Left ellipsis
    if (rangeStart > 2) addEllipsis();

    // Middle range
    for (let i = rangeStart; i <= rangeEnd; i++) {
        addPage(i);
    }

    // Right ellipsis
    if (rangeEnd < totalPages - 1) addEllipsis();

    // Always show the last page
    if (totalPages > 1) addPage(totalPages);

    // Inject only the numbers into the DOM
    pageCtnNum.innerHTML = html;

    // Toggle disabled states on the static HTML buttons
    prevBtn.disabled = curPage === 1;
    nextBtn.disabled = curPage === totalPages;
}

window.changePage = function(newPage) {
  if (newPage >= 1 && newPage <= totalPages) {
    curPage = newPage;
    renderPagination()
    populateList(curPage)
  }
}

prevBtn.addEventListener('click', () => changePage(curPage - 1));
nextBtn.addEventListener('click', () => changePage(curPage + 1));

// Initialize on load
renderPagination();

// Populate list
const sampleElem = document.getElementById("leaderboardSample")
const listContainer = document.getElementById("listContainer")
let template = sampleElem.cloneNode(true)
template.removeAttribute("id")

async function populateList(pageNum = 1) {
    const rawLeaderboard = await fetchLeaderboard(pageNum)
    // console.log(rawLeaderboard)
    const listData = rawLeaderboard["pageData"]
    // console.log(listData)
    
    listContainer.innerHTML = ''
    listData.forEach((elem, idx) => {
        let newElem = template.cloneNode(true)
        // newElem.removeAttribute("id")

        let rankElem = newElem.querySelector(".col-rank")
        rankElem.innerHTML = "#" + elem["global_rank"]

        let nameElem = newElem.querySelector(".member-name")
        nameElem.innerHTML = elem["display_name"]

        let avtImg = newElem.querySelector(".avtImg")
        avtImg.src = elem["avatar"] || './img/some_dish.jpg'

        let pointsElem = newElem.querySelector(".col-points")
        pointsElem.innerHTML = elem["points"]

        listContainer.appendChild(newElem)
    })
}

populateList()

// Search
const searchBar = document.getElementById("search")

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function fetchSuggestions(query) {
    if (query.length === 0) {
        return -1
    }

    try {
        const response = await fetch(`${API_URL["searchUsers"] + encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const suggestedUsers = await response.json();
        console.log(`Suggestions for "${query}":`, suggestedUsers);
        return suggestedUsers
        
    } catch (error) {
        console.error("Failed to fetch search suggestions:", error);
    }
}
let pageCtn = document.getElementById("pageContainer")

function renderSearchRes(res) {
    pageCtn.style.display = "none"
    listContainer.innerHTML = ""
    if (!res || res.length === 0) {
        listContainer.innerHTML = `<p class="roboto-condensed-medium">No results found for your search</p>`;
        return;
    }

    res.forEach((elem) => {
        let newElem = template.cloneNode(true);
        
        let rankElem = newElem.querySelector(".col-rank");
        rankElem.innerHTML = "#" + elem["global_rank"] 

        let nameElem = newElem.querySelector(".member-name");
        nameElem.innerHTML = elem["display_name"];

        let avtImg = newElem.querySelector(".avtImg");
        avtImg.src = elem["avatar"];

        let pointsElem = newElem.querySelector(".col-points");
        pointsElem.innerHTML = elem["points"];

        listContainer.appendChild(newElem);
    });
}

searchBar.addEventListener('input', debounce(async (event) => {
    const query = event.target.value.trim();
    const suggest = await fetchSuggestions(query)
    if (suggest === -1) {
        curPage = 1; 
        pageContainer.style.display = "flex"
        renderPagination()
        populateList(curPage)
        return;
    }
    renderSearchRes(suggest)
}, 300));


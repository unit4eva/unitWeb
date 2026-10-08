import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// API URL
var API_URL = {
    getUserInfo: "https://unitweb.sytes.net/api/getUserInfoByRole?role_id=",
    getRoleInfo: "https://unitweb.sytes.net/api/getRoleInfo?role_id=",
    searchUsers: "https://unitweb.sytes.net/api/searchUserInfo?q="
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
    } catch (error) {
        console.error("Error fetching role info:", error);
    }
}

async function fetchUserByRole(roleId, page = 1) {
    const cacheKey = `users_${roleId}_page_${page}`;
    if (apiCache[cacheKey]) {
        console.log("Loaded from cache:", cacheKey);
        return apiCache[cacheKey];
    }
    try {
        const response = await fetch(`${API_URL["getUserInfo"] + roleId}&page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const rawData = await response.json();
        
        const instantiatedMembers = rawData.data.map(user => {
            const divRankObj = {
                airbourne: user.marine, 
                aircorps: user.aircorps, 
                broadsword: user.broadsword, 
                diplomatic: user.diplomatic, 
                innovationandcreative: user.innovationandcreative, 
                moderation: user.moderation,
                larp: user.larp
            };
            return new Member({
                nickname: user.nickname,
                avatar: user.avatar,
                mainRank: user.mainrank_id,
                divRank: divRankObj,              // Injects the formatted object
                retired: user.honourary_id,       // Mapped boolean
                tech: user.tech_expert_id,        // Mapped boolean
                awards: user.awards || [],
                ocmRank: user.ocmrank_id,
                quotes: user.quote                // Mapped quote
            });
        });

        const finalResult = {
            data: instantiatedMembers,
            pagination: rawData.pagination
        };
        
        apiCache[cacheKey] = finalResult;
        // console.log(finalResult)
        return finalResult;
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Rank objects
var Ranks = {
    "OVERSIGHT COMMITTEE": {
        color: "#E67E22",
        includedRanks: [
            "1438925897234251836",
            "1522358622649188492",
            "1474189235052478555",
            "1438925962296426669"
        ]
    },
    "GCO": {
        color: "#990F4B",
        includedRanks: [
            "1438936773668634746",
            "1438936772024205392",
            "1439590203634356315",
            "1439590257099276299",
            "1438936763430076627"
        ]
    },
    "SCO": {
        color: "#E91E63",
        includedRanks: [
            "1438936760515170354",
            "1439589414069211286",
            "1438934842606620804"
        ]
    },
    "JCO": {
        color: "#9B59B6",
        includedRanks: [
            "1438934675031855326",
            "1438934676352794818",
            "1439589100867813416"
        ]
    },
    "HU": {
        color: "#009EDB",
        includedRanks: [
            "1504536070736445590"
        ]
    },
    "NCO": {
        color: "#59A8DD",
        includedRanks: [
            "1438934492298346566",
            "1439432983202365511",
            "1455685894114906355",
            "1438933820320518275",
            "1438933243524153514",
            "1452634746231328842",
            "1455686179289825575",
            "1438933201337978940",
            "1438933144538710026"
        ]
    },
    "ORDINARY SOLDIER": {
        color: "#2ECC71",
        includedRanks: [
            "1455688490233757849",
            "1455689403904163921",
            "1438953224806596729",
            "1438953085706703048",
            "1438932542194712657",
            "1438952941624230070",
            "1452633724247216209"
        ]
    }
}

// Populate buttons
const generalSelectionDiv = document.querySelector('.generalSelection')
const specificSelectionDiv = document.querySelector('.specificSelection')
const rankTitleElement = document.querySelector('.rank-title')

function initRanks() {
    generalSelectionDiv.innerHTML = ''
    
    Object.keys(Ranks).forEach((categoryName, index) => {
        const categoryData = Ranks[categoryName];
        
        const btn = document.createElement('button');
        btn.className = 'general-btn';
        btn.textContent = categoryName;
        btn.style.color = categoryData.color;

        if (index === 0) {
            btn.classList.add('active');
            loadSpecificRanks(categoryData.includedRanks, categoryData.color);
        }

        // Add click event
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return
            document.querySelectorAll('.general-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Fetch and load the specific ranks for this category
            loadSpecificRanks(categoryData.includedRanks, categoryData.color);
        });

        generalSelectionDiv.appendChild(btn);
    });
}

async function loadSpecificRanks(roleIds, fallbackColor) {
    // Show a temporary loading state while fetching
    specificSelectionDiv.innerHTML = '<span style="color: gray; font-size: 14px;">Loading ranks...</span>';

    try {
        // Fetch all roles concurrently for speed
        const rolePromises = roleIds.map(id => fetchRole(id));
        const rolesData = await Promise.all(rolePromises);

        // Clear the loading text
        specificSelectionDiv.innerHTML = '';
        const updateHeader = (name, color) => {
            rankTitleElement.textContent = name;
            rankTitleElement.style.color = color;
            document.documentElement.style.setProperty('--cur-rank', color);
        };
        rolesData.forEach((role, index) => {
            // console.log(role)
            if (!role) return;

            const btn = document.createElement('button');
            btn.className = 'specific-btn';
            btn.textContent = role.role_name;
            btn.style.color = role.role_color || fallbackColor;

            if (index === 0) {
                btn.classList.add('active');
                updateHeader(role.role_name, role.role_color);
                renderRankMember(role.role_id)
            }
            
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.specific-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateHeader(role.role_name, role.role_color);
                renderRankMember(role.role_id)
            });

            specificSelectionDiv.appendChild(btn);
        });

    } catch (error) {
        console.error("Failed to load specific ranks:", error);
        specificSelectionDiv.innerHTML = '<span style="color: red; font-size: 14px;">Error loading ranks.</span>';
    }
}

initRanks();


// Pagination
// Pagination State
let curRoleId = null;
let curMaxPage = 1;
let curPage = 1;

const pageContainer = document.getElementById("pageContainer");
const pageCtnNum = document.getElementById("page-numbers");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const cardCtn = document.querySelector('.cardContainer');

prevBtn.addEventListener('click', () => changePage(curPage - 1));
nextBtn.addEventListener('click', () => changePage(curPage + 1));

function renderPagination(paginationData) {
    curMaxPage = paginationData.max_page;
    curPage = paginationData.current_page;

    if (curMaxPage <= 1) {
        pageContainer.style.display = 'none';
        return; 
    }

    // Otherwise, ensure the container is visible
    pageContainer.style.display = 'flex'; // Use 'flex' or whatever matches your CSS layout

    let html = '';
    const addPage = (num) => {
        const activeClass = num === curPage ? 'active' : '';
        html += `<button class="page-num ${activeClass}" onclick="changePage(${num})">${num}</button>`;
    };
    
    const addEllipsis = () => {
        html += `<span class="page-num ellipsis">...</span>`;
    };

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const delta = isMobile ? 1 : 2;
    let rangeStart = Math.max(2, curPage - delta);
    let rangeEnd = Math.min(curMaxPage - 1, curPage + delta);

    addPage(1);

    if (rangeStart > 2) addEllipsis();
    
    for (let i = rangeStart; i <= rangeEnd; i++) {
        addPage(i);
    }

    if (rangeEnd < curMaxPage - 1) addEllipsis();
    if (curMaxPage > 1) addPage(curMaxPage);

    pageCtnNum.innerHTML = html;

    prevBtn.disabled = curPage === 1;
    nextBtn.disabled = curPage === curMaxPage;
}

window.changePage = function(newPage) {
    if (newPage >= 1 && newPage <= curMaxPage) {
        // Fetch the same role, but for the new page
        renderRankMember(curRoleId, newPage);
    }
}

// Float card
const floatingCard = document.querySelector('.floatingCard');
const closeFloatingCard = document.getElementById('closeFloatingCard')
const profileNickname = floatingCard.querySelector('.profileNickname');
const profileAvatar = floatingCard.querySelector('.profileAvatar img');
const profileRoles = floatingCard.querySelector('.profileRoles');
const profileQuote = floatingCard.querySelector('.profileQuote');

closeFloatingCard.addEventListener('click', () => {
    floatingCard.style.display = 'none';
});

async function createMemberCardElement(member) {
    const avatarUrl = member.avatar || './img/oulu_fish.jpg';
    
    // 1. Determine the correct theme color
    let themeColor = '#FFC107'; // Fallback gold
    const isSearching = searchBar.value.trim().length > 0;

    if (!isSearching && curRoleId && (curRoleId === member.ocmRank || curRoleId === member.retired)) {
        const rankData = await fetchRole(curRoleId);
        if (rankData) themeColor = rankData.role_color;
    }
    // Otherwise, strictly fall back to their mainRank color
    else if (member.mainRank) {
        const rankData = await fetchRole(member.mainRank);
        if (rankData) themeColor = rankData.role_color;
    }
    // Otherwise, strictly fall back to their mainRank color
    else if (member.mainRank) {
        const rankData = await fetchRole(member.mainRank);
        if (rankData) themeColor = rankData.role_color;
    }

    const card = document.createElement('div');
    card.className = 'member-card';
    
    // 2. Apply the dynamic color to the grid image border
    card.innerHTML = `
        <img src="${avatarUrl}" alt="${member.nickname}" style="border-color: ${themeColor};">
        <h3>'${member.nickname}'</h3>
    `;

    // --- Floating Card Hover Logic ---
    card.addEventListener('mouseenter', async () => {
        const fullProfile = await member.getUserData();

        // 3. Inject the exact same theme color into the floating card elements
        profileNickname.textContent = fullProfile.nickname.toUpperCase();
        
        profileAvatar.src = fullProfile.avatar || './img/oulu_fish.jpg';
        profileAvatar.alt = fullProfile.nickname;
        profileAvatar.style.borderColor = themeColor;

        if (fullProfile.quotes) {
            profileQuote.textContent = `"${fullProfile.quotes}"`;
            profileQuote.style.display = 'block'; 
        } else {
            profileQuote.style.display = 'none';
        }

        profileRoles.innerHTML = ''; 
        const allRoles = [];
        
        if (fullProfile.mainRank) allRoles.push(fullProfile.mainRank);
        if (fullProfile.ocmRank) allRoles.push(fullProfile.ocmRank);
        if (fullProfile.retired) allRoles.push(fullProfile.retired);
        if (fullProfile.tech) allRoles.push(fullProfile.tech);
        if (fullProfile.awards && fullProfile.awards.length > 0) allRoles.push(...fullProfile.awards);
        
        if (fullProfile.divRank) {
            Object.values(fullProfile.divRank).forEach(role => {
                if (role && /commander|head/i.test(role.role_name)) allRoles.push(role);
            });
        }

        allRoles.forEach(role => {
            const pill = document.createElement('div');
            pill.className = 'rolePill';
            pill.textContent = role.role_name;
            pill.style.color = role.role_color || '#FFFFFF'; 
            profileRoles.appendChild(pill);
        });

        floatingCard.style.display = 'flex';
    });

    card.addEventListener('mousemove', (e) => {
        const offset = 15;
        const cardWidth = floatingCard.offsetWidth;
        const cardHeight = floatingCard.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = e.clientX + offset;
        let y = e.clientY + offset;

        if (x + cardWidth > viewportWidth) x = e.clientX - cardWidth - offset;
        if (y + cardHeight > viewportHeight) y = e.clientY - cardHeight - offset;

        x = Math.max(10, Math.min(x, viewportWidth - cardWidth - 10));
        y = Math.max(10, Math.min(y, viewportHeight - cardHeight - 10));

        floatingCard.style.left = `${x}px`;
        floatingCard.style.top = `${y}px`;
    });

    card.addEventListener('mouseleave', () => {
        floatingCard.style.display = 'none';
    });

    return card;
}


const renderRankMember = async (roleId, page = 1) => {
    curRoleId = roleId; 
    searchBar.value = ''; 

    resultsHeader.style.display = 'block';

    const result = await fetchUserByRole(roleId, page);
    cardCtn.innerHTML = '';

    if (!result.data || result.data.length === 0) {
        cardCtn.innerHTML = '<span style="color: gray; font-size: 18px;">No members found in this rank.</span>';
        return;
    }

    const cards = await Promise.all(result.data.map(member => createMemberCardElement(member)));
    cards.forEach(card => cardCtn.appendChild(card));

    renderPagination(result.pagination);
};
// Member class

class Member {
    constructor({ nickname, avatar, mainRank, divRank = null, retired = null, tech = null, awards = [], ocmRank = null, quotes = null }) {
        this.nickname = nickname;
        this.avatar = avatar;
        this.mainRank = mainRank;
        this.divRank = divRank;
        /* div rank should look like this:
        divRank = {
            airbourne: id or null, 
            aircorps: id or null, 
            broadsword: id or null, 
            diplomatic: id or null, 
            innovationandcreative: id or null, 
            moderation: id or null,
            larp: id or null
        }
        */
        this.retired = retired; // this is the is_honourary boolean
        this.tech = tech; // this is the tech_expert boolean
        this.awards = awards;
        this.ocmRank = ocmRank;
        this.quotes = quotes;
    }

    async getUserData() {
        const allIds = new Set();
        
        if (this.mainRank) allIds.add(this.mainRank);
        if (this.ocmRank) allIds.add(this.ocmRank);
        if (this.retired) allIds.add(this.retired);
        if (this.tech) allIds.add(this.tech);
        
        this.awards.forEach(id => allIds.add(id));
        
        if (this.divRank) {
            Object.values(this.divRank).forEach(id => {
                if (id !== null) allIds.add(id);
            });
        }

        const uniqueIds = Array.from(allIds);
        const resolvedRoles = await Promise.all(uniqueIds.map(id => fetchRole(id)));

        const roleMap = {};
        resolvedRoles.forEach(role => {
            if (role) roleMap[role.role_id] = role;
        });

        let resolvedDivRank = null;
        if (this.divRank) {
            resolvedDivRank = {};
            for (const [divName, id] of Object.entries(this.divRank)) {
                resolvedDivRank[divName] = id ? roleMap[id] : null;
            }
        }

        return {
            nickname: this.nickname,
            avatar: this.avatar,
            quotes: this.quotes,
            mainRank: this.mainRank ? roleMap[this.mainRank] : null,
            ocmRank: this.ocmRank ? roleMap[this.ocmRank] : null,
            retired: this.retired ? roleMap[this.retired] : null,
            tech: this.tech ? roleMap[this.tech] : null,
            awards: this.awards.map(id => roleMap[id]).filter(Boolean), // Maps IDs and removes any failed fetches
            divRank: resolvedDivRank
        };
    }
}

// Search
const searchBar = document.getElementById("search");
const resultsHeader = document.querySelector('.resultsHeader');
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
    };
}

async function fetchSuggestions(query) {
    if (query.length === 0) return -1;

    try {
        const response = await fetch(`${API_URL["searchUsers"]}${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Search failed");
        
        const rawData = await response.json();
        
        // Assuming your search API returns { data: [...] } or just an array [...]
        const userArray = rawData.data || rawData; 
        
        // Map the raw search data into your Member class
        return userArray.map(user => {
            return new Member({
                nickname: user.nickname || user.display_name, // Fallback for your search API mapping
                avatar: user.avatar,
                mainRank: user.mainrank_id,
                divRank: {
                    airbourne: user.marine, 
                    aircorps: user.aircorps, 
                    broadsword: user.broadsword, 
                    diplomatic: user.diplomatic, 
                    innovationandcreative: user.innovationandcreative, 
                    moderation: user.moderation,
                    larp: user.larp
                },              
                retired: user.is_honourary,       
                tech: user.is_tech_expert,        
                awards: user.awards || [],
                ocmRank: user.ocmrank_id,
                quotes: user.quote || null                
            });
        });
    } catch (error) {
        console.error("Failed to fetch search suggestions:", error);
        return [];
    }
}

async function renderSearchRes(instantiatedMembers) {
    pageContainer.style.display = "none"; // Hide pagination for searches
    cardCtn.innerHTML = ""; // Clear the grid

    resultsHeader.style.display = 'none';
    if (!instantiatedMembers || instantiatedMembers.length === 0) {
        cardCtn.innerHTML = `<span style="color: gray; font-size: 18px;">No results found</span>`;
        return;
    }

    const cards = await Promise.all(instantiatedMembers.map(member => createMemberCardElement(member)));
    cards.forEach(card => cardCtn.appendChild(card));
}

searchBar.addEventListener('input', debounce(async (event) => {
    const query = event.target.value.trim();
    
    // If user clears the input manually, instantly reload the current rank
    if (query.length === 0) {
        if (curRoleId) renderRankMember(curRoleId, 1);
        return;
    }

    cardCtn.innerHTML = '<span style="color: gray; font-size: 18px;">Searching...</span>';
    pageContainer.style.display = "none";

    const suggest = await fetchSuggestions(query);
    if (suggest !== -1) {
        renderSearchRes(suggest);
    }
}, 300));
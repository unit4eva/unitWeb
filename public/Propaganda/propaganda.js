import {loadFile} from "../Components/shared.js";
// Load navbar
loadFile("../Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("../Components/Footer/footer.html", "footer");

var API_URL = {
    getPropMedia: "https://unitweb.sytes.net/api/getPropagandaMedia?page="
}

const propagandaCache = new Map();

async function fetchPropagandaPage(page = 1) {
    try {
        // 2. Check if the page data already exists in our local cache
        if (propagandaCache.has(page)) {
            console.log(`[CACHE HIT] Loaded page ${page} from local memory.`);
            return propagandaCache.get(page);
        }

        const response = await fetch(`${API_URL["getPropMedia"]}${page}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result)
        // 4. Save the result into the cache using the page number as the key
        propagandaCache.set(page, result);

        // 5. Return the newly fetched data
        return result;

    } catch (error) {
        console.error("Failed to fetch propaganda:", error);
        return null;
    }
}

async function preloadImages(dataArray) {
    const promises = dataArray.map(item => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = item.image_url;
            
            // Resolve the promise when the image finishes downloading
            img.onload = resolve;
            
            // Also resolve on error so one broken link doesn't freeze the whole page
            img.onerror = resolve; 
        });
    });
    
    // Wait for all image promises in the array to resolve
    await Promise.all(promises);
}

function injectDataIntoCards(dataArray) {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        if (index < dataArray.length) {
            const item = dataArray[index];
            
            // Show card if it was hidden
            card.style.display = 'flex'
            
            // Find placebo or existing image
            let placebo = card.querySelector('.image-placebo');
            let existingImg = card.querySelector('.card-image');
            
            if (placebo) {
                // Replace placebo div with a real img tag on first pass
                const imgEl = document.createElement('img');
                imgEl.src = item.image_url;
                imgEl.className = 'card-image';
                
                // Add click event for full screen modal
                imgEl.onclick = () => openModal(item.image_url, item.media_text);
                
                placebo.replaceWith(imgEl);
            } else if (existingImg) {
                // Update existing image tag
                existingImg.src = item.image_url;
                existingImg.onclick = () => openModal(item.image_url, item.media_text);
            }

            // Update Text
            const textEl = card.querySelector('.card-text');
            if (textEl) {
                textEl.textContent = item.media_text;
            }
        } else {
            card.style.display = 'none'
        }
    });
}

function updatePaginationUI(currentPage, maxPage) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageNumbersContainer = document.getElementById('page-numbers');

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // Disable if on mobile, OR if at the first/last page
    console.log(isMobile)
    prevBtn.disabled = isMobile || currentPage === 1;
    nextBtn.disabled = isMobile || currentPage === maxPage;

    // Clear existing numbers
    pageNumbersContainer.innerHTML = '';

    // Generate simple page numbers (1 to maxPage)
    for (let i = 1; i <= maxPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-num ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        
        if (i !== currentPage) {
            btn.onclick = () => loadPage(i);
        }
        pageNumbersContainer.appendChild(btn);
    }
}
var currentActivePage = 1
async function loadPage(page) {
    currentActivePage = page;
    const pinboard = document.querySelector('.pinboard-container');
    
    // 1. Give visual feedback that loading has started (dim the board)
    if (pinboard) {
        pinboard.style.transition = "opacity 0.1s";
        pinboard.style.opacity = "0.5"; 
        pinboard.style.pointerEvents = "none"; // Prevent clicking while loading
    }
    
    // 2. Fetch the JSON data
    const result = await fetchPropagandaPage(page);
    
    if (result) {
        // 3. Pause execution until all images are fully downloaded to browser cache
        await preloadImages(result.data);
        
        // 4. Instantly inject the fully-loaded images into the DOM
        injectDataIntoCards(result.data);
        updatePaginationUI(result.currentPage, result.maxPage);
    }
    
    // 5. Restore full visibility
    if (pinboard) {
        pinboard.style.opacity = "1";
        pinboard.style.pointerEvents = "auto";
    }
}

// Wiring up Prev/Next buttons
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentActivePage > 1) loadPage(currentActivePage - 1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    // Assuming maxPage is available in cache from initial load
    const initialData = propagandaCache.get(1);
    const max = initialData ? initialData.maxPage : 4; 
    if (currentActivePage < max) loadPage(currentActivePage + 1);
});

// Initialize App
window.onload = () => {
    loadPage(1);
};

// ==========================
// Modal Logic
// ==========================
const modal = document.getElementById('fullscreen');
const modalImg = document.getElementById('fullscreen-img');
const modalDesc = document.getElementById('fullscreen-txt')
console.log(modalDesc)
const modalClose = document.querySelector('.modal-close');

// Function called by the image click event
function openModal(imgUrl, imgTxt) {
    modalImg.src = imgUrl;            // Set the full high-res image URL
    modalDesc.innerHTML = imgTxt;
    modal.classList.add('active');    // Show the modal
}

// Close modal when clicking the 'X'
modalClose.onclick = () => {
    modal.classList.remove('active');
    modalImg.src = ''; // Optional: clear the image while hidden
};

// Close modal when clicking on the dark background outside the image
modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        modalImg.src = ''; 
    }
};
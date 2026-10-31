import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// Define the designated folder paths for your JSON files here
const jsonFiles = [
    './eventPtsJson/ronoOp.json',
    './eventPtsJson/sawangOp.json',
    './eventPtsJson/zombieOp.json',
    './eventPtsJson/rgeOp.json',
    './eventPtsJson/gamenight.json',
    './eventPtsJson/examOp.json'
];

async function loadEventButtons() {
    // Target the container from index.html
    const pointsBtnContainer = document.querySelector('.pointsBtn');
    
    // Clear out the existing hardcoded HTML buttons
    pointsBtnContainer.innerHTML = ''; 

    for (const file of jsonFiles) {
        try {
            const response = await fetch(file);
            const data = await response.json();

            // 1. Fetch the name and strip 'POINTS' from it
            // e.g., converts "RONOGRAD OPERATION POINTS" to "RONOGRAD OPERATION"
            const cleanedName = data.name.replace('POINTS', '').trim();

            // 2. Fetch the thumbnail image path
            const thumbImage = data.thumbPath;
            const eventId = data.id;
            // 3. Create the new .btnEvent div
            const btnDiv = document.createElement('div');
            btnDiv.classList.add('btnEvent');
            btnDiv.addEventListener("click", async (e) => {
                window.location.href = `./event.html?type=${eventId}`;
                return;
            })
            
            // Apply the background image to the div
            btnDiv.style.backgroundImage = `url('${thumbImage}')`;
            btnDiv.style.backgroundSize = 'cover'; 
            btnDiv.style.backgroundPosition = 'center';

            // 4. Create the span and apply the stripped text
            const span = document.createElement('span');
            span.textContent = cleanedName;

            // 5. Append the span to the button, and the button to the container
            btnDiv.appendChild(span);
            pointsBtnContainer.appendChild(btnDiv);

        } catch (error) {
            console.error(`Failed to load or parse ${file}:`, error);
        }
    }
}

loadEventButtons()
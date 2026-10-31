import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// Array of your JSON files stored in the designated folder
const jsonFiles = [
    './eventPtsJson/ronoOp.json',
    './eventPtsJson/sawangOp.json',
    './eventPtsJson/zombieOp.json',
    './eventPtsJson/rgeOp.json',
    './eventPtsJson/gamenight.json',
    './eventPtsJson/examOp.json'
];

async function loadEventDetails() {
    // 1. Read the 'id' query parameter from the URL (e.g., ?id=ronoOp)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('type');

    if (!queryId) return;

    let matchedData = null;

    // 2. Fetch files and find the one matching the query ID
    for (const file of jsonFiles) {
        try {
            const response = await fetch(file);
            const data = await response.json();
            
            // Match the query with the id property in the JSON
            if (data.id === queryId) {
                matchedData = data;
                break; // Stop searching once the correct file is found
            }
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
        }
    }

    if (matchedData) {
        // 3. Replace the #eventTitle with the JSON 'name' property
        const eventTitle = document.getElementById('eventTitle');
        eventTitle.innerHTML = `<u>${matchedData.name}</u>`;
        
        if (matchedData.maxPts) {
            document.getElementById('maxPts').textContent = matchedData.maxPts;
        }

        // 4. Apply the image to the separate HTML <img> element
        const bgImageElement = document.getElementById('eventBgImage');
        bgImageElement.src = matchedData.imgPath;

        // 5. Generate Criteria Lists
        const criteriasContainer = document.querySelector('.criterias');
        criteriasContainer.innerHTML = '';

        // Loop through the 'criteria' array in the JSON
        matchedData.criteria.forEach(crit => {
            // Create the bounding div for a single criteria section
            const criteriaDiv = document.createElement('div');
            criteriaDiv.classList.add('criteria');

            // Set the criteria name (e.g., "Time points:")
            const spanName = document.createElement('span');
            spanName.textContent = crit.name;
            criteriaDiv.appendChild(spanName);

            // Create the ul list and populate it with the 'content' array
            const ul = document.createElement('ul');
            crit.content.forEach(itemText => {
                const li = document.createElement('li');
                li.textContent = itemText;
                ul.appendChild(li);
            });
            
            criteriaDiv.appendChild(ul);
            criteriasContainer.appendChild(criteriaDiv);
        });
    }
}

loadEventDetails()
import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// Point this to your actual JSON file path
const jsonFileUrl = './awardQuery.json';

async function loadAwards() {
    const container = document.getElementById('awards-container');
    const template = document.getElementById('award-template');

    try {
        const response = await fetch(jsonFileUrl);
        const data = await response.json();

        // Loop through each award object in the JSON array
        data.forEach(award => {
            // 1. Clone the entire HTML structure inside the <template>
            const clone = template.content.cloneNode(true);

            // 2. Target the specific elements inside the clone and populate them
            const img = clone.querySelector('.award-img');
            img.src = award.imgPath;
            img.alt = award.name;

            const title = clone.querySelector('.award-title');
            title.textContent = award.name;

            title.style.color = award.color;
            title.style.backgroundColor = award.color + '40';

            const desc = clone.querySelector('.award-description');
            desc.textContent = award.description;

            // 3. Inject the finished clone into the DOM
            container.appendChild(clone);
        });
    } catch (error) {
        console.error("Failed to fetch or parse awards JSON:", error);
    }
}

loadAwards()
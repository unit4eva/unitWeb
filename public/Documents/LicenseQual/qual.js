import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// Point this to your actual JSON file path
const jsonFileUrl = './qualQuery.json';

async function loadQualifications() {
    try {
        const response = await fetch(jsonFileUrl);
        const qualsData = await response.json();
        const container = document.getElementById('qualifications-container');
        const categoryTemplate = document.getElementById('category-template');
        const qualTemplate = document.getElementById('qual-template');

        // Loop through each category (e.g., MAIN QUALIFICATIONS)
        qualsData.forEach(category => {
            // Clone the category template
            const catClone = categoryTemplate.content.cloneNode(true);
            
            // Set the category title
            const titleTag = catClone.querySelector('.categoryTitle u');
            titleTag.textContent = category.categoryName;
            
            const qualsList = catClone.querySelector('.qualsList');

            // Loop through the qualifications inside this category
            category.quals.forEach(qual => {
                // Clone the individual accordion item template
                const qualClone = qualTemplate.content.cloneNode(true);
                const itemDiv = qualClone.querySelector('.accordionItem');
                
                // Set qualification name
                qualClone.querySelector('.qualName').textContent = qual.qualName;
                
                // Populate the bulleted description list
                const descUl = qualClone.querySelector('.qualDesc');
                qual.desc.forEach(descText => {
                    const li = document.createElement('li');
                    // Use innerHTML here because the JSON contains <br> tags
                    li.innerHTML = descText;
                    descUl.appendChild(li);
                });

                // Set the criteria text
                qualClone.querySelector('.qualCriteria u strong').textContent = qual.criteria;

                // Add click listener for the accordion dropdown effect
                const header = qualClone.querySelector('.accordionHeader');
                header.addEventListener('click', () => {
                    // Toggles the 'active' class on the parent div to show/hide content
                    itemDiv.classList.toggle('active');
                });

                // Append the finished qualification item to the category's list
                qualsList.appendChild(qualClone);
            });

            // Append the finished category section to the main page container
            container.appendChild(catClone);
            
    });
    } catch (error) {
        console.error("Failed to fetch or parse qual JSON:", error);
    }
}

loadQualifications()
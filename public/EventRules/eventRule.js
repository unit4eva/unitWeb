import {loadFile} from "/public/Components/shared.js";
// Load navbar
loadFile("/public/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/public/Components/Footer/footer.html", "footer");


const sidebarLinks = document.querySelectorAll('.leftSidebar a');

sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
        // Remove the 'active' class from all links
        sidebarLinks.forEach(l => l.classList.remove('active'));
        
        // Add the 'active' class to the clicked link
        this.classList.add('active');
    });
});
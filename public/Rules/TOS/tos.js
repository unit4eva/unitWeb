import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");


const sidebarLinks = document.querySelectorAll('.leftSidebar a');

sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
        // Remove the 'active' class from all links
        sidebarLinks.forEach(l => l.classList.remove('active'));
        
        // Add the 'active' class to the clicked link
        this.classList.add('active');
    });
});
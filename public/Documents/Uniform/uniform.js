import {loadFile} from "/Components/shared.js";
// Load navbar
loadFile("/Components/Navbar/navbar.html", "navbar");
// Load footer
loadFile("/Components/Footer/footer.html", "footer");

// Dropdown
document.querySelectorAll('.custom-dropdown').forEach((dropdown) => {
  const trigger = dropdown.querySelector('.dropdown-trigger');
  const triggerImg = trigger.querySelector('.unit-icon');
  const triggerLabel = trigger.querySelector('.selected-label');
  const items = dropdown.querySelectorAll('.dropdown-item');


  // Update trigger content on item selection
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const itemLabel = item.querySelector('.item-label').textContent;
      const itemImg = item.querySelector('.unit-icon');

      triggerLabel.textContent = itemLabel;
      if (triggerImg && itemImg) {
        triggerImg.src = itemImg.src;
        triggerImg.alt = itemImg.alt;
      }

      dropdown.dataset.selectedValue = item.dataset.value;
      dropdown.classList.remove('open');
    });
  });
});

// Close dropdowns when clicking anywhere outside
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-dropdown.open').forEach((dropdown) => {
    dropdown.classList.remove('open');
  });
});


const unitJsonMap = {
  "landforce": "/data/uniform/main/landforce.json",
  "airforce": "/data/uniform/main/aircorp.json",
  "broadsword": "/data/uniform/main/broadsword.json"
};

// =========================================
// Global State
// =========================================
let currentUnitData = null;
let currentRoleIndex = 0;
let currentAngleIndex = 0; // 0 = front, 1 = right, 2 = back, 3 = left

// DOM Elements
const uniformImgEl = document.getElementById("uniform-image");
const calloutLayer = document.getElementById("callout-layer");
const unitMenu = document.querySelector("#unit-dropdown .dropdown-menu");
const unitTriggerLabel = document.querySelector(".unit-selector .selected-label");
const unitTriggerIcon = document.querySelector(".unit-selector .unit-icon");
const roleMenu = document.querySelector(".role-selector .dropdown-menu");
const roleTriggerLabel = document.querySelector(".role-selector .selected-label");
const additionalNoteEl = document.getElementById("additional-note");

// =========================================
// Initialization & Fetching
// =========================================

// Fetches all JSONs in unitJsonMap to populate #unit-dropdown with real logos & names
async function buildUnitDropdown() {
  unitMenu.innerHTML = ""; // Clear hardcoded placeholder <li> items

  const entries = Object.entries(unitJsonMap);

  for (const [unitKey, jsonUrl] of entries) {
    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const unitData = await response.json();

      // Create the <li> element matching #unit-dropdown structure
      const li = document.createElement("li");
      li.className = "dropdown-item";
      li.dataset.value = unitKey;
      li.innerHTML = `
        <img src="${unitData.logoPath}" alt="${unitData.name} Logo" class="unit-icon"/>
        <span class="item-label">${unitData.name}</span>
      `;

      // Switch unit when clicked
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        currentUnitData = unitData;
        currentRoleIndex = 0;
        currentAngleIndex = 0;

        document.getElementById("unit-dropdown").classList.remove("open");
        initializeViewer();
      });

      unitMenu.appendChild(li);

      // Load the first unit into the viewer by default
      if (!currentUnitData) {
        currentUnitData = unitData;
        initializeViewer();
      }
    } catch (error) {
      console.error(`Error loading unit JSON for "${unitKey}" (${jsonUrl}):`, error);
    }
  }
}

function initializeViewer() {
  if (!currentUnitData) return;

  // 1. Update Top-Level Unit UI dynamically from the selected JSON
  unitTriggerLabel.textContent = currentUnitData.name;
  if (unitTriggerIcon) {
    unitTriggerIcon.src = currentUnitData.logoPath;
    unitTriggerIcon.alt = `${currentUnitData.name} Logo`;
  }
  if (additionalNoteEl) additionalNoteEl.textContent = currentUnitData.additionalNote;

  // 2. Build bottom Role Dropdown
  buildRoleDropdown();

  // 3. Render the Uniform Stage
  renderStage();
}

// =========================================
// UI Rendering
// =========================================

function buildRoleDropdown() {
  roleMenu.innerHTML = ""; 

  currentUnitData.uniform.forEach((role, index) => {
    const li = document.createElement("li");
    li.className = "dropdown-item";
    li.dataset.value = index;
    li.innerHTML = `<span class="item-label">${role.roleName}</span>`;

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      currentRoleIndex = index;
      currentAngleIndex = 0;
      
      roleTriggerLabel.textContent = role.roleName;
      document.querySelector(".role-selector").classList.remove("open");
      
      renderStage();
    });

    roleMenu.appendChild(li);
  });

  if (currentUnitData.uniform.length > 0) {
    roleTriggerLabel.textContent = currentUnitData.uniform[0].roleName;
  }
}

function renderStage() {
  const currentRole = currentUnitData.uniform[currentRoleIndex];
  
  uniformImgEl.src = currentRole.relativePath + currentRole.uniformImg[currentAngleIndex];
  uniformImgEl.alt = `${currentRole.roleName} - View ${currentAngleIndex + 1}`;

  renderCallouts(currentRole.description);
}

function renderCallouts(descriptions) {
  calloutLayer.innerHTML = ""; 

  descriptions.forEach((item) => {
    const listItemsHTML = item.desc.map(text => `<li>${text}</li>`).join("");

    const calloutDiv = document.createElement("div");
    calloutDiv.className = `callout turn-${item.turn}`;
    calloutDiv.style.setProperty("--margin-top", item.marginTop);
    calloutDiv.style.setProperty("--margin-right", item.marginRight);

    calloutDiv.innerHTML = `
      <span class="callout-dot"></span>
      <div class="callout-body">
        <div class="callout-line"></div>
        <ul class="callout-list">
          ${listItemsHTML}
        </ul>
      </div>
    `;

    calloutLayer.appendChild(calloutDiv);
  });
}

// =========================================
// Event Listeners
// =========================================

document.getElementById("btn-turn-left").addEventListener("click", () => {
  if (!currentUnitData) return;
  const images = currentUnitData.uniform[currentRoleIndex].uniformImg;
  currentAngleIndex = (currentAngleIndex - 1 + images.length) % images.length;
  renderStage();
});

document.getElementById("btn-turn-right").addEventListener("click", () => {
  if (!currentUnitData) return;
  const images = currentUnitData.uniform[currentRoleIndex].uniformImg;
  currentAngleIndex = (currentAngleIndex + 1) % images.length;
  renderStage();
});

// Dropdown Toggles
document.querySelectorAll(".dropdown-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = trigger.parentElement;
    
    document.querySelectorAll(".custom-dropdown.open").forEach((openDrop) => {
      if (openDrop !== dropdown) openDrop.classList.remove("open");
    });
    
    dropdown.classList.toggle("open");
  });
});

// Close clicking outside
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
  });
});

// =========================================
// Boot Sequence
// =========================================
buildUnitDropdown();
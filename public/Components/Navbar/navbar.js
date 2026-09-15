import { translateData } from "/util/LanguageSwitching/lang.js";


// Light dark
var r = document.querySelector(':root');
var lida = document.getElementById("LDbtn");
var ldStatus = document.getElementById("ldStatus");

async function switchTheme(bgColor, txtColor, lanShadow, ldFloat, ldColor, lanHover, idLan) {
    r.style.setProperty('--bg-color', bgColor);
    r.style.setProperty('--txt-color', txtColor);
    r.style.setProperty('--float-ld', ldFloat);
    r.style.setProperty('--ld-color', ldColor);
    r.style.setProperty('--lan-hover', lanHover);
    r.style.setProperty('--lan-shadow', lanShadow);
    ldStatus.setAttribute("idLan", idLan)
    await translateData(curLan)
}

function themeBool(l = true) {
    if (l) {
        switchTheme("#ECF9FF", "#1A272D", "#13223526", "right", "#F7C215", "#c5ccd5", "navbar.theme.light");
        // location.href='#light';
    } else {
        switchTheme("#1A272D", "#ECF9FF", "#E9F2FF26", "left", "#E9F2FF", "#1f3046ff", "navbar.theme.dark");
        // location.href='#dark';
    }
    const themeSignal = new CustomEvent('themeChanged');
    document.dispatchEvent(themeSignal);
}
var light = localStorage.getItem("light") || true
r.style.setProperty('--light', light);
if (light == "false") {
    light = false
}
r.style.setProperty('--light', light);
console.log(light)
themeBool(light)

lida.onclick = function() {
    light = !light;
    localStorage.setItem("light", light)
    console.log(light)
    themeBool(light);
    r.style.setProperty('--light', light);
    if (light) {
        console.log("lights on")
    } else {
        console.log("lights off")
    }
}

// Language switching
var langList = document.getElementById('lanList')
var lanBtn = document.getElementById('lanButton')
var curLan = localStorage.getItem('selectedLanguage') || 'en';

const fetchLangData = async () => {
    try {
        const body = await (await fetch("/data/Language/langMap.json")).json()
        return body
    } catch (error) {
        console.error("failed to fetch lang data")
        return []
    }
}

function innitLangDropdown(data) {
    const curLanObj = data.find(l => l.lang == curLan)
    lanBtn.innerHTML = `<img src=${curLanObj.flag} alt="" class="flagImg" id="curFlag">
                        <span id="curLan">${curLanObj.label}</span>
                        <i class="fa-solid fa-caret-down"></i>`
    langList.innerHTML = ""
    data.forEach(lang => {
        if (lang.lang === curLan) return
        const li = document.createElement('li')
        li.innerHTML = `<img src="${lang.flag}">
                        <span>${lang.label}</span>`
        li.addEventListener('click', async () => {
            curLan = lang.lang
            localStorage.setItem('selectedLanguage', curLan)
            innitLangDropdown(data)
            lanList.classList.remove('active')
            console.log('switched to ' + curLan)
            await translateData(curLan)
        })
        langList.appendChild(li)
    });
}

function dropdownInteracted() {
    lanBtn.addEventListener('click', () => {
        langList.classList.toggle('active')
    })

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lan')) {
            langList.classList.remove('active')
        }
    })
}

const langLoadMain = async () => {
    dropdownInteracted()
    const langData = await fetchLangData()

    console.log(langData)
    innitLangDropdown(langData)
    await translateData(curLan)
}

langLoadMain()

// Hamburger button
var hamBtn = document.getElementById('hamburgerButton')
var botNav = document.getElementById('botNav')
hamBtn.onclick = function () {
    botNav.classList.toggle('active')
}

// Add navigation links
fetch('/data/nav/navMap.json')
        .then(response => response.json())
        .then(data => buildNav(data))
        .catch(error => console.error('Error loading navigation map:', error));

function buildNav(navData) {
    const navContainer = document.getElementById('navContainer');
    navContainer.innerHTML = '';
    for (const [key, value] of Object.entries(navData)) {
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';

        // Generate internationalization ID (e.g., "Propaganda" -> "navbar.leftside.propaganda")
        const idLan = `navbar.leftside.${key.toLowerCase().replace(/\s+/g, '')}`;

        if (typeof value === 'string') {
            // Logic for Direct Links (e.g., Propaganda, Join Us)
            const link = document.createElement('a');
            link.href = value;
            link.textContent = key;
            link.setAttribute('idLan', idLan);
            navItem.appendChild(link);
        } 
        else if (typeof value === 'object') {
            // Logic for Dropdowns (e.g., Documents, Utility)
            navItem.classList.add('dropdown');

            // Create the dropdown trigger button
            const dropBtn = document.createElement('a');
            dropBtn.href = 'javascript:void(0)';
            dropBtn.className = 'dropbtn';
            dropBtn.innerHTML = `${key} <span class="arrow">&#9662;</span>`;
            dropBtn.setAttribute('idLan', idLan);
            navItem.appendChild(dropBtn);

            // Create the Mega Menu container
            const megaMenu = document.createElement('div');
            megaMenu.className = 'mega-menu';

            // Convert object to array to split into columns
            const groups = Object.entries(value);
            const maxGroupsPerCol = 2; // Adjust this to change column heights

            for (let i = 0; i < groups.length; i += maxGroupsPerCol) {
                const colDiv = document.createElement('div');
                colDiv.className = 'mega-col';

                // Slice the array into chunks for each column
                const columnChunk = groups.slice(i, i + maxGroupsPerCol);
                
                columnChunk.forEach(([groupName, links]) => {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'mega-group';

                    // Add category header
                    const header = document.createElement('h3');
                    header.textContent = groupName;
                    groupDiv.appendChild(header);

                    // Add category links
                    for (const [linkName, linkHref] of Object.entries(links)) {
                        const a = document.createElement('a');
                        a.href = linkHref;
                        a.textContent = linkName;
                        groupDiv.appendChild(a);
                    }
                    colDiv.appendChild(groupDiv);
                });
                megaMenu.appendChild(colDiv);
            }
            navItem.appendChild(megaMenu);
        }
        navContainer.appendChild(navItem);
    }
}
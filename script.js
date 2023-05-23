let config

// nacteni konfiguraku
async function loadConfig() {
    const response = await fetch('config.json');
    return await response.json();
}

// nacteni dat suplovani
async function fetchData() {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
}

// nacteni dat specialnich oznameni a udalosti 
async function fetchAnnouncements() {
    const response = await fetch('oznameni.json');
    const data = await response.json();
    return data;
}

// tvorba tabulky pro kazdou tridu
function createClassTable(className, substitutions) {
    const classTable = document.createElement('table');
    classTable.className = 'class-table';
    classTable.style.width = '100%';
    classTable.style.tableLayout = 'fixed';

    const classHeader = document.createElement('tr');
    const classNameCell = document.createElement('th');
    classNameCell.colSpan = 5;
    classNameCell.style.textAlign = 'center';
    classNameCell.textContent = className;
    classHeader.appendChild(classNameCell);
    classTable.appendChild(classHeader);

    substitutions.forEach(substitution => {
        const subRow = document.createElement('tr');
        
        // kdyz je jen jedna bunka tak ji dame proste do jedne bunky a doprostred
        if (substitution.length === 1) {
            const singleCell = document.createElement('td');
            singleCell.colSpan = 5;
            singleCell.style.textAlign = 'center';
            singleCell.textContent = substitution[0];
            subRow.appendChild(singleCell);
        } else {
            // prvni bunka
            const firstCell = document.createElement('td');
            firstCell.textContent = substitution[0];
            subRow.appendChild(firstCell);

            // spojeni prvni a treti bunky
            const unifiedCell = document.createElement('td');
            unifiedCell.innerHTML = substitution[1] + (substitution[2].trim() !== '' ? ` <span class="gray-text">(${substitution[2]})</span>` : '');
            subRow.appendChild(unifiedCell);

            // ctvrta bunka
            const fourthCell = document.createElement('td');
            fourthCell.textContent = substitution[3];
            subRow.appendChild(fourthCell);

            // spojeni pate a sedme bunky
            const unitedCell = document.createElement('td');
            if (substitution.length > 5) {
                if (substitution[4].endsWith('>>') || substitution[4].endsWith('<<')) {
                    substitution[4] = substitution[4].slice(0, -2);
                }
            }
            unitedCell.textContent = substitution[4] + ' ' + substitution[6];
            subRow.appendChild(unitedCell);

            // ostatni bunky
            for (let i = 5; i < substitution.length; i++) {
                if (i !== 6) {
                    const subCell = document.createElement('td');
                    subCell.textContent = substitution[i];
                    subRow.appendChild(subCell);
                }
            }
        }
        classTable.appendChild(subRow);
    });

    return classTable;
}

// pokud je toho moc tak to rozdelime na stranky
function paginateContent() {
    const container = document.getElementById('container');
    const screenHeight = 1080;
    let currentHeight = 0;
    let currentPage = 0;

    const pageElements = [];
    let currentPageElements = [];

    // pokus o pocitani toho kolik stranek potrebuju
    container.childNodes.forEach((child, index) => {
        const childHeight = child.offsetHeight;

        if (currentHeight + childHeight > screenHeight) {
            currentPage += 1;
            currentHeight = 0;
            pageElements.push(currentPageElements);
            currentPageElements = [];
        }

        currentHeight += childHeight;
        currentPageElements.push(child);
    });

    pageElements.push(currentPageElements);

    // zoobrazeni a schovani stranky (nemam rad javascript)
    const displayPage = (pageIndex) => {
        container.childNodes.forEach((child) => child.classList.add('hidden'));
        pageElements[pageIndex].forEach((element) => element.classList.remove('hidden'));

        updateCurrentInfo(pageIndex + 1, pageElements.length);

        setTimeout(() => {
            if (pageIndex < pageElements.length - 1) {
                displayPage(pageIndex + 1);
            } else {
                displaySubstitutions();
                displayAnnouncements();
            }
        }, config.interval_zobrazeni_jedne_stranky_milisekundy);
    };

    displayPage(0);
}

let currentDayIndex = 0;
let currentDate = '';

// zobrazeni specialnich oznameni a udalosti
async function displayAnnouncements() {
    const data = await fetchAnnouncements();
    const container = document.getElementById('announcements');
    container.innerHTML = '';

    const announcements = data[currentDate];
    if (announcements) {
        const announcementParagraph = document.createElement('p');
        announcementParagraph.className = 'announcement';
        
        // rozdelim to podle newlinu a vytvorim pro kazdy radek novy element abych je mohl dat hezky dolu vedle sebe
        for (const announcement of announcements.split('\n')) {
            const announcementParagraph = document.createElement('p');
            announcementParagraph.className = 'announcement';
            announcementParagraph.textContent = announcement;
            container.appendChild(announcementParagraph);
        }
    }
}

// tohle je nejdulezitejsi funkce
async function displaySubstitutions() {
    const data = await fetchData();
    const container = document.getElementById('container');
    container.innerHTML = '';
    const dateKeys = Object.keys(data);
    currentDate = dateKeys[currentDayIndex % dateKeys.length];
    currentDate = dateKeys[currentDayIndex % dateKeys.length];
    const substitutions = data[currentDate];

    let currentClass = '';
    let classSubstitutions = [];

    for (const [className, subData] of substitutions) {
        if (className !== '') {
            if (currentClass !== '') {
                const classTable = createClassTable(currentClass, classSubstitutions);
                container.appendChild(classTable);
            }
            currentClass = className;
            classSubstitutions = [];
        }
        classSubstitutions.push(subData);
    }

    if (currentClass !== '') {
        const classTable = createClassTable(currentClass, classSubstitutions);
        container.appendChild(classTable);
    }

    await loadConfig().then((configData) => {
        config = configData;
    });
    paginateContent();

    currentDayIndex += 1;
}

// aktualizace informaci o aktualnim dni a casu
function updateCurrentInfo(dayPage, totalPages) {
    const currentDateDiv = document.getElementById('current-date');
    const currentTimeDiv = document.getElementById('current-time');
    const currentDayPageDiv = document.getElementById('current-day-page');
    const now = new Date();
    const time = now.toLocaleTimeString('cs-CS', { hour12: false });
    currentDateDiv.textContent = currentDate.split('-').reverse().join('.');
    currentTimeDiv.textContent = time;
    
    if (dayPage !== undefined && totalPages !== undefined) {
        currentDayPageDiv.textContent = `${dayPage}/${totalPages}`;
    }
}

// cas aktualizuju obviously kazdou sekundu
setInterval(updateCurrentInfo, 1000);

function changeDay() {
    console.log("start");
    updateCurrentInfo();
    displaySubstitutions();
    displayAnnouncements();
}

// velky tresk
changeDay();
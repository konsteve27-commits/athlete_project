let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

const athletePhotos = [
    { src: 'images/2025.jpg', alt: '2025 Tokyo', category: 'action' },
    { src: 'images/2024.jpg', alt: '2024 Paris Olympics', category: 'action' },
    { src: 'images/2019.jpg', alt: '2019 NCAA Championships', category: 'action' },
    { src: 'images/teamsusa.jpg', alt: 'Teams USA', category: 'Social' },
    { src: 'images/callsout.jpg', alt: 'Calls Out 2022', category: 'Social' }
];

window.onload = function () {
    if (isLoggedIn) updateUIForLoggedIn();
    const lastPage = localStorage.getItem('lastPage') || 'bio';
    handleNav(lastPage);
};

function updateUIForLoggedIn() {
    document.getElementById('li-login')?.classList.add('hidden');
    document.getElementById('li-logout')?.classList.remove('hidden');
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
}

function toggleSidebar() {
    document.querySelector('.aside')?.classList.toggle('active');
}

function handleNav(menuOption) {
    localStorage.setItem('lastPage', menuOption);

    // Active Link styling 
    document.querySelectorAll('.main-menu a').forEach(link => {
        link.classList.remove('active-link');
        if (link.getAttribute('onclick').includes(`'${menuOption}'`)) link.classList.add('active-link');
    });

    // Sidebar management 
    document.querySelectorAll('.aside-group').forEach(el => el.classList.add('hidden'));
    document.getElementById('aside-' + menuOption)?.classList.remove('hidden');
    document.querySelector('.aside')?.classList.remove('active');

    if (menuOption === 'bio') filterBio('all');
    else if (menuOption === 'photos') filterPhotos('all');
    else if (menuOption === 'awards') { showSection('dynamic-view'); fetchData('awards'); }
    else if (menuOption === 'links') { showSection('dynamic-view'); fetchData('links'); }
    else if (menuOption === 'admin') {
        isLoggedIn ? (showSection('admin-panel'), refreshAdminTables()) : showSection('admin-login');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(sectionId)?.classList.remove('hidden');
}

// Bio Filtering 
function filterBio(option) {
    if (option === 'all') {
        const sections = ['bio-early', 'bio-career', 'bio-2021', 'bio-2023', 'bio-2024', 'bio-2025'];
        let fullContent = "";
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                fullContent += `<div style="margin-bottom: 30px;">${element.innerHTML}</div>`;
            }
        });
        
        document.getElementById('bio-all-content').innerHTML = fullContent;
        showSection('bio-all');
    } else {
        showSection(option);
    }
}

// Photo flexbox filtering
function filterPhotos(category) {
    const container = document.getElementById('photos-container');
    const title = document.getElementById('photos-title');
    showSection('photos-view');

    title.innerText = category === 'all' ? "All Photos" : category.toUpperCase() + " Photos";

    const filtered = category === 'all' ? athletePhotos : athletePhotos.filter(p => p.category === category);

    container.innerHTML = filtered.map(p => `
        <div class="photo-item">
            <img src="${p.src}" alt="${p.alt}" style="width:100%; border-radius:4px;">
            <p>${p.alt}</p>
        </div>
    `).join('');
}


// mobile side menu
function toggleSidebar() {
    document.querySelector('.aside')?.classList.toggle('active');
}


// Fetches json data from the server and renders it in a table 
async function fetchData(type, filterValue = null) {
    const container = document.getElementById('table-container');
    document.getElementById('dynamic-title').innerText = type.toUpperCase();
    container.innerHTML = "Loading data...";

    try {
        const res = await fetch(`/api/${type}`);
        let data = await res.json();

        // filtering from aside menu 
        if (filterValue) {
            data = data.filter(item =>
                Object.values(item).some(val =>
                    val.toString().toLowerCase().includes(filterValue.toLowerCase())
                )
            );
        }
        renderTable(data, container);
    } catch (err) {
        container.innerHTML = "Error loading data.";
    }
}

// Renders the data array 
function renderTable(data, container) {
    if (!data.length) { container.innerHTML = "No records found."; return; }

    let html = '<div class="table-wrapper"><table><thead><tr>';
    Object.keys(data[0]).forEach(k => { if (k !== 'id') html += `<th>${k.toUpperCase()}</th>` });
    html += '</tr></thead><tbody>';

    data.forEach(row => {
        html += '<tr>';
        Object.keys(row).forEach(k => {
            if (k !== 'id') {
                let val = row[k];
                html += val.toString().startsWith('http') ?
                    `<td><a href="${val}" target="_blank">Visit Link</a></td>` : `<td>${val}</td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}


// Verifie user 
async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        })
    });
    if (res.ok) {
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        updateUIForLoggedIn();
        handleNav('admin');
    } else {
        alert('Invalid Credentials');
    }
}

// Performs logout and clears session data 
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    isLoggedIn = false;
    localStorage.clear();
    window.location.reload();
}

//logic add delete edit

async function refreshAdminTables() {
    await renderAdminTable('awards', 'admin-table-container');
    await renderAdminTable('links', 'admin-links-container');
}

async function renderAdminTable(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const res = await fetch(`/api/${type}`);
    const data = await res.json();

    const headers = type === 'awards' ? ['Year', 'Event', 'Medal'] : ['Title', 'URL', 'Type'];

    let html = `<h3>Manage ${type.toUpperCase()}</h3><div class="table-wrapper"><table><thead><tr>`;
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `<th>Actions</th></tr></thead><tbody id="${type}-tbody">`;

    data.forEach(item => {
        html += `<tr id="${type}-${item.id}">
            ${type === 'awards' ?
                `<td>${item.year}</td><td>${item.event}</td><td>${item.medal}</td>` :
                `<td>${item.title}</td><td>${item.url}</td><td>${item.type}</td>`}
            <td>
                <button onclick="editRow('${type}', ${item.id})">Edit</button>
                <button class="delete-btn" onclick="deleteItem('${type}', ${item.id})">Delete</button>
            </td></tr>`;
    });
    html += `</tbody></table></div><button onclick="addNewRow('${type}')" class="add-btn">+ Add New ${type}</button>`;
    container.innerHTML = html;
}

// Converts a table row into input fields for editing 
function editRow(type, id) {
    const row = document.getElementById(`${type}-${id}`);
    const c = row.cells;
    if (type === 'awards') {
        row.innerHTML = `<td><input id="e-y-${id}" value="${c[0].innerText}"></td>
                         <td><input id="e-e-${id}" value="${c[1].innerText}"></td>
                         <td><input id="e-m-${id}" value="${c[2].innerText}"></td>
                         <td><button onclick="updateItem('awards', ${id})">Update</button></td>`;
    } else {
        row.innerHTML = `<td><input id="e-t-${id}" value="${c[0].innerText}"></td>
                         <td><input id="e-u-${id}" value="${c[1].innerText}"></td>
                         <td><input id="e-type-${id}" value="${c[2].innerText}"></td>
                         <td><button onclick="updateItem('links', ${id})">Update</button></td>`;
    }
}

//update existing records 
async function updateItem(type, id) {
    const payload = type === 'awards' ?
        { year: document.getElementById(`e-y-${id}`).value, event: document.getElementById(`e-e-${id}`).value, medal: document.getElementById(`e-m-${id}`).value } :
        { title: document.getElementById(`e-t-${id}`).value, url: document.getElementById(`e-u-${id}`).value, type: document.getElementById(`e-type-${id}`).value };

    await fetch(`/api/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    refreshAdminTables();
}

// Deletes a record 
async function deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
        refreshAdminTables();
    }
}

function addNewRow(type) {
    const tbody = document.getElementById(`${type}-tbody`);
    const row = document.createElement('tr');
    if (type === 'awards') {
        row.innerHTML = `<td><input id="n-y"></td><td><input id="n-e"></td><td><input id="n-m"></td>
                         <td><button onclick="saveNew('awards')">Save</button></td>`;
    } else {
        row.innerHTML = `<td><input id="n-t"></td><td><input id="n-u"></td><td><input id="n-type"></td>
                         <td><button onclick="saveNew('links')">Save</button></td>`;
    }
    tbody.prepend(row);
}

// save new data 
async function saveNew(type) {
    const payload = type === 'awards' ?
        { year: document.getElementById('n-y').value, event: document.getElementById('n-e').value, medal: document.getElementById('n-m').value } :
        { title: document.getElementById('n-t').value, url: document.getElementById('n-u').value, type: document.getElementById('n-type').value };

    await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    refreshAdminTables();
}
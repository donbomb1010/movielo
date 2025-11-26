// js/download.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
// Import from firebase.js (Prevents duplicate app error)
import { auth, addDownloadItem, getDownloadItems, deleteDownloadItem } from './firebase.js';

// --- CONFIGURATION ---
const ADMIN_EMAIL = "wow@gmail.com"; // Put your email here

let currentUserEmail = "";

window.onload = () => {
    // 1. Check Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserEmail = user.email;
            checkAdmin();
            loadDownloads();
        } else {
            window.location.href = 'auth.html';
        }
    });

    // 2. Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = 'auth.html');
        });
    }

    // 3. Add Movie Button Logic
    const addBtn = document.getElementById('btn-add-download');
    if(addBtn) {
        addBtn.addEventListener('click', addNewMovie);
    }

    // 4. 👇 NEW: SEARCH BAR LOGIC 👇
    const searchInput = document.getElementById('download-search');
    if(searchInput) {
        searchInput.addEventListener('keyup', filterDownloads);
    }
};

// --- SEARCH FUNCTION ---
function filterDownloads() {
    const query = document.getElementById('download-search').value.toLowerCase();
    const cards = document.querySelectorAll('.download-card');

    cards.forEach(card => {
        // Find the Movie Name inside the h3 tag
        const title = card.querySelector('h3').innerText.toLowerCase();
        
        // Check if title contains the search text
        if(title.includes(query)) {
            card.style.display = "flex"; // Show
        } else {
            card.style.display = "none"; // Hide
        }
    });
}

// --- ADMIN CHECK ---
function checkAdmin() {
    if (!currentUserEmail || !ADMIN_EMAIL) return;
    const current = currentUserEmail.trim().toLowerCase();
    const admin = ADMIN_EMAIL.trim().toLowerCase();

    if (current === admin) {
        const panel = document.getElementById('admin-panel');
        if(panel) panel.classList.remove('hidden');
    }
}

// --- LOAD DOWNLOADS ---
async function loadDownloads() {
    const container = document.getElementById('downloads-list');
    if(!container) return;
    
    container.innerHTML = '<p style="text-align:center; color:#666;">Updating list...</p>';

    const items = await getDownloadItems();

    if(items.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">No movies available for download yet.</p>';
        return;
    }

    const current = currentUserEmail.trim().toLowerCase();
    const admin = ADMIN_EMAIL.trim().toLowerCase();
    const isAdmin = (current === admin);

    container.innerHTML = items.map(item => {
        return `
            <div class="download-card">
                <div class="d-info">
                    <h3><i class="fas fa-film"></i> ${item.name}</h3>
                </div>
                <div class="d-actions">
                    <a href="${item.link}" target="_blank" class="btn-download">
                        Download <i class="fas fa-download"></i>
                    </a>
                    ${isAdmin ? `<button class="btn-delete" onclick="window.removeMovie('${item.id}')" style="margin-left:10px;"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// --- ADD MOVIE ---
async function addNewMovie() {
    const nameInput = document.getElementById('movie-name');
    const linkInput = document.getElementById('movie-link');

    if(!nameInput.value || !linkInput.value) {
        alert("Please fill in both fields");
        return;
    }

    const btn = document.getElementById('btn-add-download');
    btn.innerText = "Adding...";
    
    const success = await addDownloadItem(nameInput.value, linkInput.value);
    
    btn.innerText = "Add to List";

    if(success) {
        nameInput.value = '';
        linkInput.value = '';
        loadDownloads(); 
    }
}

// --- DELETE MOVIE ---
window.removeMovie = async (id) => {
    if(confirm("Are you sure you want to delete this?")) {
        await deleteDownloadItem(id);
        loadDownloads();
    }
};
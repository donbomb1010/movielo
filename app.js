// js/app.js
import { API_KEY, BASE_URL, IMG_URL, IMG_URL_HD, requests } from './config.js';
import { logout } from './firebase.js'; 

// --- NEW: Global Sort Variable ---
let currentSort = 'popularity.desc';

// --- INITIALIZATION ---
window.onload = () => {
    // 1. Check Auth (Existing)
    if(!localStorage.getItem('user')) {
        window.location.href = 'auth.html';
        return;
    }

    // --- NEW CODE: PAGE ROUTING (Pata lagana ki hum kis page par hain) ---
    const path = window.location.pathname;

    if (path.includes('movies.html') || path.includes('series.html')) {
        // === Agar hum Movies ya Series page par hain ===
        
        // 1. Sidebar ke Genres load karo
        populateGenres(); 
        
        // 2. Search bar activate karo
        setupSearch(); 

        // 3. Pata karo ki Movie dikhana hai ya TV Series
        const defaultType = path.includes('series.html') ? 'tv' : 'movie';
        
        // 4. Radio button ko auto-select karo aur Rows Load karo
        setTimeout(() => {
            const radio = document.querySelector(`input[name="media_type"][value="${defaultType}"]`);
            if(radio) {
                radio.checked = true;
                window.applyFilters(); // Main Grid Data fetch karo
            }
            
            // --- NEW ADDITION: Load Regional Rows (Bollywood, South, etc.) ---
            loadRegionalRows(defaultType); 
            
        }, 100); 

    } else {
        // === Agar hum Home Page (index.html) par hain ===
        initApp(); 
        setupSearch();
    }
    
    // Connect Logout (Existing)
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout().then(() => {
                localStorage.removeItem('user');
                window.location.href = 'auth.html';
            });
        });
    }
};

// --- GLOBAL NAVIGATION (Existing - No Changes) ---
window.switchView = (viewName, mediaType = null) => {
    const views = ['view-home', 'view-search', 'view-details'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('hidden'); // Safety check add kiya hai
    });

    if(viewName === 'home') {
        const el = document.getElementById('view-home');
        if(el) el.classList.remove('hidden');
    } else if (viewName === 'search') {
        const el = document.getElementById('view-search');
        if(el) el.classList.remove('hidden');
        
        if (mediaType) {
            const radio = document.querySelector(`input[name="media_type"][value="${mediaType}"]`);
            if (radio) {
                radio.checked = true;
                window.applyFilters(); 
            }
        } else {
            const grid = document.getElementById('search-grid');
            if(grid && grid.innerHTML === '') {
                window.applyFilters();
            }
        }
    }
    window.scrollTo(0,0);
};

// --- CORE FETCH FUNCTION (Existing - No Changes) ---
async function fetchData(endpoint) {
    try {
        const fullPath = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
        const separator = fullPath.includes('?') ? '&' : '?';
        const finalUrl = fullPath.includes('api_key=') 
            ? fullPath 
            : `${fullPath}${separator}api_key=${API_KEY}&language=en-US`;

        const res = await fetch(finalUrl);
        return await res.json();
    } catch (e) {
        console.error("Fetch Error:", e);
        return null;
    }
}

// --- 1. HOME PAGE LOGIC (Existing - No Changes) ---
async function initApp() {
    // Safety Check: Agar Home page ke elements nahi mile, toh run mat karo
    if(!document.getElementById('home-trending')) return;

    const data = await fetchData(requests.fetchTrending);
    if (!data || !data.results) return;

    const heroMovie = data.results[0];
    setupHero(heroMovie);
    renderGrid('home-trending', data.results);
    setupFilmStrip(data.results.slice(1, 15));
}

function setupHero(movie) {
    const bg = document.getElementById('hero-bg'); // Safety check
    if(!bg) return; 

    bg.src = `${IMG_URL_HD}${movie.backdrop_path || movie.poster_path}`;
    document.getElementById('hero-title').innerText = movie.title || movie.name;
    document.getElementById('hero-overview').innerText = movie.overview;
    const type = movie.media_type || 'movie';
    document.getElementById('hero-btn').onclick = () => window.openDetails(movie.id, type);
}

function setupFilmStrip(movies) {
    const strip = document.getElementById('film-strip');
    if(!strip) return;
    strip.innerHTML = '';
    movies.forEach(m => {
        const img = document.createElement('img');
        img.src = `${IMG_URL}${m.poster_path}`;
        img.onclick = () => window.openDetails(m.id, m.media_type || 'movie');
        strip.appendChild(img);
    });
}



// --- 2. DETAILS VIEW (Existing - No Changes) ---
window.openDetails = async (id, type) => {
    // Agar single page view hai toh hide karo, nahi toh overlay dikhao
    const home = document.getElementById('view-home');
    if(home) home.classList.add('hidden');
    
    const search = document.getElementById('view-search');
    if(search) search.classList.add('hidden');
    
    const detailsView = document.getElementById('view-details');
    detailsView.classList.remove('hidden');
    window.scrollTo(0,0);
    
    // Close button add kiya hai taaki naye pages par close kar sakein
    const closeBtn = `<button onclick="document.getElementById('view-details').classList.add('hidden'); if(document.getElementById('view-home')) document.getElementById('view-home').classList.remove('hidden');" style="position:fixed; top:20px; right:20px; z-index:201; background:transparent; border:none; color:white; font-size:2rem; cursor:pointer;">&times;</button>`;
    
    detailsView.innerHTML = closeBtn + '<div style="height:100vh; display:flex; justify-content:center; align-items:center;"><div class="spinner">Loading...</div></div>';

    if (type === 'person') {
        await buildPersonView(id);
    } else {
        await buildMediaView(id, type);
    }
};

// Replace ONLY the buildMediaView function in js/app.js

async function buildMediaView(id, type) {
    // 1. Append 'watch/providers' to get OTT data
    const endpoint = `/${type}/${id}?append_to_response=credits,similar,videos,watch/providers`;
    const data = await fetchData(endpoint);

    if(!data) return;

    const title = data.title || data.name;
    const year = (data.release_date || data.first_air_date || "N/A").substring(0, 4);
    const duration = type === 'movie' 
        ? (data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : 'N/A')
        : `${data.number_of_seasons || 0} Seasons`;

    let director = "Unknown";
    if (data.created_by && data.created_by.length > 0) {
        director = data.created_by.map(c => c.name).join(", ");
    } else if (data.credits && data.credits.crew) {
        const dir = data.credits.crew.find(p => p.job === "Director");
        if(dir) director = dir.name;
    }

    const genres = data.genres ? data.genres.map(g => g.name).slice(0, 3).join(", ") : "";
    const cast = data.credits ? data.credits.cast.slice(0, 10) : [];
    const rating = data.vote_average ? data.vote_average.toFixed(1) : "0.0";

    // --- NEW LOGIC: GET STREAMING PROVIDERS ---
    let providersHtml = '';
    // Check for India (IN) first, then fallback to US
    const watchResults = data['watch/providers'] && data['watch/providers'].results;
    const regionData = watchResults ? (watchResults.IN || watchResults.US) : null;

    if (regionData && regionData.flatrate) {
        // 'flatrate' means streaming subscription (like Netflix, Prime)
        providersHtml = `
            <div class="provider-section">
                <h4 style="color:#ccc; margin-bottom:5px;">Available to Stream on:</h4>
                <div style="display:flex; flex-wrap:wrap;">
                    ${regionData.flatrate.map(p => `
                        <img src="${IMG_URL}${p.logo_path}" class="provider-logo" title="${p.provider_name}">
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        providersHtml = `<div class="provider-section"><p style="color:#666; font-size:0.9rem;">Not available for streaming yet.</p></div>`;
    }
    // -------------------------------------------

    const html = `
        <img class="details-backdrop" src="${data.backdrop_path ? IMG_URL_HD + data.backdrop_path : ''}">
        <div class="details-content">
            <div class="details-poster-wrapper">
                 <img class="details-poster" src="${data.poster_path ? IMG_URL + data.poster_path : 'https://via.placeholder.com/300x450'}">
                 <div class="stat-card">
                    <div class="rating-circle" style="background: conic-gradient(#8a2be2 ${Math.round(data.vote_average * 10)}%, #333 0%)">
                        ${rating}
                    </div>
                    <p style="margin-top:5px; font-size:0.8rem; color:#ccc;">User Score</p>
                 </div>
            </div>
            
            <div class="details-info">
                <h1>${title} <span style="font-size:0.5em; opacity:0.7; font-weight:300;">(${year})</span></h1>
                
                <div class="tags-row">
                    <span class="tag">${type.toUpperCase()}</span>
                    <span class="tag">${genres}</span>
                    <span class="tag">${duration}</span>
                </div>

                ${providersHtml}

                <div class="meta-grid">
                    <div><strong>Creatives:</strong> <br> <span style="color:#ccc">${director}</span></div>
                    <div><strong>Language:</strong> <br> <span style="color:#ccc">${data.original_language ? data.original_language.toUpperCase() : '-'}</span></div>
                    <div><strong>Status:</strong> <br> <span style="color:#ccc">${data.status}</span></div>
                </div>

                <h3 style="margin-top:25px; color:var(--primary); margin-bottom:10px;">Overview</h3>
                <p style="color:#b3b3b3; line-height:1.6; font-size:0.95rem;">${data.overview}</p>

                <h3 style="margin-top:25px; margin-bottom:15px;">Top Cast</h3>
                <div class="cast-list">
                    ${cast.map(c => `
                        <div class="cast-member" onclick="window.openDetails(${c.id}, 'person')">
                            <img src="${c.profile_path ? IMG_URL + c.profile_path : 'https://via.placeholder.com/100x150?text=No+Img'}" loading="lazy">
                            <span style="color:white; font-weight:500;">${c.name}</span>
                            <small>${c.character}</small>
                        </div>
                    `).join('')}
                </div>
                
                <h3 style="margin-top:30px; margin-bottom:15px;">More Like This</h3>
                <div class="film-strip" style="position:static; width:100%; border:none; background:transparent; padding:0;">
                    ${data.similar && data.similar.results ? data.similar.results.slice(0,8).map(m => `
                        <img src="${m.poster_path ? IMG_URL + m.poster_path : ''}" 
                             onclick="window.openDetails(${m.id}, '${type}')" 
                             style="width:90px; height:135px; margin-right:10px;">
                    `).join('') : '<p>No similar titles found.</p>'}
                </div>
            </div>
        </div>
    `;
    
    // Append content, check for existing close button logic
    const existing = document.getElementById('view-details').innerHTML;
    if(!existing.includes('button')) {
         document.getElementById('view-details').innerHTML = `<button onclick="document.getElementById('view-details').classList.add('hidden')" style="position:fixed; top:20px; right:20px; z-index:201; background:transparent; border:none; color:white; font-size:2rem; cursor:pointer;">&times;</button>` + html;
    } else {
        const closeBtn = document.getElementById('view-details').querySelector('button').outerHTML;
        document.getElementById('view-details').innerHTML = closeBtn + html;
    }
}

async function buildPersonView(id) {
    const endpoint = `/person/${id}?append_to_response=movie_credits,tv_credits`;
    const data = await fetchData(endpoint);

    const knownFor = data.movie_credits.cast
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

    const html = `
        <div class="details-content" style="padding-top:100px;">
            <div class="details-poster-wrapper">
                 <img class="details-poster" src="${data.profile_path ? IMG_URL + data.profile_path : 'https://via.placeholder.com/300x450'}">
            </div>
            
            <div class="details-info">
                <h1>${data.name}</h1>
                <div class="tags-row">
                    <span class="tag">${data.known_for_department}</span>
                </div>
                
                <div class="meta-grid" style="margin-top:20px;">
                    <div><strong>Born:</strong> <br> <span style="color:#ccc">${data.birthday || 'N/A'}</span></div>
                    <div><strong>Place:</strong> <br> <span style="color:#ccc">${data.place_of_birth || 'N/A'}</span></div>
                    <div><strong>Gender:</strong> <br> <span style="color:#ccc">${data.gender === 1 ? 'Female' : 'Male'}</span></div>
                </div>

                <h3 style="margin-top:25px; color:var(--primary);">Biography</h3>
                <p style="color:#b3b3b3; line-height:1.6; max-height:300px; overflow-y:auto; margin-top:10px;">
                    ${data.biography || "No biography available."}
                </p>

                <h3 style="margin-top:30px; margin-bottom:15px;">Known For</h3>
                <div class="results-grid">
                    ${knownFor.map(m => `
                        <div class="movie-card" onclick="window.openDetails(${m.id}, 'movie')">
                            <img src="${m.poster_path ? IMG_URL + m.poster_path : 'https://via.placeholder.com/200x300'}" loading="lazy">
                            <h3 style="font-size:0.9rem;">${m.title}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    const existing = document.getElementById('view-details').innerHTML;
    if(!existing.includes('button')) {
         document.getElementById('view-details').innerHTML = `<button onclick="document.getElementById('view-details').classList.add('hidden')" style="position:fixed; top:20px; right:20px; z-index:201; background:transparent; border:none; color:white; font-size:2rem; cursor:pointer;">&times;</button>` + html;
    } else {
        document.getElementById('view-details').innerHTML = document.getElementById('view-details').querySelector('button').outerHTML + html;
    }
}

// --- 3. SEARCH & SIDEBAR LOGIC (Existing + Updates) ---

async function populateGenres() {
    const data = await fetchData('/genre/movie/list');
    if(!data || !data.genres) return;

    const container = document.getElementById('genre-list');
    if(!container) return; // Safety check

    container.innerHTML = data.genres.map(g => `
        <label class="checkbox-item">
            <input type="checkbox" value="${g.id}" onchange="applyFilters()"> 
            <span class="checkmark"></span> ${g.name}
        </label>
    `).join('');
}

// --- FIX: REPLACE ONLY THIS FUNCTION IN js/app.js ---

window.applyFilters = async () => {
    // 1. Type Auto-Detect (URL se pata karega: Movie hai ya Series)
    let type = 'movie'; 
    if(window.location.pathname.includes('series.html')) {
        type = 'tv';
    }

    // 2. Selected Region Pata Karo (Sidebar se)
    const regionRadio = document.querySelector('input[name="region"]:checked');
    const region = regionRadio ? regionRadio.value : 'all';

    // 3. Selected Genres Pata Karo
    const checkedGenres = Array.from(document.querySelectorAll('#genre-list input:checked'))
        .map(input => input.value).join(',');

    // 4. Page ka Title Update Karo
    const titleEl = document.getElementById('search-title');
    if(titleEl) {
        let regionName = "All";
        if(region === 'hi') regionName = "Bollywood";
        else if(region === 'en') regionName = "Hollywood";
        else if(region === 'gu') regionName = "Gujarati";
        else if(region === 'south') regionName = "South Indian";
        
        titleEl.innerText = `${regionName} ${type === 'movie' ? 'Movies' : 'TV Shows'} - Explore All`;
    }

    // 5. Loading Show Karo
    const grid = document.getElementById('search-grid');
    if(grid) grid.innerHTML = '<p style="color:#ccc;">Loading...</p>';

    // 6. API URL Banao
    let endpoint = `/discover/${type}?sort_by=${currentSort}&page=1`;
    
    // Genres Add Karo
    if(checkedGenres) endpoint += `&with_genres=${checkedGenres}`;

    // Region/Language Logic Add Karo
    if (region === 'hi') endpoint += '&with_original_language=hi';
    else if (region === 'en') endpoint += '&with_original_language=en';
    else if (region === 'gu') endpoint += '&with_original_language=gu';
    else if (region === 'south') endpoint += '&with_original_language=ta|te|kn|ml';
    
    endpoint += '&watch_region=IN';

    // 7. Data Fetch aur Render Karo
    const data = await fetchData(endpoint);
    if(data && data.results) {
        renderGrid('search-grid', data.results);
    }
};

window.filterByRegion = (regionCode) => {
    // 1. Find the radio button in Sidebar using the code (hi, en, gu, south)
    const radio = document.querySelector(`input[name="region"][value="${regionCode}"]`);
    
    if(radio) {
        radio.checked = true; // Visually select the radio button
        window.applyFilters(); // Trigger the filter logic
        
        // Scroll down to the grid
        const gridTitle = document.getElementById('search-title');
        if(gridTitle) {
            gridTitle.scrollIntoView({behavior: 'smooth'});
        }
    } else {
        console.error("Radio button not found for:", regionCode);
    }
};

// --- NEW FUNCTION: SORT PILLS LOGIC ---
window.setSort = (element, sortValue) => {
    // 1. Visual Update (Active class change karo)
    document.querySelectorAll('.sort-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    // 2. Logic Update
    currentSort = sortValue;
    window.applyFilters();
};

// C. Search Bar Logic (Existing)
function setupSearch() {
    const input = document.getElementById('search-input');
    if(!input) return;

    let timeout = null;
    input.addEventListener('keyup', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const query = e.target.value.trim();
            if(query.length > 2) {
                
                // --- ADDED: Hide rows when searching ---
                const rows = document.getElementById('regional-rows-section');
                if(rows) rows.classList.add('hidden');
                // ---------------------------------------

                if(window.switchView) window.switchView('search');
                
                const grid = document.getElementById('search-grid');
                if(grid) grid.innerHTML = '<p style="color:white; padding:20px;">Searching...</p>';

                const endpoint = `/search/multi?query=${encodeURIComponent(query)}`;
                const data = await fetchData(endpoint);
                
                if(data && data.results.length > 0) {
                    renderGrid('search-grid', data.results);
                } else {
                    if(grid) grid.innerHTML = '<p style="color:#ccc; padding:20px;">No results found.</p>';
                }
            } else if (query.length === 0) {
                 // --- ADDED: Show rows again when clear ---
                 const rows = document.getElementById('regional-rows-section');
                 if(rows) rows.classList.remove('hidden');
                 window.applyFilters();
                 // -----------------------------------------
            }
        }, 500); 
    });
}

function renderGrid(containerId, items) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    container.innerHTML = items.map(item => {
        if(!item.poster_path && !item.profile_path) return '';
        
        const img = item.poster_path || item.profile_path;
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        const year = (item.release_date || item.first_air_date || '').substring(0,4);
        // Added rating for new design
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';

        return `
            <div class="movie-card" onclick="window.openDetails(${item.id}, '${type}')">
                <div class="poster-container">
                    <img src="${IMG_URL}${img}" loading="lazy">
                    <div class="rating-badge">${rating}</div>
                </div>
                <div class="movie-info">
                    <h3>${title}</h3>
                    <div class="meta">
                        <span>${year}</span>
                        <span>${type === 'movie' ? 'Movie' : 'TV'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
//  --- NEW: LOAD REGIONAL ROWS LOGIC ---
// ==========================================

async function loadRegionalRows(type) {
    // 1. Bollywood (Hindi)
    fetchData(`/discover/${type}?with_original_language=hi&sort_by=popularity.desc&watch_region=IN`).then(data => {
        if(data && data.results) renderRow('row-bollywood', data.results, type);
    });

    // 2. Hollywood (English)
    fetchData(`/discover/${type}?with_original_language=en&sort_by=popularity.desc`).then(data => {
        if(data && data.results) renderRow('row-hollywood', data.results, type);
    });

    // 3. South Indian (Tamil, Telugu, Kannada, Malayalam)
    fetchData(`/discover/${type}?with_original_language=ta|te|kn|ml&sort_by=popularity.desc&watch_region=IN`).then(data => {
        if(data && data.results) renderRow('row-south', data.results, type);
    });

    // 4. Gujarati
    fetchData(`/discover/${type}?with_original_language=gu&sort_by=popularity.desc&watch_region=IN`).then(data => {
        if(data && data.results) renderRow('row-gujarati', data.results, type);
    });
}

// Function to render Horizontal Rows (Film Strip style)
function renderRow(containerId, items, type) {
    const container = document.getElementById(containerId);
    if(!container) return;

    if(items.length === 0) {
        container.innerHTML = '<p style="color:#666; font-size:0.8rem;">No content found.</p>';
        return;
    }

    container.innerHTML = items.map(m => `
        <img src="${m.poster_path ? IMG_URL + m.poster_path : 'https://via.placeholder.com/150x225'}" 
             onclick="window.openDetails(${m.id}, '${type}')" 
             style="width:120px; height:180px; border-radius:8px; cursor:pointer; margin-right:15px; transition:transform 0.3s;"
             onmouseover="this.style.transform='scale(1.1)'"
             onmouseout="this.style.transform='scale(1)'"
             loading="lazy">
    `).join('');
}

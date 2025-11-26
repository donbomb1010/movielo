// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, getDoc, onSnapshot, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD7ZYOhV0oIpgH8ni446_zkTmhEiQwiqVg",
    authDomain: "movie1-be42f.firebaseapp.com",
    projectId: "movie1-be42f",
    storageBucket: "movie1-be42f.firebasestorage.app",
    messagingSenderId: "779722235172",
    appId: "1:779722235172:web:279f92e1c1c29c6063e7b1",
    measurementId: "G-BTECKG6XWF"
};

// --- INITIALIZE FIREBASE (Only Once) ---
const app = initializeApp(firebaseConfig);

// --- EXPORT AUTH & DB (So other files can use them) ---
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Auth Functions ---
export const loginEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const registerEmail = (email, pass) => createUserWithEmailAndPassword(auth, email, pass);
export const loginGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const monitorAuth = (callback) => {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

// --- Firestore Watchlist Functions ---
export const addToWatchlist = async (movie) => {
    const user = auth.currentUser;
    if (!user) return alert("Please sign in to save movies!");
    
    try {
        await setDoc(doc(db, "users", user.uid, "watchlist", movie.id.toString()), {
            id: movie.id,
            title: movie.title || movie.name,
            poster_path: movie.poster_path,
            overview: movie.overview,
            vote_average: movie.vote_average
        });
        alert("Added to Watchlist!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

export const removeFromWatchlist = async (movieId) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "watchlist", movieId.toString()));
    alert("Removed from Watchlist");
};

export const checkWatchlistStatus = async (movieId) => {
    const user = auth.currentUser;
    if (!user) return false;
    const docSnap = await getDoc(doc(db, "users", user.uid, "watchlist", movieId.toString()));
    return docSnap.exists();
};

// --- Auth Page Logic ---
if (window.location.pathname.includes('auth.html')) {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const googleBtn = document.getElementById('google-btn');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    if(loginBtn) {
        loginBtn.addEventListener('click', async () => {
            try { await loginEmail(emailInput.value, passInput.value); window.location.href = 'index.html'; }
            catch(e) { alert(e.message); }
        });
    }
    if(registerBtn) {
        registerBtn.addEventListener('click', async () => {
            try { await registerEmail(emailInput.value, passInput.value); window.location.href = 'index.html'; }
            catch(e) { alert(e.message); }
        });
    }
    if(googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try { await loginGoogle(); window.location.href = 'index.html'; }
            catch(e) { alert(e.message); }
        });
    }
}

// --- DOWNLOADS PAGE LOGIC ---
// 1. Add a Download Link (Admin Only)
export const addDownloadItem = async (name, link) => {
    try {
        await addDoc(collection(db, "downloads"), {
            name: name,
            link: link,
            timestamp: Date.now()
        });
        alert("Movie Added Successfully!");
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Error adding movie: " + e.message);
        return false;
    }
};

// 2. Get All Download Links
export const getDownloadItems = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "downloads"));
        let items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Error fetching downloads:", e);
        return [];
    }
};

// 3. Delete Item
export const deleteDownloadItem = async (id) => {
    try {
        await deleteDoc(doc(db, "downloads", id));
        return true;
    } catch(e) {
        console.error("Error deleting:", e);
        return false;
    }
};
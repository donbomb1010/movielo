// js/auth-logic.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD7ZYOhV0oIpgH8ni446_zkTmhEiQwiqVg",
    authDomain: "movie1-be42f.firebaseapp.com",
    projectId: "movie1-be42f",
    storageBucket: "movie1-be42f.firebasestorage.app",
    messagingSenderId: "779722235172",
    appId: "1:779722235172:web:279f92e1c1c29c6063e7b1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register
document.getElementById('btn-signup').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        alert("Account Created! Please log in.");
        toggleAuth(); // Switch to login view
    } catch(e) { alert(e.message); }
});

// Login
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // Save dummy token
        localStorage.setItem('user', 'true');
        window.location.href = 'index.html';
    } catch(e) { alert(e.message); }
});
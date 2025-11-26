// js/mood.js
import { API_KEY, BASE_URL } from './config.js';

const genreMap = {
    happy: "35,16",       // Comedy, Animation
    sad: "18",            // Drama
    romantic: "10749",    // Romance
    action: "28,12",      // Action, Adventure
    horror: "27,9648"     // Horror, Mystery
};

export async function getMoodMovies(mood) {
    if (!mood || !genreMap[mood]) return [];
    
    // Logic: Fetch popular movies within these genres
    const genreIds = genreMap[mood];
    const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc&page=1`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error("Mood Fetch Error", error);
        return [];
    }
}
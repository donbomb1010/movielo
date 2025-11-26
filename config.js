// // js/config.js
// export const API_KEY = "ecd4aa822842c8ea24a4fe1656082a2f";
// export const BASE_URL = "https://api.themoviedb.org/3";
// export const IMG_URL = "https://image.tmdb.org/t/p/w500";
// export const IMG_URL_HD = "https://image.tmdb.org/t/p/original";

// export const requests = {
//     fetchTrending: `/trending/movie/week?api_key=${API_KEY}&language=en-US`,
//     fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
//     fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
//     fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
//     fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
//     fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
//     fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
//     fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,

// };

// js/config.js
export const API_KEY = "ecd4aa822842c8ea24a4fe1656082a2f";

// 👇 THIS IS THE IMPORTANT CHANGE 👇
// We change the URL to point to our Vercel Rewrite (Proxy)
export const BASE_URL = "/api/tmdb"; 

// Images can still be fetched directly, no change needed here
export const IMG_URL = "https://image.tmdb.org/t/p/w500";
export const IMG_URL_HD = "https://image.tmdb.org/t/p/original";

export const requests = {
    fetchTrending: `/trending/movie/week?api_key=${API_KEY}&language=en-US`,
    fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
    fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
    fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
    fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
    fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
    fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,
};

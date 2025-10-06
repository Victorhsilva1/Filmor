const OMDb_API_KEY = 'd3f1a2b4'; 
const OMDb_API_URL = `https://www.omdbapi.com/?apikey=${OMDb_API_KEY}&`;

const screens = {
    home: document.getElementById('desktop-home'),
    search: document.getElementById('desktop-search'),
    details: document.getElementById('desktop-details'),
};
const searchInputHome = document.getElementById('search-input-home');
const tvShowsList = document.getElementById('tv-shows-list');
const searchInputTop = document.getElementById('search-input-top');
const searchTermDisplay = document.getElementById('search-term-display');
const movieResultsGrid = document.getElementById('movie-results-grid');
const detailsElements = {
    poster: document.getElementById('details-poster'),
    title: document.getElementById('details-title'),
    rating: document.getElementById('details-rating-value'),
    plot: document.getElementById('details-plot'),
    genres: document.getElementById('details-genres'),
    trailerContainer: document.getElementById('details-trailer-container'),
};
const backButtons = {
    search: document.getElementById('back-button-search'),
    details: document.getElementById('back-button-details'),
};

let previousDesktop = 'home'; 

function switchDesktop(target) {
    const currentActive = document.querySelector('.active-desktop');
    if (currentActive) {
        previousDesktop = currentActive.id.replace('desktop-', '');
        currentActive.classList.remove('active-desktop');
    }
    screens[target]?.classList.add('active-desktop');
}

async function fetchData(params, type = 'search') {
    let url = OMDb_API_URL;
    if (type === 'search') {
        url += `s=${encodeURIComponent(params.query)}`;
        if (params.mediaType) url += `&type=${params.mediaType}`;
    } else { 
        url += `i=${encodeURIComponent(params.imdbID)}&plot=full`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Response === 'True' ? (type === 'search' ? data.Search : data) : null;
    } catch (error) {
        console.error('Fetch Error:', error);
        return null;
    }
}

function createMovieCard(item) {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    const posterUrl = item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A'; 
    card.innerHTML = `<img src="${posterUrl}" alt="${item.Title} Poster">`;
    card.addEventListener('click', () => loadMovieDetails(item.imdbID, item.Title));
    return card;
}

async function loadPopularShows() {
    const results = await fetchData({ query: 'marvel' }, 'search'); 
    tvShowsList.innerHTML = '';
    if (results) {
        const finalGridList = Array(16).fill(results).flat().slice(0, 16); 
        finalGridList.forEach(item => { 
            tvShowsList.appendChild(createMovieCard(item));
        });
    }
}

async function performSearch(term) {
    if (!term) return;

    switchDesktop('search');
    searchInputTop.value = term;
    searchTermDisplay.textContent = term;
    movieResultsGrid.innerHTML = '<div>Carregando resultados...</div>';

    const results = await fetchData({ query: term }, 'search');

    movieResultsGrid.innerHTML = '';
    if (results && results.length > 0) {
        results.slice(0, 12).forEach(item => movieResultsGrid.appendChild(createMovieCard(item)));
    } else {
        movieResultsGrid.innerHTML = `<div>Nenhum resultado encontrado para '${term}'.</div>`;
    }
}

async function loadMovieDetails(imdbID, title) {
    switchDesktop('details');
    
    detailsElements.title.textContent = 'Carregando...';
    detailsElements.plot.textContent = 'Buscando detalhes...';
    
    // Trailer será definido como indisponível
    detailsElements.trailerContainer.innerHTML = '<div>Trailer indisponível sem a API do YouTube.</div>'; 

    const details = await fetchData({ imdbID }, 'details');

    if (details) {
        detailsElements.title.textContent = details.Title;
        detailsElements.plot.textContent = details.Plot;
        detailsElements.rating.textContent = details.imdbRating;
        
        const posterUrl = details.Poster !== 'N/A' ? details.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A';
        detailsElements.poster.innerHTML = `<img src="${posterUrl}" alt="${details.Title} Poster">`;
        
        detailsElements.genres.innerHTML = '';
        if (details.Genre !== 'N/A') {
            details.Genre.split(', ').forEach(genre => {
                const tag = document.createElement('span');
                tag.classList.add('genre-tag');
                tag.textContent = genre;
                detailsElements.genres.appendChild(tag);
            });
        }
    } else {
        detailsElements.title.textContent = 'Filme Não Encontrado';
        detailsElements.plot.textContent = 'Não foi possível carregar os detalhes.';
    }
}

function setupSearchListener(inputElement, buttonElement) {
    const handler = () => performSearch(inputElement.value.trim() || 'Batman');
    buttonElement.addEventListener('click', handler);
    inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handler();
    });
}

setupSearchListener(searchInputHome, document.getElementById('search-button-home'));
setupSearchListener(searchInputTop, document.getElementById('search-button-top'));

backButtons.search.addEventListener('click', () => switchDesktop('home'));
backButtons.details.addEventListener('click', () => switchDesktop(previousDesktop));

document.addEventListener('DOMContentLoaded', () => {
    loadPopularShows();
    switchDesktop('home');
});
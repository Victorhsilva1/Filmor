const CHAVE_API_OMDB = '460719d3'; 
const URL_API_OMDB = `https://www.omdbapi.com/?apikey=${CHAVE_API_OMDB}&`;

// Elementos DOM das Telas
const telas = {
    home: document.getElementById('desktop-home'),
    search: document.getElementById('desktop-search'),
    details: document.getElementById('desktop-details'),
};
const BuscaHome = document.getElementById('search-input-home');
const listaPopulares = document.getElementById('tv-shows-list');
const BuscaTopo = document.getElementById('search-input-top');
const termoBuscaExibido = document.getElementById('search-term-display');
const gradeResultados = document.getElementById('movie-results-grid');
const detalhes = {
    poster: document.getElementById('details-poster'),
    titulo: document.getElementById('details-title'),
    nota: document.getElementById('details-rating-value'),
    enredo: document.getElementById('details-plot'),
    generos: document.getElementById('details-genres'),
    containerTrailer: document.getElementById('details-trailer-container'),
};
const botoesVoltar = {
    search: document.getElementById('back-button-search'),
    details: document.getElementById('back-button-details'),
};

let telaAnterior = 'home'; 

// --- 1. FUNÇÕES DE NAVEGAÇÃO E REQUISIÇÃO ---

function trocarTela(novaTela) {
    const ativa = document.querySelector('.active-desktop');
    
    // Esconde a tela atual
    if (ativa) {
        // Salva a tela atual para o botão Voltar
        telaAnterior = ativa.id.replace('desktop-', '');
        ativa.classList.remove('active-desktop');
    }
    
    // Mostra a nova tela
    telas[novaTela]?.classList.add('active-desktop');
}

async function buscarDados(params, tipo = 'search') {
    let url = URL_API_OMDB;
    if (tipo === 'search') {
        url += `s=${encodeURIComponent(params.query)}`;
        if (params.mediaType) url += `&type=${params.mediaType}`;
    } else { 
        url += `i=${encodeURIComponent(params.imdbID)}&plot=full`;
    }

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        return dados.Response === 'True' ? (tipo === 'search' ? dados.Search : dados) : null;
    } catch (error) {
        console.error('Erro na Busca:', error);
        return null;
    }
}

// --- 2. FUNÇÕES DE RENDERIZAÇÃO ---

function criarCardFilme(item) {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    const urlPoster = item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A'; 
    card.innerHTML = `<img src="${urlPoster}" alt="${item.Title} Poster">`;
    // Passa o ID para carregar os detalhes
    card.addEventListener('click', () => carregarDetalhesFilme(item.imdbID, item.Title));
    return card;
}

async function carregarPopulares() {
    const resultados = await buscarDados({ query: 'joker' }, 'search'); 
    listaPopulares.innerHTML = '';
    
    if (!resultados) return;
    
    // Garante 16 resultados repetindo a lista (lógica simplificada)
    const listaFinal = [];
    let indiceResultado = 0;
    
    while (listaFinal.length < 16) {
        const item = resultados[indiceResultado];
        listaFinal.push(item);
        // Volta ao início da lista quando chega ao fim
        indiceResultado = (indiceResultado + 1) % resultados.length;
    }

    listaFinal.forEach(item => { 
        listaPopulares.appendChild(criarCardFilme(item));
    });
}

async function executarBusca(termo) {
    if (!termo) return;

    trocarTela('search');
    BuscaTopo.value = termo;
    termoBuscaExibido.textContent = termo;
    gradeResultados.innerHTML = '<div>Carregando resultados...</div>';

    const resultados = await buscarDados({ query: termo }, 'search');

    gradeResultados.innerHTML = '';
    if (resultados && resultados.length > 0) {
        resultados.slice(0, 12).forEach(item => gradeResultados.appendChild(criarCardFilme(item)));
    } else {
        gradeResultados.innerHTML = `<div>Nenhum resultado encontrado para '${termo}'.</div>`;
    }
}

async function carregarDetalhesFilme(imdbID) {
    trocarTela('details');
    
    // Estado de Carregamento
    detalhes.titulo.textContent = 'Carregando...';
    detalhes.enredo.textContent = 'Buscando detalhes...';
    detalhes.containerTrailer.innerHTML = '<div>Trailer indisponível.</div>'; 

    const detalhes = await buscarDados({ imdbID }, 'details');

    if (detalhes) {
        detalhes.titulo.textContent = detalhes.Title;
        detalhes.enredo.textContent = detalhes.Plot;
        detalhes.nota.textContent = detalhes.imdbRating;
        
        const urlPoster = detalhes.Poster !== 'N/A' ? detalhes.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A';
        detalhes.poster.innerHTML = `<img src="${urlPoster}" alt="${detalhes.Title} Poster">`;
        
        detalhes.generos.innerHTML = '';
        if (detalhes.Genre !== 'N/A') {
            detalhes.Genre.split(', ').forEach(genero => {
                const tag = document.createElement('span');
                tag.classList.add('genre-tag');
                tag.textContent = genero;
                detalhes.generos.appendChild(tag);
            });
        }
    } else {
        detalhes.titulo.textContent = 'Filme Não Encontrado';
    }
}

// --- 3. INICIALIZAÇÃO E LISTENERS ---

function configurarListenerBusca(elementoInput, idBotao) {
    const botao = document.getElementById(idBotao);
    const manipulador = () => executarBusca(elementoInput.value.trim() || 'Batman');
    botao.addEventListener('click', manipulador);
    elementoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') manipulador();
    });
}

// Quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    carregarPopulares();
    trocarTela('home');
    
    // Configura listeners de busca
    configurarListenerBusca(BuscaHome, 'search-button-home');
    configurarListenerBusca(BuscaTopo, 'search-button-top');

    // Configura botões de voltar
    botoesVoltar.search.addEventListener('click', () => trocarTela('home'));
    botoesVoltar.details.addEventListener('click', () => trocarTela(telaAnterior));
});
const CHAVE_API_OMDB = '460719d3'; 
const URL_API_OMDB = `https://www.omdbapi.com/?apikey=${CHAVE_API_OMDB}&`;

// Função utilitária para obter elementos por ID
const pegarId = (id) => document.getElementById(id);

// Elementos DOM
const telas = {
    home: pegarId('desktop-home'),
    search: pegarId('desktop-search'),
    details: pegarId('desktop-details'),
};
const inputBuscaHome = pegarId('search-input-home');
const inputBuscaTopo = pegarId('search-input-top');
const listaPopulares = pegarId('tv-shows-list');
const gradeResultados = pegarId('movie-results-grid');
const termoBuscaExibido = pegarId('search-term-display');

const elementosDetalhe = {
    poster: pegarId('details-poster'),
    titulo: pegarId('details-title'),
    nota: pegarId('details-rating-value'),
    enredo: pegarId('details-plot'),
    generos: pegarId('details-genres'),
    containerTrailer: pegarId('details-trailer-container'),
};

const botoesVoltar = {
    busca: pegarId('back-button-search'),
    detalhes: pegarId('back-button-details'),
};

let telaAnterior = 'home'; 

// --- 1. NAVEGAÇÃO E API ---

function trocarTela(novaTela) {
    const ativa = document.querySelector('.active-desktop');
    
    // Esconde a tela atual, salvando-a para o botão Voltar
    if (ativa) {
        telaAnterior = ativa.id.replace('desktop-', '');
        ativa.classList.remove('active-desktop');
    }
    
    // Mostra a nova tela
    telas[novaTela]?.classList.add('active-desktop');
}

async function buscarDados(params, tipo = 'search') {
    let url = URL_API_OMDB;
    
    // Constrói a URL para busca (s) ou detalhes (i)
    if (tipo === 'search') {
        url += `s=${encodeURIComponent(params.query)}`;
    } else { 
        url += `i=${encodeURIComponent(params.imdbID)}&plot=full`;
    }

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        const sucesso = dados.Response === 'True';
        
        return sucesso ? (tipo === 'search' ? dados.Search : dados) : null;
    } catch (error) {
        return null;
    }
}

// --- 2. RENDERIZAÇÃO ---

function criarCardFilme(item) {
    const card = document.createElement('div');
    card.classList.add('movie-card');
    
    const urlPoster = item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A'; 
    card.innerHTML = `<img src="${urlPoster}" alt="${item.Title} Poster">`;
    
    card.addEventListener('click', () => carregarDetalhesFilme(item.imdbID));
    return card;
}

async function carregarPopulares() {
    const resultados = await buscarDados({ query: 'joker' }, 'search'); 
    listaPopulares.innerHTML = '';
    
    if (!resultados) return;

    // Garante 16 itens, repetindo a lista se o resultado da API for menor
    const listaFinal = Array(15).fill(null).map((_, i) => resultados[i % resultados.length]);

    listaFinal.forEach(item => listaPopulares.appendChild(criarCardFilme(item)));
}

async function executarBusca(termo) {
    if (!termo) return;

    trocarTela('search');
    inputBuscaTopo.value = termo;
    termoBuscaExibido.textContent = termo;
    gradeResultados.innerHTML = '<div>Carregando resultados...</div>';

    const resultados = await buscarDados({ query: termo }, 'search');

    gradeResultados.innerHTML = '';
    if (resultados && resultados.length > 0) {
        // Limita a 12 resultados para o layout
        resultados.slice(0, 12).forEach(item => gradeResultados.appendChild(criarCardFilme(item)));
    } else {
        gradeResultados.innerHTML = `<div>Nenhum resultado encontrado para '${termo}'.</div>`;
    }
}

async function carregarDetalhesFilme(imdbID) {
    trocarTela('details');
    
    // Estado de Carregamento inicial
    elementosDetalhe.titulo.textContent = 'Carregando...';
    elementosDetalhe.enredo.textContent = 'Buscando detalhes...';
    elementosDetalhe.containerTrailer.innerHTML = '<div>Trailer indisponível.</div>'; 

    const dadosFilme = await buscarDados({ imdbID }, 'details');

    if (dadosFilme) {
        elementosDetalhe.titulo.textContent = dadosFilme.Title;
        elementosDetalhe.enredo.textContent = dadosFilme.Plot;
        elementosDetalhe.nota.textContent = dadosFilme.imdbRating;
        
        // Poster
        const urlPoster = dadosFilme.Poster !== 'N/A' ? dadosFilme.Poster : 'https://via.placeholder.com/150x230?text=Poster+N/A';
        elementosDetalhe.poster.innerHTML = `<img src="${urlPoster}" alt="${dadosFilme.Title} Poster">`;
        
        // Gêneros (Tags)
        elementosDetalhe.generos.innerHTML = '';
        if (dadosFilme.Genre && dadosFilme.Genre !== 'N/A') {
            dadosFilme.Genre.split(', ').forEach(genero => {
                const tag = document.createElement('span');
                tag.classList.add('genre-tag');
                tag.textContent = genero.trim();
                elementosDetalhe.generos.appendChild(tag);
            });
        }
    } else {
        elementosDetalhe.titulo.textContent = 'Filme Não Encontrado';
        elementosDetalhe.enredo.textContent = 'Não foi possível carregar os detalhes.';
    }
}

// --- 3. INICIALIZAÇÃO E EVENTOS ---

function configurarBusca(elementoInput, idBotao) {
    const botao = pegarId(idBotao);
    const manipulador = () => executarBusca(elementoInput.value.trim() || 'Batman'); 
    
    botao.addEventListener('click', manipulador);
    elementoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') manipulador();
    });     
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPopulares();
    trocarTela('home');
    
    // Configura listeners de busca
    configurarBusca(inputBuscaHome, 'search-button-home');
    configurarBusca(inputBuscaTopo, 'search-button-top');

    // Configura botões de voltar
    botoesVoltar.busca.addEventListener('click', () => trocarTela('home'));
    botoesVoltar.detalhes.addEventListener('click', () => trocarTela(telaAnterior));
});
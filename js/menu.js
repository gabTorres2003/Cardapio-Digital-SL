const menuContainer = document.getElementById('menu-container');
const categoriasContainer = document.getElementById('categorias-container');
let todosOsProdutos = [];

const renderizarProdutos = (produtos) => {
    menuContainer.innerHTML = '';
    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'card';
        const placeholderImg = 'assets/images/placeholder.jpg';
        
        card.innerHTML = `
            <div class="card__image-container">
                <img src="${produto.imagem || placeholderImg}" alt="${produto.nome}" class="card__image">
            </div>
            <div class="card__content">
                <h3 class="card__title">${produto.nome}</h3>
                <p class="card__description">${produto.descricao}</p>
                <div class="card__footer">
                    <p class="card__price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                    <button class="btn btn-primary btn-adicionar" data-id="${produto.id}">Adicionar</button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
};

const renderizarCategorias = () => {
    const categorias = ['Todos', ...new Set(todosOsProdutos.map(p => p.categoria))];
    categoriasContainer.innerHTML = '';
    categorias.forEach(categoria => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-categoria';
        btn.textContent = categoria;
        if (categoria === 'Todos') {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-categoria').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtrarPorCategoria(categoria);
        });
        categoriasContainer.appendChild(btn);
    });
};

const filtrarPorCategoria = (categoria) => {
    if (categoria === 'Todos') {
        renderizarProdutos(todosOsProdutos);
    } else {
        const produtosFiltrados = todosOsProdutos.filter(p => p.categoria === categoria);
        renderizarProdutos(produtosFiltrados);
    }
};

export async function carregarMenu() {
    try {
        const response = await fetch('produtos.json');
        todosOsProdutos = await response.json();
        renderizarProdutos(todosOsProdutos);
        renderizarCategorias();
    } catch (error) {
        console.error("Erro ao carregar o menu:", error);
        menuContainer.innerHTML = '<p>Não foi possível carregar o cardápio. Tente novamente mais tarde.</p>';
    }
}

export function getProdutoPorId(id) {
    return todosOsProdutos.find(p => p.id === id);
}
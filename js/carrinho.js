import { db } from './firebase-init.js';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getProdutoPorId } from './menu.js';

let carrinho = [];

const carrinhoBotao = document.getElementById('carrinho-botao');
const carrinhoModal = document.getElementById('carrinho-modal');
const fecharModal = document.getElementById('fechar-modal');
const carrinhoItensContainer = document.getElementById('carrinho-itens');
const carrinhoContador = document.getElementById('carrinho-contador');
const carrinhoTotalEl = document.getElementById('carrinho-total');
const enviarPedidoBtn = document.getElementById('enviar-pedido');


export function adicionarAoCarrinho(produtoId) {
    const produto = getProdutoPorId(produtoId);
    if (!produto) {
        console.error("ERRO: Tentativa de adicionar um produto que não foi encontrado. ID:", produtoId);
        return;
    }

    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ ...produto, quantidade: 1 });
    }
    
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    carrinhoItensContainer.innerHTML = '';
    if (carrinho.length === 0) {
        carrinhoItensContainer.innerHTML = '<p class="carrinho-vazio">Sua bandeja está vazia.</p>';
        enviarPedidoBtn.disabled = true;
    } else {
        enviarPedidoBtn.disabled = false;
        carrinho.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'carrinho-item';
            itemEl.innerHTML = `
                <div class="carrinho-item__info">
                    <h4>${item.nome}</h4>
                    <p>R$ ${item.preco.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="carrinho-item__actions">
                    <button class="remover" data-id="${item.id}">-</button>
                    <span>${item.quantidade}</span>
                    <button class="adicionar" data-id="${item.id}">+</button>
                </div>
            `;
            carrinhoItensContainer.appendChild(itemEl);
        });
    }

    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    carrinhoContador.textContent = totalItens;

    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    carrinhoTotalEl.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
}

function handleCarrinhoActions(e) {
    const target = e.target;
    const produtoId = parseInt(target.dataset.id);

    if (target.classList.contains('adicionar')) {
        const item = carrinho.find(i => i.id === produtoId);
        if (item) item.quantidade++;
    }

    if (target.classList.contains('remover')) {
        const itemIndex = carrinho.findIndex(i => i.id === produtoId);
        if (itemIndex > -1) {
            carrinho[itemIndex].quantidade--;
            if (carrinho[itemIndex].quantidade === 0) {
                carrinho.splice(itemIndex, 1);
            }
        }
    }
    atualizarInterfaceCarrinho();
}

async function enviarPedido() {
    if (carrinho.length === 0) return;

    enviarPedidoBtn.disabled = true;
    enviarPedidoBtn.textContent = 'Enviando...';

    const urlParams = new URLSearchParams(window.location.search);
    const numeroMesa = urlParams.get('mesa') || 'Balcão';

    const pedido = {
        mesa: numeroMesa,
        itens: carrinho.map(item => ({
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.preco
        })),
        total: carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0),
        status: 'recebido',
        timestamp: serverTimestamp()
    };

    try {
        // 1. Cria o documento do pedido
        const docRef = await addDoc(collection(db, "pedidos"), pedido);
        
        // 2. Salva o ID do pedido no navegador para monitorar
        localStorage.setItem('idPedidoAtivo', docRef.id);
        
        // 3. Ocupa a mesa no banco de dados
        if (numeroMesa !== 'Balcão') {
            const mesaRef = doc(db, "mesas", numeroMesa);
            await updateDoc(mesaRef, { status: "ocupada" });
        }

        // 4. Dispara um evento para notificar o app.js
        document.dispatchEvent(new CustomEvent('pedidoEnviado'));

        alert(`Pedido para a Mesa ${numeroMesa} enviado com sucesso!`);
        carrinho = [];
        atualizarInterfaceCarrinho();
        carrinhoModal.classList.remove('active');
    } catch (error) {
        console.error("Erro ao enviar pedido: ", error);
        alert('Houve um erro ao enviar seu pedido. Por favor, tente novamente.');
    } finally {
        enviarPedidoBtn.disabled = false;
        enviarPedidoBtn.textContent = 'Enviar Pedido';
    }
}

carrinhoBotao.addEventListener('click', () => carrinhoModal.classList.add('active'));
fecharModal.addEventListener('click', () => carrinhoModal.classList.remove('active'));
carrinhoItensContainer.addEventListener('click', handleCarrinhoActions);
enviarPedidoBtn.addEventListener('click', enviarPedido);

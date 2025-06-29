import { db } from './firebase-init.js';
import { collection, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Mapeia as três colunas do HTML
const colunas = {
    recebido: document.getElementById('coluna-recebidos'),
    em_preparo: document.getElementById('coluna-em-preparo'),
    pronto: document.getElementById('coluna-prontos')
};
const alertasContainer = document.querySelector('.alertas-container');

function criarItemPedidoHTML(item) {
    return `<li><span class="item-qtd">${item.quantidade}x</span> ${item.nome}</li>`;
}

function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = `pedido-card status-${pedido.status.replace('_', '-')}`; 
    card.dataset.id = pedido.id;

    const dataPedido = pedido.timestamp?.toDate().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }) || 'agora';

    let botoesAcao = '';
    if (pedido.status === 'recebido') {
        botoesAcao = `<button class="btn btn-secondary btn-acao" data-acao="preparar">Mover para Preparo</button>`;
    } else if (pedido.status === 'em_preparo') {
        botoesAcao = `<button class="btn btn-secondary btn-acao" data-acao="pronto">Marcar como Pronto</button>`;
    } else if (pedido.status === 'pronto') {
        botoesAcao = `<button class="btn btn-success btn-acao" data-acao="finalizar">Finalizar Pedido</button>`;
    }

    card.innerHTML = `
        <div class="pedido-card__header">
            <span class="pedido-card__mesa">Mesa ${pedido.mesa}</span>
            <span class="pedido-card__hora">${dataPedido}</span>
        </div>
        <div class="pedido-card__body">
            <ul class="pedido-card__itens">
                ${pedido.itens.map(criarItemPedidoHTML).join('')}
            </ul>
        </div>
        <div class="pedido-card__footer">
            <p class="pedido-card__total">Total: R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
            <div class="pedido-card__actions">
                ${botoesAcao}
            </div>
        </div>
    `;

    return card;
}

function renderizarPedidos(pedidos) {
    // 1. Limpa todas as colunas antes de renderizar
    Object.values(colunas).forEach(coluna => {
        if (coluna) coluna.innerHTML = '';
    });

    // 2. Distribui cada pedido para a sua respectiva coluna
    pedidos.forEach(pedido => {
        if (pedido.status === 'finalizado' || pedido.status === 'cancelado') return;

        const colunaDestino = colunas[pedido.status];
        if (colunaDestino) {
            const cardPedido = criarCardPedido(pedido);
            colunaDestino.appendChild(cardPedido);
        }
    });
}

function renderizarAlerta(notificacao, id) {
    if (!alertasContainer) return;
    const tipoMsg = notificacao.tipo === 'chamar_garcom' ? 'está chamando o garçom!' : 'pediu para fechar a conta!';
    const icone = notificacao.tipo === 'chamar_garcom' ? '🛎️' : '💵';
    const alertaEl = document.createElement('div');
    alertaEl.className = 'alerta-card';
    alertaEl.innerHTML = `
        <span class="alerta-card__icone">${icone}</span>
        <div class="alerta-card__info">
            <p><strong>Mesa ${notificacao.mesa}</strong> ${tipoMsg}</p>
        </div>
        <button class="btn btn-primary btn-atendido btn-acao-alerta" data-id="${id}">OK</button>
    `;
    alertasContainer.appendChild(alertaEl);
}

function monitorarPedidos() {
    onSnapshot(collection(db, "pedidos"), (snapshot) => {
        const todosPedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        todosPedidos.sort((a, b) => a.timestamp - b.timestamp); // Mais antigo primeiro
        renderizarPedidos(todosPedidos);
    });
}

function monitorarNotificacoes() {
    onSnapshot(collection(db, "notificacoes"), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && !change.doc.data().atendido) {
                renderizarAlerta(change.doc.data(), change.doc.id);
            }
        });
    });
}

async function atualizarStatusPedido(pedidoId, novoStatus) {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    try {
        await updateDoc(pedidoRef, { status: novoStatus });
        if (novoStatus === 'finalizado') {
            const pedidoDoc = await getDoc(pedidoRef);
            const numeroMesa = pedidoDoc.data()?.mesa;
            if (numeroMesa && numeroMesa !== 'Balcão') {
                await updateDoc(doc(db, "mesas", numeroMesa), { status: "livre" });
            }
        }
    } catch (error) {
        console.error("Erro ao atualizar status do pedido:", error);
    }
}

async function resolverNotificacao(notificacaoId) {
    const notificacaoRef = doc(db, "notificacoes", notificacaoId);
    try {
        await updateDoc(notificacaoRef, { atendido: true });
        const alertaParaRemover = document.querySelector(`.btn-acao-alerta[data-id="${notificacaoId}"]`).closest('.alerta-card');
        if (alertaParaRemover) alertaParaRemover.remove();
    } catch (error) {
        console.error("Erro ao resolver notificação:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    monitorarPedidos();
    monitorarNotificacoes();

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-acao')) {
            const pedidoId = target.closest('.pedido-card').dataset.id;
            const acao = target.dataset.acao;
            let novoStatus = '';
            if (acao === 'preparar') novoStatus = 'em_preparo';
            if (acao === 'pronto') novoStatus = 'pronto';
            if (acao === 'finalizar') novoStatus = 'finalizado';
            if (novoStatus) atualizarStatusPedido(pedidoId, novoStatus);
        }
        if (target.classList.contains('btn-acao-alerta')) {
            resolverNotificacao(target.dataset.id);
        }
    });
});
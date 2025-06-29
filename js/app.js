import { carregarMenu } from './menu.js';
import { adicionarAoCarrinho } from './carrinho.js';
import { db } from './firebase-init.js';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- SEÇÃO: LÓGICA DE CONTROLE DA MESA E STATUS ---
const statusContainer = document.getElementById('status-pedido-container');
const statusEl = document.getElementById('status-do-pedido');

/**
 * Formata o texto do status do pedido para ser mais amigável.
 * @param {string} status - O status vindo do Firebase ('recebido', 'em_preparo', etc.).
 * @returns {string} O texto formatado.
 */
function formatarStatus(status) {
    switch (status) {
        case 'recebido': return '✅ Pedido Recebido na Cozinha!';
        case 'em_preparo': return '🍳 Em Preparo...';
        case 'pronto': return '🎉 Pronto para Entrega!';
        default: return status;
    }
}

/**
 * Inicia o monitoramento em tempo real do status de um pedido ativo.
 */
function iniciarMonitoramentoDeStatus() {
    const idPedido = localStorage.getItem('idPedidoAtivo');
    if (!idPedido) return; // Se não há pedido salvo, não faz nada.

    statusContainer.classList.remove('escondido');
    const pedidoRef = doc(db, "pedidos", idPedido);

    onSnapshot(pedidoRef, (doc) => {
        if (doc.exists()) {
            const status = doc.data().status;
            statusEl.textContent = formatarStatus(status);
            // Se o pedido foi finalizado pelo caixa, limpa os dados locais
            if (status === 'finalizado' || status === 'cancelado') {
                localStorage.removeItem('idPedidoAtivo');
                statusContainer.classList.add('escondido');
            }
        } else {
            // Se o documento do pedido foi deletado no banco de dados
            localStorage.removeItem('idPedidoAtivo');
            statusContainer.classList.add('escondido');
        }
    });
}

/**
 * Verifica o status da mesa no Firebase ao carregar a página.
 * Se a mesa estiver 'ocupada', bloqueia a interface.
 */
async function verificarStatusMesa() {
    const urlParams = new URLSearchParams(window.location.search);
    const numeroMesa = urlParams.get('mesa');
    if (!numeroMesa) return; // Não bloqueia se for acesso sem QR Code de mesa

    const mesaRef = doc(db, "mesas", numeroMesa);
    const mesaDoc = await getDoc(mesaRef);

    if (mesaDoc.exists() && mesaDoc.data().status === 'ocupada') {
        document.body.innerHTML = `
            <div class="mesa-ocupada-aviso">
                <h1>Mesa ${numeroMesa}</h1>
                <p>Esta mesa já está com um atendimento em andamento ou aguardando pagamento.</p>
                <p>Por favor, chame um de nossos atendentes se precisar de ajuda.</p>
            </div>
        `;
    }
}


// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    // verifica se a mesa pode ser usada
    verificarStatusMesa();
    // Carrega os itens do cardápio
    carregarMenu();
    // Listener para adicionar itens ao carrinho
    const menuContainer = document.getElementById('menu-container');
    menuContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-adicionar')) {
            const produtoId = parseInt(event.target.dataset.id);
            adicionarAoCarrinho(produtoId);
        }
    });
    // Inicia o monitoramento de status se a página for recarregada e já houver um pedido
    iniciarMonitoramentoDeStatus();
    // Adiciona um listener para o evento que o carrinho.js dispara após um novo pedido
    document.addEventListener('pedidoEnviado', iniciarMonitoramentoDeStatus);
    // Lógica para os botões de ação (Chamar Garçom / Fechar Conta)
    const btnChamarGarcom = document.getElementById('btn-chamar-garcom');
    const btnFecharConta = document.getElementById('btn-fechar-conta');

    const criarNotificacao = async (tipo) => {
        const urlParams = new URLSearchParams(window.location.search);
        const numeroMesa = urlParams.get('mesa') || 'Balcão';

        const confirmacaoMsg = tipo === 'chamar_garcom' ? 'chamar o garçom' : 'pedir para fechar a conta';
        if (confirm(`Tem certeza que deseja ${confirmacaoMsg}?`)) {
            try {
                await addDoc(collection(db, "notificacoes"), {
                    mesa: numeroMesa,
                    tipo: tipo,
                    timestamp: serverTimestamp(),
                    atendido: false
                });
                alert("Sua solicitação foi enviada!");
            } catch (e) {
                alert("Erro ao enviar solicitação. Tente novamente.");
                console.error("Erro ao criar notificação:", e);
            }
        }
    };

    btnChamarGarcom.addEventListener('click', () => criarNotificacao('chamar_garcom'));
    btnFecharConta.addEventListener('click', () => criarNotificacao('fechar_conta'));
});

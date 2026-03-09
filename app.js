// Banco de dados simulado (LocalStorage)
class PatrimonioDB {
    constructor() {
        this.dbName = 'patrimonio_oriximina';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            localStorage.setItem(this.dbName, JSON.stringify([]));
        }
    }

    // Gerar próximo código sequencial
    gerarProximoCodigo() {
        const bens = this.listarTodos();
        const numero = bens.length + 1;
        return `ORX-BEM-${String(numero).padStart(6, '0')}`;
    }

    // Adicionar novo bem
    adicionar(bem) {
        const bens = this.listarTodos();
        bem.id = Date.now();
        bem.codigo = this.gerarProximoCodigo();
        bem.dataCadastro = new Date().toISOString();
        bens.push(bem);
        localStorage.setItem(this.dbName, JSON.stringify(bens));
        return bem;
    }

    // Listar todos os bens
    listarTodos() {
        return JSON.parse(localStorage.getItem(this.dbName)) || [];
    }

    // Buscar bem por ID
    buscarPorId(id) {
        const bens = this.listarTodos();
        return bens.find(bem => bem.id === id);
    }

    // Buscar bem por código
    buscarPorCodigo(codigo) {
        const bens = this.listarTodos();
        return bens.find(bem => bem.codigo === codigo);
    }

    // Atualizar bem
    atualizar(id, dadosAtualizados) {
        const bens = this.listarTodos();
        const index = bens.findIndex(bem => bem.id === id);
        if (index !== -1) {
            bens[index] = { ...bens[index], ...dadosAtualizados };
            localStorage.setItem(this.dbName, JSON.stringify(bens));
            return bens[index];
        }
        return null;
    }

    // Remover bem
    remover(id) {
        const bens = this.listarTodos();
        const novosBens = bens.filter(bem => bem.id !== id);
        localStorage.setItem(this.dbName, JSON.stringify(novosBens));
    }

    // Buscar com filtro
    buscar(termo) {
        const bens = this.listarTodos();
        const termoLower = termo.toLowerCase();
        return bens.filter(bem =>
            bem.codigo.toLowerCase().includes(termoLower) ||
            bem.descricao.toLowerCase().includes(termoLower) ||
            bem.secretaria.toLowerCase().includes(termoLower) ||
            bem.setor.toLowerCase().includes(termoLower) ||
            (bem.marca && bem.marca.toLowerCase().includes(termoLower))
        );
    }
}

// Instância global do banco de dados
const db = new PatrimonioDB();

// Gerenciamento de Interface
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    if (sectionId === 'listagem') {
        carregarTabela();
    } else if (sectionId === 'impressao') {
        carregarListaImpressao();
    }
}

// Formatação de data
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

// Formatação de moeda
function formatarMoeda(valor) {
    if (!valor) return '-';
    return parseFloat(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Cadastro de Bem
document.getElementById('formCadastro').addEventListener('submit', function(e) {
    e.preventDefault();

    const novoBem = {
        secretaria: document.getElementById('secretaria').value,
        setor: document.getElementById('setor').value,
        descricao: document.getElementById('descricao').value,
        marca: document.getElementById('marca').value,
        numeroSerie: document.getElementById('numeroSerie').value,
        dataAquisicao: document.getElementById('dataAquisicao').value,
        valorAquisicao: document.getElementById('valorAquisicao').value,
        estado: document.getElementById('estado').value,
        observacoes: document.getElementById('observacoes').value
    };

    const bemCadastrado = db.adicionar(novoBem);
    alert(`✅ Bem cadastrado com sucesso!\n\nCódigo: ${bemCadastrado.codigo}\nDescrição: ${bemCadastrado.descricao}`);
    this.reset();
    document.getElementById('dataAquisicao').valueAsDate = new Date();
});

// Carregar tabela de bens
function carregarTabela(bens = null) {
    const tbody = document.getElementById('corpoTabela');
    const listaBens = bens || db.listarTodos();

    if (listaBens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Nenhum bem cadastrado ainda.</td></tr>';
        return;
    }

    tbody.innerHTML = listaBens.map(bem => `
        <tr>
            <td><strong>${bem.codigo}</strong></td>
            <td>${bem.descricao}</td>
            <td>${bem.secretaria}</td>
            <td>${bem.setor}</td>
            <td>${formatarData(bem.dataAquisicao)}</td>
            <td><span class="badge badge-${bem.estado.toLowerCase().replace('í', 'i')}">${bem.estado}</span></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="visualizarBem(${bem.id})">👁️ Ver</button>
                <button class="btn btn-danger btn-small" onclick="removerBem(${bem.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Busca em tempo real
document.getElementById('searchInput').addEventListener('input', function(e) {
    const termo = e.target.value;
    if (termo.length > 0) {
        const resultados = db.buscar(termo);
        carregarTabela(resultados);
    } else {
        carregarTabela();
    }
});

// Visualizar detalhes do bem
function visualizarBem(id) {
    const bem = db.buscarPorId(id);
    if (!bem) return;

    const detalhes = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DETALHES DO PATRIMÔNIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 Código: ${bem.codigo}

📝 Descrição: ${bem.descricao}
🏢 Secretaria: ${bem.secretaria}
🏛️ Setor: ${bem.setor}

🏷️ Marca/Modelo: ${bem.marca || 'Não informado'}
🔖 Nº de Série: ${bem.numeroSerie || 'Não informado'}

📅 Data de Aquisição: ${formatarData(bem.dataAquisicao)}
💰 Valor: ${formatarMoeda(bem.valorAquisicao)}

⚙️ Estado: ${bem.estado}
📝 Observações: ${bem.observacoes || 'Nenhuma'}

🗓️ Cadastrado em: ${formatarData(bem.dataCadastro)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    alert(detalhes);
}

// Remover bem
function removerBem(id) {
    const bem = db.buscarPorId(id);
    if (!bem) return;

    if (confirm(`Deseja realmente remover o bem:\n\n${bem.codigo} - ${bem.descricao}?`)) {
        db.remover(id);
        carregarTabela();
        alert('✅ Bem removido com sucesso!');
    }
}

// Carregar lista para impressão
function carregarListaImpressao() {
    const lista = document.getElementById('listaBensImpressao');
    const bens = db.listarTodos();

    if (bens.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhum bem cadastrado para impressão.</p>';
        return;
    }

    lista.innerHTML = bens.map(bem => `
        <div class="item-impressao">
            <input type="checkbox" id="check-${bem.id}" value="${bem.id}">
            <label for="check-${bem.id}" style="cursor: pointer; flex: 1;">
                <strong>${bem.codigo}</strong> - ${bem.descricao} (${bem.secretaria})
            </label>
        </div>
    `).join('');
}

// Selecionar/Desselecionar todos
function selecionarTodos() {
    document.querySelectorAll('#listaBensImpressao input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselecionarTodos() {
    document.querySelectorAll('#listaBensImpressao input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// ============================================================
// Gerar QR Code (retorna um <canvas> pronto)
// ============================================================
function gerarQRCode(texto, tamanhoPixels = 300) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, texto, {
            width: tamanhoPixels,
            margin: 1,
            errorCorrectionLevel: 'M'
        }, (error) => {
            if (error) reject(error);
            else resolve(canvas);
        });
    });
}

// ============================================================
// Criar etiqueta individual 62x62mm para impressora térmica
//
// Layout vertical (de cima para baixo):
//   1. Brasão / nome da prefeitura   (topo)
//   2. QR Code                        (centro)
//   3. Código + Secretaria + Setor    (base)
// ============================================================
async function criarEtiqueta(bem) {
    const etiqueta = document.createElement('div');
    etiqueta.className = 'etiqueta';

    // URL que o QR Code vai apontar
    const url = `${window.location.origin}/item.html?codigo=${bem.codigo}`;

    // --- Cabeçalho: brasão ---
    const brasaoDiv = document.createElement('div');
    brasaoDiv.className = 'etiqueta-brasao';
    brasaoDiv.textContent = 'PREFEITURA DE ORIXIMINÁ';

    // --- QR Code ---
    // Geramos em alta resolução (300px) e o CSS de impressão
    // vai escalar para 32mm via width/height em mm.
    const qrCanvas = await gerarQRCode(url, 300);
    const qrDiv = document.createElement('div');
    qrDiv.className = 'etiqueta-qr';
    qrDiv.appendChild(qrCanvas);

    // --- Informações do bem ---
    const infoDiv = document.createElement('div');
    infoDiv.className = 'etiqueta-info';

    const codigoSpan = document.createElement('div');
    codigoSpan.className = 'etiqueta-codigo';
    codigoSpan.textContent = bem.codigo;

    const secretariaSpan = document.createElement('div');
    secretariaSpan.className = 'etiqueta-secretaria';
    secretariaSpan.textContent = bem.secretaria;

    const setorSpan = document.createElement('div');
    setorSpan.className = 'etiqueta-setor';
    setorSpan.textContent = bem.setor;

    infoDiv.appendChild(codigoSpan);
    infoDiv.appendChild(secretariaSpan);
    infoDiv.appendChild(setorSpan);

    // Montar etiqueta
    etiqueta.appendChild(brasaoDiv);
    etiqueta.appendChild(qrDiv);
    etiqueta.appendChild(infoDiv);

    return etiqueta;
}

// ============================================================
// Imprimir etiquetas selecionadas
//
// Diferenças em relação ao código anterior:
//   - Removido o conceito de "folha" com 30 etiquetas em grade.
//   - Cada bem gera UMA div.etiqueta adicionada sequencialmente.
//   - O CSS @page + page-break-after garante um corte por etiqueta
//     na Brother QL-810 (ou qualquer impressora de rolo configurada
//     com papel 62x62mm no diálogo de impressão do SO).
// ============================================================
async function imprimirEtiquetas() {
    const checkboxes = document.querySelectorAll(
        '#listaBensImpressao input[type="checkbox"]:checked'
    );

    if (checkboxes.length === 0) {
        alert('⚠️ Selecione pelo menos um bem para impressão!');
        return;
    }

    const ids  = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const bens = ids.map(id => db.buscarPorId(id)).filter(Boolean);

    // Limpar área de impressão anterior
    const areaImpressao = document.getElementById('areaImpressao');
    areaImpressao.innerHTML = '';

    // Gerar uma etiqueta por bem — sem agrupamento em grade
    for (const bem of bens) {
        const etiqueta = await criarEtiqueta(bem);
        areaImpressao.appendChild(etiqueta);
    }

    /*
     * Aguarda o browser renderizar os canvas dos QR Codes
     * antes de abrir o diálogo de impressão.
     *
     * Instrução ao usuário no diálogo do SO:
     *   - Selecionar impressora: Brother QL-810 (ou QL-810W)
     *   - Tamanho do papel: 62x62mm (DK-11204 ou DK-22205 cortado)
     *   - Margens: Nenhuma / None
     *   - Escala: 100% (sem ajuste de página)
     */
    setTimeout(() => {
        window.print();
    }, 600);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('dataAquisicao').valueAsDate = new Date();
    carregarTabela();
    console.log('✅ Sistema de Patrimônio Digital inicializado!');
    console.log(`📊 Total de bens cadastrados: ${db.listarTodos().length}`);
});

// Exportar para uso em outras páginas
window.PatrimonioSystem = {
    db: db,
    formatarData: formatarData,
    formatarMoeda: formatarMoeda
};
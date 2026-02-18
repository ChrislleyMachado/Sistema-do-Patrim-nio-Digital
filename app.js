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
    // Ocultar todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar seção selecionada
    document.getElementById(sectionId).classList.add('active');

    // Ativar botão correspondente
    event.target.classList.add('active');

    // Atualizar dados se necessário
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

    // Limpar formulário
    this.reset();

    // Definir data atual como padrão
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

// Gerar QR Code
function gerarQRCode(texto, tamanho = 200) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, texto, {
            width: tamanho,
            margin: 1,
            errorCorrectionLevel: 'M'
        }, (error) => {
            if (error) reject(error);
            else resolve(canvas);
        });
    });
}

// Imprimir etiquetas selecionadas
async function imprimirEtiquetas() {
    const checkboxes = document.querySelectorAll('#listaBensImpressao input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        alert('⚠️ Selecione pelo menos um bem para impressão!');
        return;
    }

    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const bens = ids.map(id => db.buscarPorId(id)).filter(Boolean);

    const areaImpressao = document.getElementById('areaImpressao');
    areaImpressao.innerHTML = '';

    // Agrupar em folhas de 30 etiquetas (3x10)
    const etiquetasPorFolha = 30;
    const numFolhas = Math.ceil(bens.length / etiquetasPorFolha);

    for (let folha = 0; folha < numFolhas; folha++) {
        const grid = document.createElement('div');
        grid.className = 'etiquetas-grid';

        const inicio = folha * etiquetasPorFolha;
        const fim = Math.min(inicio + etiquetasPorFolha, bens.length);

        for (let i = inicio; i < fim; i++) {
            const bem = bens[i];
            const etiqueta = await criarEtiqueta(bem);
            grid.appendChild(etiqueta);
        }

        // Preencher espaços vazios se necessário
        const etiquetasNaFolha = fim - inicio;
        for (let i = etiquetasNaFolha; i < etiquetasPorFolha; i++) {
            const etiquetaVazia = document.createElement('div');
            etiquetaVazia.className = 'etiqueta';
            grid.appendChild(etiquetaVazia);
        }

        areaImpressao.appendChild(grid);
    }

    // Aguardar renderização e imprimir
    setTimeout(() => {
        window.print();
    }, 500);
}

// Criar etiqueta individual
async function criarEtiqueta(bem) {
    const etiqueta = document.createElement('div');
    etiqueta.className = 'etiqueta';

    // URL que o QR Code vai apontar (em produção, usar domínio real)
    const url = `${window.location.origin}/item.html?codigo=${bem.codigo}`;

    // Gerar QR Code
    const qrCanvas = await gerarQRCode(url, 200);
    
    const qrDiv = document.createElement('div');
    qrDiv.className = 'etiqueta-qr';
    qrDiv.appendChild(qrCanvas);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'etiqueta-info';
    infoDiv.innerHTML = `
        <div class="etiqueta-brasao">🏛️ PREFEITURA DE ORIXIMINÁ</div>
        <div class="etiqueta-codigo">${bem.codigo}</div>
        <div class="etiqueta-secretaria">${bem.secretaria}</div>
        <div class="etiqueta-setor">${bem.setor}</div>
    `;

    etiqueta.appendChild(qrDiv);
    etiqueta.appendChild(infoDiv);

    return etiqueta;
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Definir data atual como padrão no formulário
    document.getElementById('dataAquisicao').valueAsDate = new Date();

    // Carregar dados iniciais
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
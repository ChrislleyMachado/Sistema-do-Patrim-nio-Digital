// ============================================
// EXEMPLO DE BACKEND COM NODE.JS + EXPRESS
// ============================================

// Este arquivo mostra como migrar o sistema para um backend real
// com banco de dados MySQL/PostgreSQL

// ============================================
// 1. INSTALAÇÃO
// ============================================

/*
npm init -y
npm install express mysql2 cors dotenv qrcode
npm install --save-dev nodemon
*/

// ============================================
// 2. CONFIGURAÇÃO DO SERVIDOR (server.js)
// ============================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Arquivos HTML/CSS/JS

// ============================================
// 3. CONEXÃO COM BANCO DE DADOS
// ============================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'patrimonio_oriximina',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================
// 4. CRIAR TABELA NO BANCO
// ============================================

const SQL_CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS bens_patrimoniais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  secretaria VARCHAR(100) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  marca VARCHAR(100),
  numero_serie VARCHAR(100),
  data_aquisicao DATE NOT NULL,
  valor_aquisicao DECIMAL(10, 2),
  estado ENUM('Novo', 'Bom', 'Regular', 'Ruim', 'Inservível') NOT NULL,
  observacoes TEXT,
  data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  INDEX idx_codigo (codigo),
  INDEX idx_secretaria (secretaria),
  INDEX idx_data_aquisicao (data_aquisicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// ============================================
// 5. ROTAS DA API
// ============================================

// Gerar próximo código
async function gerarProximoCodigo() {
  const [rows] = await pool.query(
    'SELECT codigo FROM bens_patrimoniais ORDER BY id DESC LIMIT 1'
  );
  
  if (rows.length === 0) {
    return 'ORX-BEM-000001';
  }
  
  const ultimoCodigo = rows[0].codigo;
  const numero = parseInt(ultimoCodigo.split('-')[2]) + 1;
  return `ORX-BEM-${String(numero).padStart(6, '0')}`;
}

// ============================================
// GET /api/bens - Listar todos os bens
// ============================================
app.get('/api/bens', async (req, res) => {
  try {
    const { search, secretaria, estado } = req.query;
    let query = 'SELECT * FROM bens_patrimoniais WHERE ativo = TRUE';
    const params = [];

    if (search) {
      query += ' AND (codigo LIKE ? OR descricao LIKE ? OR marca LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (secretaria) {
      query += ' AND secretaria = ?';
      params.push(secretaria);
    }

    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar bens:', error);
    res.status(500).json({ error: 'Erro ao listar bens' });
  }
});

// ============================================
// GET /api/bens/:id - Buscar bem por ID
// ============================================
app.get('/api/bens/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM bens_patrimoniais WHERE id = ? AND ativo = TRUE',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bem não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar bem:', error);
    res.status(500).json({ error: 'Erro ao buscar bem' });
  }
});

// ============================================
// GET /api/bens/codigo/:codigo - Buscar por código
// ============================================
app.get('/api/bens/codigo/:codigo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM bens_patrimoniais WHERE codigo = ? AND ativo = TRUE',
      [req.params.codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bem não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar bem:', error);
    res.status(500).json({ error: 'Erro ao buscar bem' });
  }
});

// ============================================
// POST /api/bens - Cadastrar novo bem
// ============================================
app.post('/api/bens', async (req, res) => {
  try {
    const {
      secretaria,
      setor,
      descricao,
      marca,
      numero_serie,
      data_aquisicao,
      valor_aquisicao,
      estado,
      observacoes
    } = req.body;

    // Validações
    if (!secretaria || !setor || !descricao || !data_aquisicao || !estado) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const codigo = await gerarProximoCodigo();

    const [result] = await pool.query(
      `INSERT INTO bens_patrimoniais 
       (codigo, secretaria, setor, descricao, marca, numero_serie, 
        data_aquisicao, valor_aquisicao, estado, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, secretaria, setor, descricao, marca, numero_serie,
       data_aquisicao, valor_aquisicao, estado, observacoes]
    );

    const [bem] = await pool.query(
      'SELECT * FROM bens_patrimoniais WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(bem[0]);
  } catch (error) {
    console.error('Erro ao cadastrar bem:', error);
    res.status(500).json({ error: 'Erro ao cadastrar bem' });
  }
});

// ============================================
// PUT /api/bens/:id - Atualizar bem
// ============================================
app.put('/api/bens/:id', async (req, res) => {
  try {
    const {
      secretaria,
      setor,
      descricao,
      marca,
      numero_serie,
      data_aquisicao,
      valor_aquisicao,
      estado,
      observacoes
    } = req.body;

    await pool.query(
      `UPDATE bens_patrimoniais 
       SET secretaria = ?, setor = ?, descricao = ?, marca = ?, 
           numero_serie = ?, data_aquisicao = ?, valor_aquisicao = ?, 
           estado = ?, observacoes = ?
       WHERE id = ? AND ativo = TRUE`,
      [secretaria, setor, descricao, marca, numero_serie,
       data_aquisicao, valor_aquisicao, estado, observacoes, req.params.id]
    );

    const [bem] = await pool.query(
      'SELECT * FROM bens_patrimoniais WHERE id = ?',
      [req.params.id]
    );

    res.json(bem[0]);
  } catch (error) {
    console.error('Erro ao atualizar bem:', error);
    res.status(500).json({ error: 'Erro ao atualizar bem' });
  }
});

// ============================================
// DELETE /api/bens/:id - Remover bem (soft delete)
// ============================================
app.delete('/api/bens/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE bens_patrimoniais SET ativo = FALSE WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Bem removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover bem:', error);
    res.status(500).json({ error: 'Erro ao remover bem' });
  }
});

// ============================================
// GET /api/qrcode/:codigo - Gerar QR Code
// ============================================
app.get('/api/qrcode/:codigo', async (req, res) => {
  try {
    const url = `${process.env.BASE_URL || 'http://localhost:3000'}/item.html?codigo=${req.params.codigo}`;
    
    const qrCode = await QRCode.toDataURL(url, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M'
    });

    res.json({ qrCode, url });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

// ============================================
// GET /api/estatisticas - Estatísticas gerais
// ============================================
app.get('/api/estatisticas', async (req, res) => {
  try {
    const [total] = await pool.query(
      'SELECT COUNT(*) as total FROM bens_patrimoniais WHERE ativo = TRUE'
    );

    const [porSecretaria] = await pool.query(
      `SELECT secretaria, COUNT(*) as total 
       FROM bens_patrimoniais 
       WHERE ativo = TRUE 
       GROUP BY secretaria 
       ORDER BY total DESC`
    );

    const [porEstado] = await pool.query(
      `SELECT estado, COUNT(*) as total 
       FROM bens_patrimoniais 
       WHERE ativo = TRUE 
       GROUP BY estado`
    );

    const [valorTotal] = await pool.query(
      `SELECT SUM(valor_aquisicao) as total 
       FROM bens_patrimoniais 
       WHERE ativo = TRUE`
    );

    res.json({
      total: total[0].total,
      porSecretaria,
      porEstado,
      valorTotal: valorTotal[0].total || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ============================================
// Inicializar servidor
// ============================================
async function iniciarServidor() {
  try {
    // Criar tabela se não existir
    await pool.query(SQL_CREATE_TABLE);
    console.log('✅ Banco de dados configurado');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();

// ============================================
// 6. ARQUIVO .env
// ============================================

/*
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=patrimonio_oriximina

# Servidor
PORT=3000
BASE_URL=http://patrimonio.oriximina.pa.gov.br

# Sessão (opcional)
SESSION_SECRET=sua_chave_secreta_aqui
*/

// ============================================
// 7. MODIFICAR app.js DO FRONTEND
// ============================================

/*
// Substituir a classe PatrimonioDB por chamadas à API

class PatrimonioAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    async adicionar(bem) {
        const response = await fetch(`${this.baseURL}/bens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bem)
        });
        return await response.json();
    }

    async listarTodos() {
        const response = await fetch(`${this.baseURL}/bens`);
        return await response.json();
    }

    async buscarPorCodigo(codigo) {
        const response = await fetch(`${this.baseURL}/bens/codigo/${codigo}`);
        return await response.json();
    }

    async atualizar(id, dados) {
        const response = await fetch(`${this.baseURL}/bens/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        return await response.json();
    }

    async remover(id) {
        const response = await fetch(`${this.baseURL}/bens/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    async buscar(termo) {
        const response = await fetch(`${this.baseURL}/bens?search=${termo}`);
        return await response.json();
    }
}

// Substituir: const db = new PatrimonioDB();
// Por: const db = new PatrimonioAPI();
*/

// ============================================
// 8. SCRIPTS DO PACKAGE.JSON
// ============================================

/*
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
*/
-- Estrutura do Banco de Dados para Fluxo de Caixa Básico

-- Criação da tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('entrada', 'saida')) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de lançamentos
CREATE TABLE IF NOT EXISTS lancamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    tipo TEXT CHECK(tipo IN ('entrada', 'saida')) NOT NULL,
    data DATE NOT NULL,
    categoria_id INTEGER,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

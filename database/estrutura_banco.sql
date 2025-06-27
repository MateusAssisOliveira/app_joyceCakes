-- Tabelas básicas de suporte
CREATE TABLE unidades_medida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    simbolo VARCHAR(10),
    tipo ENUM('peso', 'volume', 'unidade', 'tempo') NOT NULL
);

CREATE TABLE categorias_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT
);

CREATE TABLE categorias_receita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT
);

-- Tabelas principais
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(50),
    categoria_id INT,
    unidade_medida_id INT NOT NULL,
    custo_unitario DECIMAL(10,2) NOT NULL,
    estoque_minimo DECIMAL(10,3),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES categorias_produto(id),
    FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id)
);

CREATE TABLE receitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria_id INT,
    modo_preparo TEXT NOT NULL,
    tempo_preparo INT NOT NULL, -- em minutos
    rendimento DECIMAL(10,3) NOT NULL,
    unidade_medida_id INT NOT NULL,
    dificuldade ENUM('fácil', 'médio', 'difícil'),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    custo_estimado DECIMAL(10,2),
    calorias_por_porcao INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias_receita(id),
    FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id)
);

-- Tabela de relacionamento com histórico de preços
CREATE TABLE receitas_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receita_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    unidade_medida_id INT NOT NULL,
    observacoes TEXT,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receita_id) REFERENCES receitas(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id)
);

-- Tabelas para análise
CREATE TABLE precos_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fonte VARCHAR(100),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE preparacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receita_id INT NOT NULL,
    data_preparo DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantidade DECIMAL(10,3) NOT NULL,
    custo_real DECIMAL(10,2),
    observacoes TEXT,
    avaliacao ENUM('1', '2', '3', '4', '5'),
    FOREIGN KEY (receita_id) REFERENCES receitas(id)
);

CREATE TABLE ingredientes_preparacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preparacao_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade_utilizada DECIMAL(10,3) NOT NULL,
    custo_no_momento DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (preparacao_id) REFERENCES preparacoes(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);


-- Inserir unidades de medida
INSERT INTO unidades_medida (nome, simbolo, tipo) VALUES
('grama', 'g', 'peso'),
('quilograma', 'kg', 'peso'),
('mililitro', 'ml', 'volume'),
('litro', 'l', 'volume'),
('unidade', 'un', 'unidade'),
('colher de sopa', 'col. sopa', 'volume'),
('xícara', 'xíc.', 'volume'),
('pitada', 'pitada', 'peso'),
('minuto', 'min', 'tempo');

-- Inserir categorias
INSERT INTO categorias_produto (nome, descricao) VALUES
('Laticínios', 'Produtos derivados de leite'),
('Grãos e farinhas', 'Farinhas e cereais'),
('Doces', 'Ingredientes para confeitaria'),
('Temperos', 'Especiarias e condimentos'),
('Básicos', 'Ingredientes básicos');

INSERT INTO categorias_receita (nome, descricao) VALUES
('Bolos', 'Receitas de bolos diversos'),
('Sobremesas', 'Doces e sobremesas'),
('Pães', 'Receitas de pães e massas'),
('Salgados', 'Receitas salgadas'),
('Bebidas', 'Receitas de bebidas');
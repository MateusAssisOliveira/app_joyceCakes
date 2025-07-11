-- 1. Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Apagar dados na ordem correta (tabelas filhas primeiro)
DELETE FROM ingredientes_preparacao;
DELETE FROM preparacoes;
DELETE FROM receitas_produtos;
DELETE FROM precos_produtos;
DELETE FROM receitas;
DELETE FROM produtos;
DELETE FROM categorias_receita;
DELETE FROM categorias_produto;
DELETE FROM unidades_medida;

-- 3. Resetar os auto-increment
ALTER TABLE ingredientes_preparacao AUTO_INCREMENT = 1;
ALTER TABLE preparacoes AUTO_INCREMENT = 1;
ALTER TABLE receitas_produtos AUTO_INCREMENT = 1;
ALTER TABLE precos_produtos AUTO_INCREMENT = 1;
ALTER TABLE receitas AUTO_INCREMENT = 1;
ALTER TABLE produtos AUTO_INCREMENT = 1;
ALTER TABLE categorias_receita AUTO_INCREMENT = 1;
ALTER TABLE categorias_produto AUTO_INCREMENT = 1;
ALTER TABLE unidades_medida AUTO_INCREMENT = 1;

-- 4. Reativar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

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
('minuto', 'min', 'tempo'),
('fatia', 'fatia', 'unidade'),
('pacote', 'pct', 'unidade');

-- Inserir categorias
INSERT INTO categorias_produto (nome, descricao) VALUES
('Grãos e Farinhas', 'Farinhas e derivados de cereais'),
('Laticínios', 'Produtos derivados de leite'),
('Doces', 'Ingredientes para confeitaria'),
('Temperos', 'Especiarias e condimentos'),
('Básicos', 'Ingredientes básicos de cozinha');

INSERT INTO categorias_receita (nome, descricao) VALUES
('Bolos', 'Receitas de bolos diversos'),
('Sobremesas', 'Doces e sobremesas'),
('Pães e Massas', 'Receitas de pães e massas'),
('Salgados', 'Receitas salgadas'),
('Internacional', 'Receitas de culinária internacional');

-- Inserir produtos com categorias e unidades corretas
INSERT INTO produtos (nome, descricao, categoria_id, unidade_medida_id, custo_unitario) VALUES
-- Farinha de Trigo (1)
('Farinha de Trigo', 'Farinha de trigo especial', 1, 1, 0.85), -- grama
-- Ovos (2)
('Ovos', 'Ovos brancos tamanho grande', 5, 5, 0.50), -- unidade
-- Leite (3)
('Leite', 'Leite integral 1L', 2, 4, 4.50), -- litro
-- Manteiga (4)
('Manteiga', 'Manteiga sem sal', 2, 1, 0.039), -- grama
-- Açúcar (5)
('Açúcar', 'Açúcar refinado', 5, 1, 0.52), -- grama
-- Chocolate em Pó (6)
('Chocolate em Pó', 'Chocolate 50% cacau', 3, 1, 12.90), -- grama
-- Fermento em Pó (7)
('Fermento em Pó', 'Fermento químico', 5, 1, 3.50), -- grama
-- Sal (8)
('Sal', 'Sal refinado', 5, 1, 0.23), -- grama
-- Óleo (9)
('Óleo', 'Óleo de soja', 5, 4, 8.90), -- litro
-- Canela (10)
('Canela', 'Canela em pó', 4, 1, 0.128); -- grama

-- Registrar preços históricos dos produtos
INSERT INTO precos_produtos (produto_id, preco, fonte) VALUES
(1, 0.85, 'Cadastro inicial'),
(2, 0.50, 'Cadastro inicial'),
(3, 4.50, 'Cadastro inicial'),
(4, 0.039, 'Cadastro inicial'),
(5, 0.52, 'Cadastro inicial'),
(6, 12.90, 'Cadastro inicial'),
(7, 3.50, 'Cadastro inicial'),
(8, 0.23, 'Cadastro inicial'),
(9, 8.90, 'Cadastro inicial'),
(10, 0.128, 'Cadastro inicial');

-- Inserir receitas (convertendo tempo para minutos)
INSERT INTO receitas (nome, descricao, categoria_id, modo_preparo, tempo_preparo, rendimento, unidade_medida_id, dificuldade) VALUES
-- Bolo de Chocolate (1)
('Bolo de Chocolate', 'Bolo simples de chocolate', 1, 'Misture todos os ingredientes secos. Adicione os líquidos e misture bem. Asse por 40 minutos.', 50, 8.00, 10, 'fácil'),
-- Panquecas (2)
('Panquecas', 'Panquecas americanas', 4, 'Misture os ingredientes secos e líquidos separadamente. Combine e cozinhe em frigideira.', 30, 12.00, 5, 'fácil'),
-- Pão de Ló (3)
('Pão de Ló', 'Pão de ló simples', 3, 'Bata os ovos com açúcar até dobrar de volume. Adicione farinha delicadamente. Asse por 30 minutos.', 45, 10.00, 10, 'médio'),
-- Brigadeiro (4)
('Brigadeiro', 'Brigadeiro tradicional', 2, 'Misture todos os ingredientes em uma panela e cozinhe em fogo baixo até desgrudar do fundo.', 25, 30.00, 5, 'fácil'),
-- Cookies (5)
('Cookies', 'Cookies de chocolate', 2, 'Misture os ingredientes secos. Adicione manteiga e ovos. Forme bolinhas e asse por 15 minutos.', 30, 24.00, 5, 'médio');

-- Associar produtos às receitas (convertendo unidades)
INSERT INTO receitas_produtos (receita_id, produto_id, quantidade, unidade_medida_id, observacoes) VALUES
-- Bolo de Chocolate
(1, 1, 300, 1, 'Farinha de trigo'),
(1, 3, 1, 4, 'Leite integral'),
(1, 5, 200, 1, 'Açúcar refinado'),
(1, 6, 100, 1, 'Chocolate em pó'),
(1, 7, 10, 1, 'Fermento em pó'),
(1, 2, 3, 5, 'Ovos grandes');

INSERT INTO receitas_produtos (receita_id, produto_id, quantidade, unidade_medida_id, observacoes) VALUES
-- Panquecas
(2, 1, 200, 1, 'Farinha de trigo'),
(2, 2, 2, 5, 'Ovos grandes'),
(2, 3, 250, 3, 'Leite integral'), -- 0.25 litros = 250ml
(2, 9, 30, 3, 'Óleo de soja'), -- ~2 colheres de sopa = ~30ml
(2, 8, 1, 1, 'Sal refinado'); -- 1 pitada ≈ 1g

INSERT INTO receitas_produtos (receita_id, produto_id, quantidade, unidade_medida_id, observacoes) VALUES
-- Pão de Ló
(3, 1, 250, 1, 'Farinha de trigo'),
(3, 2, 4, 5, 'Ovos grandes'),
(3, 5, 150, 1, 'Açúcar refinado'),
(3, 7, 10, 1, 'Fermento em pó');

INSERT INTO receitas_produtos (receita_id, produto_id, quantidade, unidade_medida_id, observacoes) VALUES
-- Brigadeiro
(4, 3, 200, 3, 'Leite condensado'), -- 0.20 litros = 200ml
(4, 6, 50, 1, 'Chocolate em pó'),
(4, 4, 20, 1, 'Manteiga sem sal');

INSERT INTO receitas_produtos (receita_id, produto_id, quantidade, unidade_medida_id, observacoes) VALUES
-- Cookies
(5, 1, 300, 1, 'Farinha de trigo'),
(5, 4, 150, 1, 'Manteiga sem sal'),
(5, 5, 150, 1, 'Açúcar refinado'),
(5, 2, 2, 5, 'Ovos grandes'),
(5, 6, 100, 1, 'Chocolate em pó'),
(5, 10, 5, 1, 'Canela em pó (opcional)');

-- Calcular e atualizar custos estimados das receitas
UPDATE receitas r
SET custo_estimado = (
    SELECT SUM(rp.quantidade * p.custo_unitario)
    FROM receitas_produtos rp
    JOIN produtos p ON rp.produto_id = p.id
    WHERE rp.receita_id = r.id
);
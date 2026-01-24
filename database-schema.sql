-- ARQUIVO DE SCRIPT SQL PARA CRIAÇÃO DO BANCO DE DADOS
--
-- Propósito:
-- Este arquivo contém os comandos SQL (Structured Query Language) para criar a estrutura
-- de tabelas, colunas e relacionamentos do banco de dados da aplicação.
--
-- Como usar:
-- Este script pode ser executado em um sistema de gerenciamento de banco de dados
-- relacional compatível (como PostgreSQL, MySQL, SQLite) para configurar o schema
-- necessário para a aplicação funcionar em um ambiente de produção.
--
-- Responsabilidade:
-- - Definir a estrutura física do banco de dados.
-- - Garantir a integridade dos dados através de chaves primárias, chaves estrangeiras e restrições.

-- Tabela de Insumos (Matéria-prima)
CREATE TABLE Supplies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INT NOT NULL,
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('kg', 'L', 'un')), -- Unidade de medida (quilo, litro, unidade)
    costPerUnit DECIMAL(10, 2) NOT NULL -- Custo por unidade de medida (Ex: Custo por Kg)
);

-- Tabela de Produtos (Itens vendáveis)
CREATE TABLE Products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255),
    imageUrlId VARCHAR(255),
    stock_quantity INT NOT NULL DEFAULT 0
);

-- Tabela de Pedidos
CREATE TABLE Orders (
    id VARCHAR(255) PRIMARY KEY,
    customerName VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL -- Ex: 'Pendente', 'Em Preparo', 'Entregue'
);

-- Tabela de Itens do Pedido (Tabela de Junção para relação N:N entre Pedidos e Produtos)
CREATE TABLE OrderItems (
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Preço do produto no momento da compra
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT
);

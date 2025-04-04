from config.db import Database
from models.produto import Produto

class ProdutoController:
    
    @staticmethod
    def cadastrar_produto(nome, descricao, preco, quantidade, tipo):
        if not nome or not preco or not quantidade:
            return False, "Preencha todos os campos obrigatórios!"
        
        preco = float(preco.replace(',', '.'))  # Garante que o preço está correto
        produto = Produto(None, nome, descricao, preco, int(quantidade), tipo)
        
        db = Database()
        query = "INSERT INTO produtos (nome, descricao, preco, quantidade, tipo) VALUES (%s, %s, %s, %s, %s)"
        valores = (produto.nome, produto.descricao, produto.preco, produto.quantidade, produto.tipo)
        
        if db.executar_query(query, valores):
            return True, "Produto cadastrado com sucesso!"
        return False, "Erro ao cadastrar o produto!"
    
    @staticmethod
    def listar_produtos():
        db = Database()
        query = "SELECT id, nome, descricao, preco, quantidade, tipo FROM produtos"
        resultados = db.buscar_dados(query)
        
        print(f"Resultados da consulta: {resultados}")
        if not resultados:
            return []
                        
        return [Produto(**produto) for produto in resultados] if resultados else []

    @staticmethod
    def buscar_por_id(produto_id):
        db = Database()
        query = "SELECT * FROM produtos WHERE id=%s"
        resultado = db.buscar_dados(query, (produto_id,))
        return Produto(**resultado[0]) if resultado else None

    @staticmethod
    def deletar(produto_id):
        db = Database()
        query = "DELETE FROM produtos WHERE id=%s"
        return db.executar_query(query, (produto_id,))

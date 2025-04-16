from config.db import Database
from models.produto import Produto
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class ProdutoController:
    # Configuração do logging

    logging.info("Iniciando o ProdutoController")

    @staticmethod
    def cadastrar_produto(produto_data):
        logging.info(f"Dados recebidos para cadastro: {produto_data}")

        # Validações
        if not produto_data.nome or produto_data.descricao is None or produto_data.tipo is None:
            return False, "Preencha todos os campos obrigatórios!"

        # Validação do preço
        try:
            preco = float(produto_data.preco)
        except ValueError:
            logging.error("Preço inválido!")
            return False, "Preço inválido!"

        # Validação da quantidade
        if produto_data.quantidade is None:
            logging.error("Quantidade inválida!")
            return False, "Quantidade inválida!"

        try:
            quantidade = int(produto_data.quantidade)
        except ValueError:
            logging.error("Quantidade inválida (erro na conversão)!")
            return False, "Quantidade inválida!"

        # Interação com o banco de dados
        db = Database()
        
        query = """
            INSERT INTO produtos (nome, descricao, preco, quantidade, tipo) 
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = (
            produto_data.nome, 
            produto_data.descricao,
            preco,
            quantidade,
            produto_data.tipo
        )

        logging.info(f"Valores a serem inseridos no banco: {valores}")
        if db.executar_query(query, valores):
            logging.info("✅ Produto cadastrado com sucesso!")
            return True, "Produto cadastrado com sucesso!"
        
        logging.error("❌ Erro ao cadastrar o produto.")
        return False, "Erro ao cadastrar o produto!"

    @staticmethod
    def listar_produtos():
        db = Database()
        query = "SELECT id, nome, descricao, preco, quantidade, tipo FROM produtos"
        resultados = db.buscar_dados(query)
        
        logging.info(f"Resultados da consulta: {resultados}")
        if not resultados:
            return []
        
        return [Produto(**produto) for produto in resultados]

    @staticmethod
    def buscar_por_id(produto_id):
        db = Database()
        query = "SELECT * FROM produtos WHERE id=%s"
        resultado = db.buscar_dados(query, (produto_id,))
        
        if resultado:
            logging.info(f"Produto encontrado com ID {produto_id}: {resultado[0]}")
            return Produto(**resultado[0])
        else:
            logging.warning(f"Produto com ID {produto_id} não encontrado.")
            return None

    @staticmethod
    def deletar(produto_id):
        db = Database()
        query = "DELETE FROM produtos WHERE id=%s"
        sucesso = db.executar_query(query, (produto_id,))
        
        if sucesso:
            logging.info(f"Produto com ID {produto_id} deletado com sucesso.")
        else:
            logging.warning(f"Falha ao deletar o produto com ID {produto_id}.")
        
        return sucesso

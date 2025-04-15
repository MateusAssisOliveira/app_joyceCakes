from venv import logger
from config.db import Database
from models.produto import Produto
import logging


class ProdutoController:
    logging.basicConfig(
    filename='log_app.txt',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    logger.info("Iniciando o ProdutoController")
    
    @staticmethod
    def cadastrar_produto(produto_data):
        logger.info(f"Dados recebidos para cadastro: {produto_data}")

        if not produto_data.get_nome() or produto_data.get_descricao() is None or produto_data.get_tipo() is None:
            return False, "Preencha todos os campos obrigatórios!"

        try:
            preco = float(produto_data.get_preco().replace(',', '.'))
        except Exception:
            logger.error("Preço inválido!")
            return False, "Preço inválido!"

        if produto_data.get_quantidade() is None:
            logger.error("Quantidade inválida!")
            return False, "Quantidade inválida!"

        try:
            quantidade = int(produto_data.get_quantidade())
        except Exception:
            logger.error("Quantidade inválida (erro na conversão)!")
            return False, "Quantidade inválida!"

        db = Database()
        
        query = "INSERT INTO produtos (nome, descricao, preco, quantidade, tipo) VALUES (%s, %s, %s, %s, %s)"
        valores = (
            produto_data.get_nome(), 
            produto_data.get_descricao(),
            preco,
            quantidade,
            produto_data.get_tipo()
        )

        logger.info(f"Valores a serem inseridos no banco: {valores}")
        if db.executar_query(query, valores):
            logger.info("✅ Produto cadastrado com sucesso!")
            return True, "Produto cadastrado com sucesso!"
        
        logger.error("❌ Erro ao cadastrar o produto.")
        return False, "Erro ao cadastrar o produto!"

    @staticmethod
    def listar_produtos():
        db = Database()
        query = "SELECT id, nome, descricao, preco, quantidade, tipo FROM produtos"
        resultados = db.buscar_dados(query)
        
        logger.info(f"Resultados da consulta: {resultados}")
        if not resultados:
            return []
                        
        return [Produto(**produto) for produto in resultados]

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
        sucesso = db.executar_query(query, (produto_id,))
        if sucesso:
            logger.info(f"Produto com ID {produto_id} deletado com sucesso.")
        else:
            logger.warning(f"Falha ao deletar o produto com ID {produto_id}.")
        return sucesso

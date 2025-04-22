import inspect
from config.db import Database
from config.logger_config import ConfigurarLogger
from models.produto import Produto

logger = ConfigurarLogger.configurar("ProdutoController", log_em_arquivo=True)

class ProdutoController:

    @staticmethod
    def cadastrar_produto(produto_data: Produto):
        logger.info(f"Dados recebidos para cadastro: {produto_data}")

        if not produto_data.nome or produto_data.descricao is None or produto_data.tipo is None:
            logger.warning("Preencha todos os campos obrigatórios!")
            return False, "Preencha todos os campos obrigatórios!"

        try:
            preco = float(produto_data.preco)
        except ValueError as e:
            logger.error("Preço inválido!", exc_info=True)
            return False, "Preço inválido!"

        if produto_data.quantidade is None:
            logger.error("Quantidade inválida!")
            return False, "Quantidade inválida!"

        try:
            quantidade = int(produto_data.quantidade)
        except ValueError:
            logger.error("Quantidade inválida (erro na conversão)!", exc_info=True)
            return False, "Quantidade inválida!"

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

        if resultado:
            logger.info(f"Produto encontrado com ID {produto_id}: {resultado[0]}")
            return Produto(**resultado[0])
        else:
            logger.warning(f"Produto com ID {produto_id} não encontrado.")
            return None

    @staticmethod
    def buscar_produto_por_nome(nome):
        if not nome:
            logger.warning("Nome do produto não fornecido.")
            return []

        db = Database()
        query = "SELECT * FROM produtos WHERE nome LIKE %s"
        parametro = f"%{nome}%"

        try:
            resultado = db.buscar_dados(query, (parametro,))
        except Exception as e:
            logger.error(f"Erro ao buscar produtos por nome '{nome}': {e}", exc_info=True)
            return []

        if resultado:
            logger.info(f"{len(resultado)} produto(s) encontrados com nome parecido com '{nome}'.")
            return [Produto(**row) for row in resultado]
        else:
            logger.warning(f"Nenhum produto encontrado com nome parecido com '{nome}'.")
            return []

    @staticmethod
    def buscar_produto(termo):
        if termo is None or termo.strip() == "":
            logger.warning("Termo de busca vazio ou nulo.")
            return []

        if termo.isdigit():
            logger.info(f"Buscando produto por ID: {termo}")
            return ProdutoController.buscar_por_id(termo)
        else:
            logger.info(f"Buscando produto por nome: {termo}")
            return ProdutoController.buscar_produto_por_nome(termo)

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

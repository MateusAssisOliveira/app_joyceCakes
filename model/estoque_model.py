from database.db import Database
from logs.logger import Logger
from model.produto import Produto  # Supondo que logger.py está no mesmo projeto

class EstoqueModel:
    def __init__(self):
        self.database = Database()
        self.log = Logger()
        self.log.info("EstoqueModel inicializado.")

    def buscar_produtos(self):
        query = "SELECT * FROM produtos"
        resultados = self.database.fetch_data(query)
        
        if not resultados:
            self.log.error("Erro ao buscar produtos.")
            return []
        
        produtos = []

        for row in resultados:
            produtos.append(
                Produto(
                    id=row["id"],
                    nome=row["nome"],
                    descricao=row["descricao"],
                    preco=row["preco"],
                    quantidade=row["quantidade"],
                    tipo=row["tipo"]
                )
            )

        return produtos

    def get_colunas_produto(self):
        self.log.debug("Buscando colunas da tabela 'produto'.")
        query = "SHOW COLUMNS FROM produtos"
        resultados = self.database.fetch_data(query)
        
        if not resultados:
            self.log.error("Erro ao buscar colunas.")
            return []
        
        colunas = [coluna["Field"] for coluna in resultados]
        self.log.debug(f"Colunas encontradas: {colunas}")
        return colunas

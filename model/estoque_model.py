from database.db import Database
from logs.logger import Logger
from model.produto import Produto
from math import ceil

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
    
    def get_pagina(self, tabela, pagina=1, por_pagina=20, ordenar_por=None):
        
        """Retorna uma página específica dos resultados"""
        
        # Início da função: Log de entrada
        self.log.debug(f"\n\nIniciando a função get_pagina com parâmetros - tabela: {tabela}, página: {pagina}, por_pagina: {por_pagina}, ordenar_por: {ordenar_por}")

        # Validação básica
        if not tabela.isidentifier():
            self.log.error(f"Nome de tabela inválido: {tabela}")
            raise ValueError("Nome de tabela inválido.")
        
        if ordenar_por and not ordenar_por.isidentifier():
            self.log.error(f"Nome de coluna para ordenação inválido: {ordenar_por}")
            raise ValueError("Nome de coluna para ordenação inválido.")
        
        # Calculando o offset
        offset = (pagina - 1) * por_pagina
        self.log.debug(f"Calculando o offset: {offset} (para página {pagina} com {por_pagina} itens por página)")

        # Construindo a query SQL
        query = f"SELECT * FROM {tabela}"
        if ordenar_por:
            query += f" ORDER BY {ordenar_por}"
        
        query += " LIMIT %s OFFSET %s"
        self.log.debug(f"Query gerada para busca de dados: {query}")

        try:
            # Executando a consulta de dados
            resultados = self.database.fetch_data(query, (por_pagina, offset))
            self.log.debug(f"Consulta executada com sucesso. Resultados obtidos: {len(resultados)} registros.")
            
        except Exception as e:
            self.log.error(f"Erro ao executar consulta: {e}")
            raise

        # Obter o total de registros
        total_query = f"SELECT COUNT(*) AS total FROM {tabela}"

        try:
            total_result = self.database.fetch_data(total_query)
            total_registros = int(total_result[0]['total']) if total_result else 0

            self.log.debug(f"Registro encontrado total_result : {total_result}")
            self.log.debug(f"Registro encontrado total_registros: {total_registros}")

        except (IndexError, TypeError, ValueError, KeyError) as e:
            self.log.error(f"Erro ao processar contagem total: {e}")
            total_registros = 0

        # Calculando o total de páginas
        total_paginas = ceil(total_registros / por_pagina)
        colunas = self.get_colunas_produto()
        self.log.debug(f"Calculando o total de páginas: {total_paginas} (total de {total_registros} registros com {por_pagina} por página)")

        # Preparando a resposta
        resultado_final = {
            'dados': resultados,
            'colunas': colunas,
            'pagina_atual': pagina,
            'por_pagina': por_pagina,
            'total_registros': total_registros,
            'total_paginas': total_paginas,
            'pagina_anterior': pagina - 1 if pagina > 1 else None,
            'proxima_pagina': pagina + 1 if pagina < total_paginas else None
        }

        self.log.debug(f"Retornando os dados paginados: {resultado_final}")
        return resultado_final
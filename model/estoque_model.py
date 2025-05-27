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
    
    def get_pagina(self, tabela='produto', pagina=1, por_pagina=20, ordenar_por=None, filtros=None, direcao='ASC'):
        """
        Busca dados paginados com tratamento para strings como filtros
        
        Parâmetros:
        - tabela: Nome da tabela
        - pagina: Número da página
        - por_pagina: Itens por página
        - ordenar_por: Coluna para ordenação
        - filtros: Pode ser:
        - String: busca no campo 'nome'
        - Dicionário: busca nos campos especificados
        - direcao: Direção da ordenação
        """
        try:
            # Converter filtro de string para dict se necessário
            if isinstance(filtros, str):
                filtros = {'nome': filtros} if filtros else None
            
            # Validação do nome da tabela
            if not tabela.replace("_", "").isalnum():
                raise ValueError("Nome de tabela inválido")
            
            # Construção das queries
            query = f"SELECT * FROM {tabela}"
            query_total = f"SELECT COUNT(*) AS total FROM {tabela}"
            params = []
            
            # Processamento de filtros
            if filtros:
                conditions = []
                for campo, valor in filtros.items():
                    if not campo.replace("_", "").isalnum():
                        continue
                    
                    if isinstance(valor, str):
                        conditions.append(f"{campo} LIKE %s")
                        params.append(f"{valor}%")  # Busca por prefixo
                    else:
                        conditions.append(f"{campo} = %s")
                        params.append(valor)
                
                if conditions:
                    where = " WHERE " + " AND ".join(conditions)
                    query += where
                    query_total += where
            
            # Ordenação
            if ordenar_por and ordenar_por.replace("_", "").isalnum():
                query += f" ORDER BY {ordenar_por} {direcao}"
            
            # Paginação
            offset = (pagina - 1) * por_pagina
            query += f" LIMIT {por_pagina} OFFSET {offset}"
            
            # Execução das queries
            dados = self.database.fetch_data(query, tuple(params))
            total = self.database.fetch_data(query_total, tuple(params))
            
            # Cálculos finais
            total_registros = total[0]['total'] if total else 0
            total_paginas = max(1, (total_registros + por_pagina - 1) // por_pagina)
            colunas = self.get_colunas_produto() if dados else []
            
            return {
                'dados': dados,
                'colunas': colunas,
                'pagina_atual': pagina,
                'por_pagina': por_pagina,
                'total_registros': total_registros,
                'total_paginas': total_paginas
            }
            
        except Exception as e:
            self.log.error(f"Erro no model: {str(e)}")
            raise
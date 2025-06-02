from typing import Any, Dict
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

    def adicionar(self, dados_produto: Dict[str, Any]) -> bool:
        """Adiciona um novo produto ao banco de dados"""
        try:
            query = """
            INSERT INTO produtos (nome, descricao, preco, quantidade, tipo)
            VALUES (%s, %s, %s, %s, %s)
            """
            # Dados do produto que serão inseridos
            produto_data = (
                dados_produto["nome"],
                dados_produto["descricao"],
                dados_produto["preco"],
                dados_produto["quantidade"],
                dados_produto["tipo"]
            )

            # Executa a query para inserção do produto
            self.database.execute_query(query, produto_data)
            
            self.log.info(f"Produto '{dados_produto['nome']}' adicionado com sucesso.")
            self.database.commit()  # <-- Adicione esta linha
            self.log.info(f"Produto '{dados_produto['nome']}' adicionado com sucesso.")
            return True  # Produto adicionado com sucesso
        
        except Exception as e:
            self.log.error(f"Erro ao adicionar produto: {e}")
            return False  # Caso de erro na inserção
    def atualizar(self, id_produto: int, dados_produto: Dict[str, Any]) -> bool:
        """Atualiza um produto existente no banco de dados"""
        try:
            query = """
            UPDATE produtos
            SET nome = %s, descricao = %s, preco = %s, quantidade = %s, tipo = %s
            WHERE id = %s
            """
            # Dados do produto que serão atualizados
            produto_data = (
                dados_produto["nome"],
                dados_produto["descricao"],
                dados_produto["preco"],
                dados_produto["quantidade"],
                dados_produto["tipo"],
                id_produto
            )

            # Executa a query para atualização do produto
            self.database.execute_query(query, produto_data)
            
            self.log.info(f"Produto com ID {id_produto} atualizado com sucesso.")
            self.database.commit()  # <-- Adicione esta linha
            return True  # Produto atualizado com sucesso
        
        except Exception as e:
            self.log.error(f"Erro ao atualizar produto: {e}")
            return False  # Caso de erro na atualização
    def excluir(self, id_produto: int) -> bool:
        """Exclui um produto do banco de dados"""
        try:
            query = "DELETE FROM produtos WHERE id = %s"
            # Executa a query para exclusão do produto
            self.database.execute_query(query, (id_produto,))
            
            self.log.info(f"Produto com ID {id_produto} excluído com sucesso.")
            self.database.commit()  # <-- Adicione esta linha
            return True  # Produto excluído com sucesso
        
        except Exception as e:
            self.log.error(f"Erro ao excluir produto: {e}")
            return False
    def buscar_por_id(self, id_produto: int) -> Produto:
        """Busca um produto pelo ID"""
        try:
            query = "SELECT * FROM produtos WHERE id = %s"
            resultado = self.database.fetch_data(query, (id_produto,))
            
            if not resultado:
                self.log.error(f"Produto com ID {id_produto} não encontrado.")
                return None
            
            row = resultado[0]
            produto = Produto(
                id=row["id"],
                nome=row["nome"],
                descricao=row["descricao"],
                preco=row["preco"],
                quantidade=row["quantidade"],
                tipo=row["tipo"]
            )
            self.log.info(f"Produto encontrado: {produto.nome}")
            return produto
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produto por ID: {e}")
            return None
    def buscar_por_nome(self, nome_produto: str) -> Produto:
        """Busca um produto pelo nome"""
        try:
            query = "SELECT * FROM produtos WHERE nome LIKE %s"
            resultado = self.database.fetch_data(query, (f"%{nome_produto}%",))
            
            if not resultado:
                self.log.error(f"Nenhum produto encontrado com o nome '{nome_produto}'.")
                return None
            
            row = resultado[0]
            produto = Produto(
                id=row["id"],
                nome=row["nome"],
                descricao=row["descricao"],
                preco=row["preco"],
                quantidade=row["quantidade"],
                tipo=row["tipo"]
            )
            self.log.info(f"Produto encontrado: {produto.nome}")
            return produto
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produto por nome: {e}")
            return None
    def buscar_por_tipo(self, tipo_produto: str) -> list:
        """Busca produtos pelo tipo"""
        try:
            query = "SELECT * FROM produtos WHERE tipo = %s"
            resultados = self.database.fetch_data(query, (tipo_produto,))
            
            if not resultados:
                self.log.error(f"Nenhum produto encontrado do tipo '{tipo_produto}'.")
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
            self.log.info(f"{len(produtos)} produtos encontrados do tipo '{tipo_produto}'.")
            return produtos
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produtos por tipo: {e}")
            return []
    def buscar_por_preco(self, preco_min: float, preco_max: float) -> list:
        """Busca produtos por faixa de preço"""
        try:
            query = "SELECT * FROM produtos WHERE preco BETWEEN %s AND %s"
            resultados = self.database.fetch_data(query, (preco_min, preco_max))
            
            if not resultados:
                self.log.error(f"Nenhum produto encontrado entre {preco_min} e {preco_max}.")
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
            self.log.info(f"{len(produtos)} produtos encontrados na faixa de preço.")
            return produtos
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produtos por faixa de preço: {e}")
            return []
    def buscar_por_quantidade(self, quantidade_min: int, quantidade_max: int) -> list:
        """Busca produtos por faixa de quantidade"""
        try:
            query = "SELECT * FROM produtos WHERE quantidade BETWEEN %s AND %s"
            resultados = self.database.fetch_data(query, (quantidade_min, quantidade_max))
            
            if not resultados:
                self.log.error(f"Nenhum produto encontrado entre {quantidade_min} e {quantidade_max}.")
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
            self.log.info(f"{len(produtos)} produtos encontrados na faixa de quantidade.")
            return produtos
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produtos por faixa de quantidade: {e}")
            return []
    def buscar_por_filtros(self, filtros: Dict[str, Any]) -> list:
        """Busca produtos com base em múltiplos filtros"""
        try:
            query = "SELECT * FROM produtos WHERE "
            conditions = []
            params = []

            for campo, valor in filtros.items():
                if not campo.replace("_", "").isalnum():
                    continue  # Ignora campos inválidos
                
                if isinstance(valor, str):
                    conditions.append(f"{campo} LIKE %s")
                    params.append(f"%{valor}%")  # Busca por substring
                else:
                    conditions.append(f"{campo} = %s")
                    params.append(valor)
            
            if not conditions:
                self.log.error("Nenhum filtro válido fornecido.")
                return []

            query += " AND ".join(conditions)
            resultados = self.database.fetch_data(query, tuple(params))
            
            if not resultados:
                self.log.error("Nenhum produto encontrado com os filtros fornecidos.")
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
            self.log.info(f"{len(produtos)} produtos encontrados com os filtros fornecidos.")
            return produtos
        
        except Exception as e:
            self.log.error(f"Erro ao buscar produtos por filtros: {e}")
            return []
    def commit(self):
        """Commit das alterações no banco de dados"""
        try:
            self.database.commit()
            self.log.info("Alterações commitadas com sucesso.")
            return True
        except Exception as e:
            self.log.error(f"Erro ao realizar commit: {e}")
            return False
    def close(self):
        """Fecha a conexão com o banco de dados"""
        try:
            self.database.close()
            self.log.info("Conexão com o banco de dados fechada.")
        except Exception as e:
            self.log.error(f"Erro ao fechar a conexão: {e}")
    def __del__(self):
        """Garante que a conexão seja fechada ao destruir o objeto"""
        try:
            self.close()
            self.log.info("EstoqueModel destruído e conexão fechada.")
        except Exception as e:
            self.log.error(f"Erro ao destruir EstoqueModel: {e}")

import inspect
from typing import Optional, Tuple, List, Union
from database.db import Database
from config.logger_config import ConfigurarLogger
from models.produto import Produto

logger = ConfigurarLogger.configurar("ProdutoController", log_em_arquivo=True)

class ProdutoController:
    @staticmethod
    def _executar_query(query: str, valores: tuple, operacao: str) -> Tuple[bool, str]:
        """Método genérico para execução de queries no banco."""
        try:
            with Database() as db:
                if db.execute_query(query, valores):
                    logger.info(f"✅ {operacao} realizado com sucesso")
                    return True, f"{operacao} realizado com sucesso"
                logger.error(f"❌ Falha ao {operacao}")
                return False, f"Falha ao {operacao}"
        except Exception as e:
            logger.error(f"Erro durante {operacao}: {str(e)}", exc_info=True)
            return False, str(e)

    @staticmethod
    def _processar_produto(dados: dict, operacao: str) -> Tuple[bool, str]:
        """Método genérico para processamento de produtos."""
        try:
            produto = Produto(**dados)
            return True, produto
        except ValueError as e:
            logger.error(f"Erro de validação: {str(e)}")
            return False, str(e)
        except Exception as e:
            logger.error(f"Erro inesperado: {str(e)}")
            return False, "Erro interno no processamento do produto"

    @staticmethod
    def cadastrar_produto(dados: dict) -> Tuple[bool, str]:
        """Cadastra um novo produto usando dados brutos."""
        resultado, produto = ProdutoController._processar_produto(dados, "cadastro")
        if not resultado:
            return False, produto
        
        query = """
            INSERT INTO produtos (nome, descricao, preco, quantidade, tipo) 
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = (
            produto.nome, produto.descricao, 
            produto.preco, produto.quantidade, produto.tipo
        )
        return ProdutoController._executar_query(query, valores, "Cadastro de produto")

    @staticmethod
    def editar_produto(dados: dict) -> Tuple[bool, str]:
        """Atualiza um produto existente usando dados brutos."""
        resultado, produto = ProdutoController._processar_produto(dados, "edição")
        if not resultado:
            return False, produto
        
        query = """
            UPDATE produtos
            SET nome=%s, descricao=%s, preco=%s, quantidade=%s, tipo=%s
            WHERE id=%s
        """
        valores = (
            produto.nome, produto.descricao, produto.preco,
            produto.quantidade, produto.tipo, produto.id
        )
        return ProdutoController._executar_query(query, valores, "Edição de produto")

    @staticmethod
    def listar_produtos_paginados(
        pagina: int = 1,
        por_pagina: int = 20,
        coluna_ordenacao: str = "id",
        ordem_crescente: bool = True
    ) -> Tuple[List[Produto], dict]:
        
        offset = (pagina - 1) * por_pagina
        ordem = "ASC" if ordem_crescente else "DESC"
        
        # Mapeamento seguro de colunas
        colunas_validas = {
            "id": "id",
            "nome": "nome",
            "preco": "preco",
            "quantidade": "quantidade",
            "tipo": "tipo"
        }
        
        coluna_ordenacao = colunas_validas.get(coluna_ordenacao.lower(), "id")
        
        query = f"""
            SELECT id, nome, descricao, preco, quantidade, tipo 
            FROM produtos
            ORDER BY {coluna_ordenacao} {ordem}
            LIMIT %s OFFSET %s
        """
        
        count_query = "SELECT COUNT(*) as total FROM produtos"
        
        with Database() as db:
            try:
                produtos = []
                total = 0
                
                resultados = db.fetch_data(query, (por_pagina, offset))
                if resultados:
                    produtos = [Produto(**produto) for produto in resultados]
                
                total_result = db.fetch_data(count_query)
                total = total_result[0]['total'] if total_result else 0
                
                total_paginas = (total + por_pagina - 1) // por_pagina if por_pagina > 0 else 0
                
                return produtos, {
                    'pagina_atual': pagina,
                    'por_pagina': por_pagina,
                    'total_itens': total,
                    'total_paginas': total_paginas,
                    'tem_proxima': pagina < total_paginas,
                    'tem_anterior': pagina > 1
                }
                
            except Exception as e:
                logger.error(f"Erro ao listar produtos: {str(e)}", exc_info=True)
                return [], {
                    'pagina_atual': 1,
                    'por_pagina': por_pagina,
                    'total_itens': 0,
                    'total_paginas': 0,
                    'tem_proxima': False,
                    'tem_anterior': False
                }

    @staticmethod
    def obter_produto_por_id(produto_id: int) -> Optional[Produto]:
        """Obtém um único produto pelo ID."""
        query = "SELECT * FROM produtos WHERE id=%s"
        with Database() as db:
            resultado = db.fetch_data(query, (produto_id,))
            return Produto(**resultado[0]) if resultado else None

    @staticmethod
    def buscar_produto(termo: str) -> list[Produto]:

        """Busca unificada por ID ou nome SEMPRE retornando lista."""
        termo = termo.strip() if termo else ''
        
        if not termo:
            return []
        
        try:
            if termo.isdigit():
                produto = ProdutoController.obter_produto_por_id(int(termo))
                return [produto] if produto else []
            
            query = "SELECT * FROM produtos WHERE nome LIKE %s"
            parametro = f"%{termo}%"
            
            with Database() as db:
                resultados = db.fetch_data(query, (parametro,))
                return [Produto(**row) for row in resultados] if resultados else []
                
        except Exception as e:
            logger.error(f"Erro na busca: {str(e)}", exc_info=True)
            return []

    @staticmethod
    def deletar_produto(produto_id: int) -> bool:
        """Exclusão de produto simplificada."""
        query = "DELETE FROM produtos WHERE id=%s"
        with Database() as db:
            return db.execute_query(query, (produto_id,))
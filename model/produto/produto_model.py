from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from database.db import Database


class ProdutoModel:
    """
    Responsável por CRUD e consultas avançadas na tabela `produtos`.
    Gerencia todas as operações relacionadas a produtos, incluindo:
    - Cadastro básico de produtos
    - Consultas com filtros avançados
    - Controle de estoque e preços
    - Relacionamentos com categorias e unidades de medida
    """
    # Campos obrigatórios para criação
    CAMPOS_OBRIGATORIOS = ['nome', 'unidade_medida_id', 'categoria_id']
    
    # Campos permitidos para criação/atualização
    CAMPOS_PERMITIDOS = [
        'nome', 'descricao', 'codigo_barras', 'categoria_id',
        'unidade_medida_id', 'custo_unitario', 'estoque_minimo', 'ativo'
    ]

    def __init__(self, db: Database):
        self.db = db

    def listar_paginado(
        self,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: Optional[str] = None,
        filtros: Optional[Dict[str, Any]] = None,
        apenas_ativos: bool = True
    ) -> Dict[str, Any]:
        """
        Lista produtos com paginação e filtros avançados
        
        Args:
            pagina: Número da página
            por_pagina: Itens por página
            ordenar_por: Campo para ordenação (opcional)
            filtros: Dicionário com filtros (ex: {'nome': 'leite', 'categoria_id': 1})
            apenas_ativos: Se True, lista apenas produtos ativos
            
        Returns:
            Dicionário com dados paginados e metadados
        """
        sql = """
            SELECT p.*, 
                   cp.nome AS categoria_nome,
                   um.nome AS unidade_medida_nome,
                   um.simbolo AS unidade_medida_simbolo
            FROM produtos p
            LEFT JOIN categorias_produto cp ON p.categoria_id = cp.id
            LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
        """
        where_clauses = []
        params: List[Any] = []
        
        # Filtro de status ativo
        if apenas_ativos:
            where_clauses.append("p.ativo = 1")
        
        # Aplica filtros se fornecidos
        if filtros:
            for campo, valor in filtros.items():
                if campo in self.CAMPOS_PERMITIDOS:
                    if isinstance(valor, str):
                        where_clauses.append(f"p.{campo} LIKE %s")
                        params.append(f"%{valor}%")
                    else:
                        where_clauses.append(f"p.{campo} = %s")
                        params.append(valor)
        
        # Monta WHERE se houver filtros
        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)
        
        # Ordenação
        if ordenar_por and ordenar_por in self.CAMPOS_PERMITIDOS:
            sql += f" ORDER BY p.{ordenar_por}"
        
        # Paginação
        offset = (pagina - 1) * por_pagina
        sql += " LIMIT %s OFFSET %s"
        params.extend([por_pagina, offset])

        # Executa query principal
        rows, colunas = self.db.fetch_all(sql, tuple(params),return_columns=True)

        
        # Query para contar total (sem paginação)
        count_sql = "SELECT COUNT(*) FROM produtos p"
        if where_clauses:
            count_sql += " WHERE " + " AND ".join(where_clauses)

        total = self.db.fetch_scalar(count_sql)
        
        return {
            "dados": rows,
            "pagina_atual": pagina,
            "por_pagina": por_pagina,
            "total_itens": total,
            "total_paginas": (total + por_pagina - 1) // por_pagina,
            "colunas": colunas if rows else []
        }

    def obter_por_id(self, produto_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtém um produto completo por ID, incluindo informações relacionadas
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Dicionário com dados do produto ou None se não encontrado
        """
        sql = """
            SELECT p.*, 
                   cp.nome AS categoria_nome,
                   um.nome AS unidade_medida_nome,
                   um.simbolo AS unidade_medida_simbolo
            FROM produtos p
            LEFT JOIN categorias_produto cp ON p.categoria_id = cp.id
            LEFT JOIN unidades_medida um ON p.unidade_medida_id = um.id
            WHERE p.id = %s
        """
        result = self.db.fetch_all(sql, (produto_id,))
        return result[0] if result else None

    def criar(self, dados: Dict[str, Any]) -> Tuple[int, str]:
        """
        Cria um novo produto com validação de dados
        
        Args:
            dados: Dicionário com campos do produto
            
        Returns:
            Tupla com (ID do novo produto, mensagem de status)
            
        Raises:
            ValueError: Se campos obrigatórios estiverem faltando
        """
        # Valida campos obrigatórios
        faltantes = [campo for campo in self.CAMPOS_OBRIGATORIOS if campo not in dados]
        if faltantes:
            raise ValueError(f"Campos obrigatórios faltantes: {', '.join(faltantes)}")
        
        # Filtra apenas campos permitidos
        dados_filtrados = {
            k: v for k, v in dados.items() 
            if k in self.CAMPOS_PERMITIDOS
        }
        
        # Adiciona data de cadastro
        dados_filtrados['data_cadastro'] = datetime.now()
        
        # Prepara SQL
        cols = dados_filtrados.keys()
        placeholders = ["%s"] * len(cols)
        sql = f"""
            INSERT INTO produtos ({', '.join(cols)}) 
            VALUES ({', '.join(placeholders)})
        """
        
        # Executa e retorna ID
        novo_id = self.db.fetch_all(sql, tuple(dados_filtrados.values()))
        return (novo_id, "Produto criado com sucesso")

    def atualizar(self, produto_id: int, dados: Dict[str, Any]) -> bool:
        """
        Atualiza um produto existente
        
        Args:
            produto_id: ID do produto a ser atualizado
            dados: Dicionário com campos a serem atualizados
            
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        # Filtra apenas campos permitidos
        dados_filtrados = {
            k: v for k, v in dados.items() 
            if k in self.CAMPOS_PERMITIDOS
        }
        
        if not dados_filtrados:
            return False
            
        # Prepara SQL
        assignments = [f"{k} = %s" for k in dados_filtrados.keys()]
        params = list(dados_filtrados.values())
        params.append(produto_id)
        
        sql = f"""
            UPDATE produtos 
            SET {', '.join(assignments)}
            WHERE id = %s
        """
        
        return self.db.fetch_all(sql, tuple(params)) > 0

    def excluir(self, produto_id: int) -> bool:
        """
        Marca um produto como inativo (exclusão lógica)
        
        Args:
            produto_id: ID do produto
            
        Returns:
            True se atualizado com sucesso, False caso contrário
        """
        sql = "UPDATE produtos SET ativo = 0 WHERE id = %s"
        return self.db.fetch_all(sql, (produto_id,)) > 0

    def obter_historico_precos(self, produto_id: int) -> List[Dict[str, Any]]:
        """
        Obtém o histórico de preços de um produto
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Lista de dicionários com histórico de preços
        """
        sql = """
            SELECT preco, data_registro, fonte
            FROM precos_produtos
            WHERE produto_id = %s
            ORDER BY data_registro DESC
        """
        return self.db.fetch_all(sql, (produto_id,))

    def obter_movimentacoes_estoque(self, produto_id: int, limite: int = 100) -> List[Dict[str, Any]]:
        """
        Obtém as últimas movimentações de estoque do produto
        
        Args:
            produto_id: ID do produto
            limite: Quantidade máxima de registros a retornar
            
        Returns:
            Lista de dicionários com movimentações de estoque
        """
        sql = """
            SELECT quantidade, tipo, origem, data_registro, custo_unitario, observacoes
            FROM movimentacoes_estoque
            WHERE produto_id = %s
            ORDER BY data_registro DESC
            LIMIT %s
        """
        return self.db.fetch_all(sql, (produto_id, limite))

    def calcular_estoque_atual(self, produto_id: int) -> float:
        """
        Calcula o estoque atual do produto somando todas as movimentações
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Quantidade total em estoque
        """
        sql = """
            SELECT COALESCE(SUM(
                CASE WHEN tipo = 'entrada' THEN quantidade 
                ELSE -quantidade END
            ), 0) AS estoque_atual
            FROM movimentacoes_estoque
            WHERE produto_id = %s
        """
        result = self.db.fetch_all(sql, (produto_id,))
        return result[0]['estoque_atual'] if result else 0.0
    
    def listar_todos_dados_produtos(self) -> List[Dict[str, Any]]:
        """
        Retorna uma lista de produtos com seus respectivos nomes,
        nomes de unidade de medida e seus símbolos.
        
        Returns:
            Lista de dicionários com 'produto_nome', 'unidade_medida_nome' e 'unidade_simbolo'.
        """
        sql = """
            SELECT 
            p.id,
            p.nome AS nome_produto,
            p.descricao,
            p.codigo_barras,
            p.custo_unitario,
            p.estoque_minimo,
            p.data_cadastro,
            p.ativo,

            c.id AS categoria_id,
            c.nome AS categoria_nome,

            u.id AS unidade_id,
            u.nome AS unidade_nome

        FROM produtos p
        LEFT JOIN categorias_receita c ON p.categoria_id = c.id
        LEFT JOIN unidades_medida u ON p.unidade_medida_id = u.id
        LIMIT 0, 1000;


        """
        return self.db.fetch_all(sql)

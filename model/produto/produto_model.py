from typing import Any, Dict, List, Optional
from datetime import datetime
from database.db import Database
from util.retornos import Retorno


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
            filtros: Dicionário com filtros
            apenas_ativos: Se True, lista apenas produtos ativos
            
        Returns:
            Dicionário padronizado com dados paginados ou erro
        """
        try:
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
            rows, colunas = self.db.fetch_all(sql, tuple(params), return_columns=True)
            
            # Query para contar total (sem paginação)
            count_sql = "SELECT COUNT(*) FROM produtos p"
            if where_clauses:
                count_sql += " WHERE " + " AND ".join(where_clauses)

            total = self.db.fetch_scalar(count_sql)
            
            dados = {
                "itens": rows,
                "pagina": pagina,
                "por_pagina": por_pagina,
                "total_registros": total,
                "total_paginas": (total + por_pagina - 1) // por_pagina,
                "colunas": colunas if rows else []
            }
            
            return Retorno.paginado(
                itens=rows,
                pagina=pagina,
                por_pagina=por_pagina,
                total_registros=total,
                mensagem="Produtos listados com sucesso"
            )
            
        except Exception as e:
            return Retorno.erro(f"Erro ao listar produtos paginados: {str(e)}")

    def obter_por_id(self, produto_id: int) -> Dict[str, Any]:
        """
        Obtém um produto completo por ID, incluindo informações relacionadas
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Dicionário padronizado com dados do produto ou erro
        """
        try:
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
            
            if not result:
                return Retorno.nao_encontrado(f"Produto ID {produto_id} não encontrado")
                
            return Retorno.sucesso("Produto encontrado com sucesso", result[0])
            
        except Exception as e:
            return Retorno.erro(f"Erro ao obter produto por ID: {str(e)}")

    def criar(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um novo produto com validação de dados
        
        Args:
            dados: Dicionário com campos do produto
            
        Returns:
            Dicionário padronizado com ID do novo produto ou erro
        """
        try:
            # Valida campos obrigatórios
            faltantes = [campo for campo in self.CAMPOS_OBRIGATORIOS if campo not in dados]
            if faltantes:
                return Retorno.dados_invalidos(f"Campos obrigatórios faltantes: {', '.join(faltantes)}")
            
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
            novo_id = self.db.execute(sql, tuple(dados_filtrados.values()), return_lastrowid=True)
            
            if not novo_id:
                return Retorno.erro("Falha ao criar produto")
                
            return Retorno.sucesso("Produto criado com sucesso", {"produto_id": novo_id})
            
        except Exception as e:
            return Retorno.erro(f"Erro ao criar produto: {str(e)}")

    def atualizar(self, produto_id: int, dados: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza um produto existente
        
        Args:
            produto_id: ID do produto a ser atualizado
            dados: Dicionário com campos a serem atualizados
            
        Returns:
            Dicionário padronizado indicando sucesso ou erro
        """
        try:
            # Filtra apenas campos permitidos
            dados_filtrados = {
                k: v for k, v in dados.items() 
                if k in self.CAMPOS_PERMITIDOS
            }
            
            if not dados_filtrados:
                return Retorno.dados_invalidos("Nenhum dado válido fornecido para atualização")
                
            # Prepara SQL
            assignments = [f"{k} = %s" for k in dados_filtrados.keys()]
            params = list(dados_filtrados.values())
            params.append(produto_id)
            
            sql = f"""
                UPDATE produtos 
                SET {', '.join(assignments)}
                WHERE id = %s
            """
            
            linhas_afetadas = self.db.execute(sql, tuple(params))
            
            if linhas_afetadas > 0:
                return Retorno.sucesso("Produto atualizado com sucesso")
            return Retorno.erro("Nenhum produto foi atualizado")
            
        except Exception as e:
            return Retorno.erro(f"Erro ao atualizar produto: {str(e)}")

    def excluir(self, produto_id: int) -> Dict[str, Any]:
        """
        Marca um produto como inativo (exclusão lógica)
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Dicionário padronizado indicando sucesso ou erro
        """
        try:
            sql = "UPDATE produtos SET ativo = 0 WHERE id = %s"
            linhas_afetadas = self.db.execute(sql, (produto_id,))
            
            if linhas_afetadas > 0:
                return Retorno.sucesso("Produto marcado como inativo com sucesso")
            return Retorno.nao_encontrado(f"Produto ID {produto_id} não encontrado")
            
        except Exception as e:
            return Retorno.erro(f"Erro ao excluir produto: {str(e)}")

    def obter_historico_precos(self, produto_id: int) -> Dict[str, Any]:
        """
        Obtém o histórico de preços de um produto
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Dicionário padronizado com histórico de preços ou erro
        """
        try:
            sql = """
                SELECT preco, data_registro, fonte
                FROM precos_produtos
                WHERE produto_id = %s
                ORDER BY data_registro DESC
            """
            historico = self.db.fetch_all(sql, (produto_id,))
            
            return Retorno.sucesso("Histórico de preços obtido com sucesso", historico)
            
        except Exception as e:
            return Retorno.erro(f"Erro ao obter histórico de preços: {str(e)}")

    def obter_movimentacoes_estoque(self, produto_id: int, limite: int = 100) -> Dict[str, Any]:
        """
        Obtém as últimas movimentações de estoque do produto
        
        Args:
            produto_id: ID do produto
            limite: Quantidade máxima de registros a retornar
            
        Returns:
            Dicionário padronizado com movimentações de estoque ou erro
        """
        try:
            sql = """
                SELECT quantidade, tipo, origem, data_registro, custo_unitario, observacoes
                FROM movimentacoes_estoque
                WHERE produto_id = %s
                ORDER BY data_registro DESC
                LIMIT %s
            """
            movimentacoes = self.db.fetch_all(sql, (produto_id, limite))
            
            return Retorno.sucesso("Movimentações de estoque obtidas com sucesso", movimentacoes)
            
        except Exception as e:
            return Retorno.erro(f"Erro ao obter movimentações de estoque: {str(e)}")

    def calcular_estoque_atual(self, produto_id: int) -> Dict[str, Any]:
        """
        Calcula o estoque atual do produto somando todas as movimentações
        
        Args:
            produto_id: ID do produto
            
        Returns:
            Dicionário padronizado com estoque atual ou erro
        """
        try:
            sql = """
                SELECT COALESCE(SUM(
                    CASE WHEN tipo = 'entrada' THEN quantidade 
                    ELSE -quantidade END
                ), 0) AS estoque_atual
                FROM movimentacoes_estoque
                WHERE produto_id = %s
            """
            result = self.db.fetch_all(sql, (produto_id,))
            estoque = result[0]['estoque_atual'] if result else 0.0
            
            return Retorno.sucesso("Estoque calculado com sucesso", {"estoque_atual": estoque})
            
        except Exception as e:
            return Retorno.erro(f"Erro ao calcular estoque: {str(e)}")
    
    def listar_todos_dados_produtos(self) -> Dict[str, Any]:
        """
        Retorna uma lista de produtos com seus respectivos nomes,
        nomes de unidade de medida e seus símbolos.
        
        Returns:
            Dicionário padronizado com lista de produtos ou erro
        """
        try:
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
                u.nome AS unidade_nome,
                u.simbolo AS unidade_simbolo

            FROM produtos p
            LEFT JOIN categorias_receita c ON p.categoria_id = c.id
            LEFT JOIN unidades_medida u ON p.unidade_medida_id = u.id
            LIMIT 0, 1000;
            """
            produtos = self.db.fetch_all(sql)
            
            return Retorno.sucesso("Produtos listados com sucesso", produtos)
            
        except Exception as e:
            return Retorno.erro(f"Erro ao listar produtos: {str(e)}")
from pymysql import Error
from database.db import Database
from logs.logger import Logger
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime

class ReceitasModel:
    """Modelo responsável por todas as operações de banco de dados relacionadas a receitas"""
    
    def __init__(self, db: Database, logger: Logger):
        """
        Inicializa o modelo com as dependências necessárias
        
        Args:
            db: Instância do banco de dados (injeção de dependência)
            logger: Instância do logger (injeção de dependência)
        """
        self.db = db
        self.log = logger
        self.log.info("ReceitasModel inicializado")

    def buscar_receitas_paginadas(
        self,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: Optional[str] = None,
        filtros: Optional[Dict] = None,
        direcao: str = 'ASC'
    ) -> Tuple[Dict[str, Any], Optional[str]]:
        """
        Busca receitas paginadas do banco de dados
        
        Args:
            pagina: Número da página
            por_pagina: Itens por página
            ordenar_por: Campo para ordenação
            filtros: Dicionário de filtros
            direcao: Direção da ordenação (ASC/DESC)
            
        Returns:
            Tuple[dict, Optional[str]]: (dados, erro) onde erro é None se bem-sucedido
        """
        try:
            # Query principal
            query = """
                SELECT 
                    r.id,
                    r.nome AS nome_receita,
                    r.descricao AS descricao_receita,
                    r.modo_preparo,
                    r.tempo_preparo,
                    r.rendimento,
                    r.dificuldade,
                    r.custo_estimado,
                    cr.nome AS categoria,
                    um.simbolo AS unidade_rendimento
                FROM receitas r
                LEFT JOIN categorias_receita cr ON r.categoria_id = cr.id
                LEFT JOIN unidades_medida um ON r.unidade_medida_id = um.id
            """
            
            # Query para contagem
            count_query = "SELECT COUNT(*) AS total FROM receitas r"
            
            conditions = []
            params = []
            
            # Aplicação de filtros
            if filtros:
                for campo, valor in filtros.items():
                    if campo == 'search':
                        conditions.append("(r.nome LIKE %s OR r.descricao LIKE %s)")
                        params.extend([f"%{valor}%", f"%{valor}%"])
                    elif campo == 'categoria_id':
                        conditions.append("r.categoria_id = %s")
                        params.append(valor)
                    elif campo == 'dificuldade':
                        conditions.append("r.dificuldade = %s")
                        params.append(valor.lower())
                    elif campo == 'tempo_maximo':
                        conditions.append("r.tempo_preparo <= %s")
                        params.append(valor)

            # Adiciona condições às queries
            if conditions:
                where_clause = " WHERE " + " AND ".join(conditions)
                query += where_clause
                count_query += where_clause

            # Ordenação
            colunas_validas = {"id", "nome", "tempo_preparo", "dificuldade", "custo_estimado"}
            if ordenar_por and ordenar_por in colunas_validas:
                direcao = 'DESC' if direcao.upper() == 'DESC' else 'ASC'
                query += f" ORDER BY r.{ordenar_por} {direcao}"
            else:
                query += " ORDER BY r.nome ASC"

            # Paginação
            offset = (pagina - 1) * por_pagina
            query += f" LIMIT {por_pagina} OFFSET {offset}"

            # Execução das queries
            dados = self.db.fetch_all(query, tuple(params))
            total_result = self.db.fetch_all(count_query, tuple(params))
            total_registros = total_result[0]['total'] if total_result else 0


            for receita in dados:
                receita['ingredientes'] = self._buscar_ingredientes_receita(receita['id'])

            self.log.info(f"{len(dados)} receitas encontradas na página {pagina}")

            return {
                'dados': dados,
                'pagina': pagina,
                'por_pagina': por_pagina,
                'total_registros': total_registros,
                'total_paginas': max(1, (total_registros + por_pagina - 1) // por_pagina)
            }

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas: {str(e)}")
            return {}, str(e)

    def buscar_receita_completa(self, receita_id: int) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Busca uma receita com todos seus detalhes
        
        Args:
            receita_id: ID da receita a ser buscada
            
        Returns:
            Tuple[Optional[dict], Optional[str]]: (receita, erro) onde erro é None se bem-sucedido
        """
        try:
            # Query para dados básicos
            query = """
                SELECT 
                    r.*,
                    cr.nome AS categoria_nome,
                    um.simbolo AS unidade_rendimento_simbolo
                FROM receitas r
                LEFT JOIN categorias_receita cr ON r.categoria_id = cr.id
                LEFT JOIN unidades_medida um ON r.unidade_medida_id = um.id
                WHERE r.id = %s
            """
            receitas = self.db.fetch_all(query, (receita_id,))
            
            if not receitas:
                return None, f"Receita ID {receita_id} não encontrada"
                
            receita = receitas[0]
            return receita, None
            
        except Exception as e:
            self.log.error(f"Erro ao buscar receita por ID: {str(e)}")
            return None, str(e)

    def _buscar_ingredientes_receita(self, receita_id: int) -> Tuple[List[Dict], Optional[str]]:
        """
        Busca os ingredientes de uma receita específica
        
        Args:
            receita_id: ID da receita
            
        Returns:
            Tuple[list, Optional[str]]: (ingredientes, erro) onde erro é None se bem-sucedido
        """
        try:
            query = """
                SELECT 
                    p.id,
                    p.nome,
                    rp.quantidade,
                    um.simbolo AS unidade_medida,
                    p.custo_unitario,
                    (rp.quantidade * p.custo_unitario) AS custo_total
                FROM receitas_produtos rp
                JOIN produtos p ON rp.produto_id = p.id
                JOIN unidades_medida um ON rp.unidade_medida_id = um.id
                WHERE rp.receita_id = %s
            """
            ingredientes = self.db.fetch_all(query, (receita_id,))
            return ingredientes
        
        except Exception as e:
            self.log.error(f"Erro ao buscar ingredientes: {str(e)}")
            return [], str(e)

    def inserir_receita(self, dados: Dict) -> Tuple[Optional[int], Optional[str]]:
        self.log.info(f'\n DADOS A SEREM INSERIDO NO DB {dados}')


        """
        Insere uma nova receita no banco de dados
        
        Args:
            dados: Dicionário com os dados da receita
            
        Returns:
            Tuple[Optional[int], Optional[str]]: (receita_id, erro) onde erro é None se bem-sucedido
        """
        try:
            query = """
                INSERT INTO receitas (
                    nome, descricao, categoria_id, modo_preparo, tempo_preparo, rendimento, 
                    unidade_medida_id, dificuldade, data_cadastro, custo_estimado, calorias_por_porcao
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                dados['nome'],
                dados['descricao'],
                dados['categoria_id'],
                dados['modo_preparo'],
                dados['tempo_preparo'],
                dados['rendimento'],
                dados['unidade_medida_id'],
                dados['dificuldade'],
                dados.get('data_cadastro', datetime.now()),
                dados.get('custo_estimado'),
                dados.get('calorias_por_porcao', 0)
            )
            
            receita_id = self.db.execute(query, params, return_lastrowid=True)
            
            return receita_id, None
            
        except Exception as e:
            self.log.error(f"Erro ao inserir receita: {str(e)}")
            return None, str(e)

    def inserir_ingrediente(self, receita_id: int, ingrediente: Dict) -> Tuple[bool, Optional[str]]:
        """
        Insere um ingrediente para uma receita
        
        Args:
            receita_id: ID da receita
            ingrediente: Dicionário com dados do ingrediente
            
        Returns:
            Tuple[bool, Optional[str]]: (sucesso, erro) onde erro é None se bem-sucedido
        """
        try:
            query = """
                INSERT INTO receitas_produtos (
                    receita_id, produto_id, quantidade, unidade_medida_id
                ) VALUES (%s, %s, %s, %s)
            """
            params = (
                receita_id,
                ingrediente['produto_id'],
                ingrediente['quantidade'],
                ingrediente['unidade_medida_id']
            )
            success = self.db.execute(query, params) > 0
            return success, None
        except Exception as e:
            self.log.error(f"Erro ao inserir ingrediente: {str(e)}")
            return False, str(e)

    def atualizar_custo_receita(self, receita_id: int) -> Tuple[bool, Optional[str]]:
        """
        Atualiza o custo estimado de uma receita
        
        Args:
            receita_id: ID da receita
            
        Returns:
            Tuple[bool, Optional[str]]: (sucesso, erro) onde erro é None se bem-sucedido
        """
        try:
            query = """
                UPDATE receitas r
                SET custo_estimado = (
                    SELECT SUM(rp.quantidade * p.custo_unitario)
                    FROM receitas_produtos rp
                    JOIN produtos p ON rp.produto_id = p.id
                    WHERE rp.receita_id = %s
                )
                WHERE r.id = %s
            """
            success = self.db.execute(query, (receita_id, receita_id)) > 0
            return success, None
        except Exception as e:
            self.log.error(f"Erro ao atualizar custo da receita: {str(e)}")
            return False, str(e)

    def atualizar_receita(self, receita_id: int, dados: Dict) -> Tuple[bool, Optional[str]]:
        """
        Atualiza os dados de uma receita existente
        
        Args:
            receita_id: ID da receita
            dados: Dicionário com os dados a serem atualizados
            
        Returns:
            Tuple[bool, Optional[str]]: (sucesso, erro) onde erro é None se bem-sucedido
        """
        try:
            # Construir a query dinamicamente baseada nos campos fornecidos
            campos = []
            params = []
            
            for campo, valor in dados.items():
                campos.append(f"{campo} = %s")
                params.append(valor)
            
            if not campos:
                return False, "Nenhum dado fornecido para atualização"
                
            query = f"UPDATE receitas SET {', '.join(campos)} WHERE id = %s"
            params.append(receita_id)
            
            success = self.db.execute(query, tuple(params)) > 0
            return success, None
            
        except Exception as e:
            self.log.error(f"Erro ao atualizar receita: {str(e)}")
            return False, str(e)

    def excluir_receita(self, receita_id: int) -> Tuple[bool, Optional[str]]:
        """
        Exclui uma receita do banco de dados
        
        Args:
            receita_id: ID da receita a ser excluída
            
        Returns:
            Tuple[bool, Optional[str]]: (sucesso, erro) onde erro é None se bem-sucedido
        """
        try:
            # Primeiro excluir os ingredientes associados
            query_delete_ingredientes = "DELETE FROM receitas_produtos WHERE receita_id = %s"
            self.db.execute(query_delete_ingredientes, (receita_id,))
            
            # Depois excluir a receita
            query_delete_receita = "DELETE FROM receitas WHERE id = %s"
            success = self.db.execute(query_delete_receita, (receita_id,)) > 0
            return success, None
            
        except Exception as e:
            self.log.error(f"Erro ao excluir receita: {str(e)}")
            return False, str(e)
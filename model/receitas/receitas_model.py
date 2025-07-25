from pymysql import Error
from database.db import Database
from logs.logger import Logger
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime

from util.retornos import Retorno

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
    ) -> Dict[str, Any]:
        """
        Busca receitas paginadas do banco de dados
        
        Args:
            pagina: Número da página
            por_pagina: Itens por página
            ordenar_por: Campo para ordenação
            filtros: Dicionário de filtros
            direcao: Direção da ordenação (ASC/DESC)
            
        Returns:
            Dict[str, Any]: Retorno padronizado com os dados ou erro
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
            
            return Retorno.sucesso(mensagem="",dados=dados)

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas: {str(e)}")
            return Retorno.erro(f"Erro ao buscar receitas: {str(e)}")

    def buscar_receita_completa(self, receita_id: int) -> Dict[str, Any]:
        """
        Busca uma receita com todos seus detalhes
        
        Args:
            receita_id: ID da receita a ser buscada
            
        Returns:
            Dict[str, Any]: Retorno padronizado com os dados ou erro
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
                return Retorno.nao_encontrado(f"Receita ID {receita_id} não encontrada")
                
            receita = receitas[0]
            receita['ingredientes'] = self._buscar_ingredientes_receita(receita_id)
            
            return Retorno.sucesso("Receita encontrada com sucesso", receita)
            
        except Exception as e:
            self.log.error(f"Erro ao buscar receita por ID: {str(e)}")
            return Retorno.erro(f"Erro ao buscar receita: {str(e)}")

    def _buscar_ingredientes_receita(self, receita_id: int) -> List[Dict]:
        """
        Busca os ingredientes de uma receita específica
        
        Args:
            receita_id: ID da receita
            
        Returns:
            List[Dict]: Lista de ingredientes ou lista vazia em caso de erro
        """
        try:
            query = """
                SELECT 
                    p.id,
                    p.nome AS nome_produto,
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
            return []

    def inserir_receita(self, dados: Dict) -> Dict[str, Any]:

        """
        Insere uma nova receita no banco de dados
        
        Args:
            dados: Dicionário com os dados da receita
            
        Returns:
            Dict[str, Any]: Retorno padronizado com o ID da receita ou erro
        """
        try:
            self.log.info(f'\n DADOS DA RECEITA A SEREM INSERIDO NO DB {dados}')

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
            
            if receita_id:
                return Retorno.sucesso("Receita criada com sucesso", {"receita_id": receita_id})
            return Retorno.erro("Falha ao inserir receita")
            
        except Exception as e:
            self.log.error(f"Erro ao inserir receita: {str(e)}")
            return Retorno.erro(f"Erro ao inserir receita: {str(e)}")

    def inserir_ingrediente(self, receita_id: int, ingrediente: Dict) -> Dict[str, Any]:
        """
        Insere um ingrediente para uma receita
        
        Args:
            receita_id: ID da receita
            ingrediente: Dicionário com dados do ingrediente
            
        Returns:
            Dict[str, Any]: Retorno padronizado indicando sucesso ou erro
        """
        try:
            self.log.info(f'\n\n DADOS DOS INGREDIENTES A SEREM INSERIDO NO DB {receita_id} - {ingrediente}\n')

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

            if success:
                return Retorno.sucesso("Ingrediente adicionado com sucesso")
            return Retorno.erro("Falha ao adicionar ingrediente")
            
        except Exception as e:
            self.log.error(f"Erro ao inserir ingrediente: {str(e)}")
            return Retorno.erro(f"Erro ao inserir ingrediente: {str(e)}")

    def atualizar_custo_receita(self, receita_id: int) -> Dict[str, Any]:
        """
        Atualiza o custo estimado de uma receita
        
        Args:
            receita_id: ID da receita
            
        Returns:
            Dict[str, Any]: Retorno padronizado indicando sucesso ou erro
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
            
            if success:
                return Retorno.sucesso("Custo da receita atualizado com sucesso")
            return Retorno.erro("Falha ao atualizar custo da receita")
            
        except Exception as e:
            self.log.error(f"Erro ao atualizar custo da receita: {str(e)}")
            return Retorno.erro(f"Erro ao atualizar custo da receita: {str(e)}")

    def atualizar_receita(self, receita_id: int, dados: Dict) -> Dict[str, Any]:
        """
        Atualiza os dados de uma receita existente
        
        Args:
            receita_id: ID da receita
            dados: Dicionário com os dados a serem atualizados
            
        Returns:
            Dict[str, Any]: Retorno padronizado indicando sucesso ou erro
        """
        try:
            # Construir a query dinamicamente baseada nos campos fornecidos
            campos = []
            params = []
            
            for campo, valor in dados.items():
                campos.append(f"{campo} = %s")
                params.append(valor)
            
            if not campos:
                return Retorno.dados_invalidos("Nenhum dado fornecido para atualização")
                
            query = f"UPDATE receitas SET {', '.join(campos)} WHERE id = %s"
            params.append(receita_id)
            
            success = self.db.execute(query, tuple(params)) > 0
            
            if success:
                return Retorno.sucesso("Receita atualizada com sucesso")
            return Retorno.erro("Falha ao atualizar receita")
            
        except Exception as e:
            self.log.error(f"Erro ao atualizar receita: {str(e)}")
            return Retorno.erro(f"Erro ao atualizar receita: {str(e)}")

    def excluir_receita(self, receita_id: int) -> Dict[str, Any]:
        """
        Exclui uma receita do banco de dados
        
        Args:
            receita_id: ID da receita a ser excluída
            
        Returns:
            Dict[str, Any]: Retorno padronizado indicando sucesso ou erro
        """
        try:
            # Primeiro excluir os ingredientes associados
            query_delete_ingredientes = "DELETE FROM receitas_produtos WHERE receita_id = %s"
            self.db.execute(query_delete_ingredientes, (receita_id,))
            
            # Depois excluir a receita
            query_delete_receita = "DELETE FROM receitas WHERE id = %s"
            success = self.db.execute(query_delete_receita, (receita_id,)) > 0
            
            if success:
                return Retorno.sucesso("Receita excluída com sucesso")
            return Retorno.erro("Falha ao excluir receita")
            
        except Exception as e:
            self.log.error(f"Erro ao excluir receita: {str(e)}")
            return Retorno.erro(f"Erro ao excluir receita: {str(e)}")
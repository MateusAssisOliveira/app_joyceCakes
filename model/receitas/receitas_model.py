from database.db import Database
from logs.logger import Logger
from typing import Dict, List, Optional, Union

class ReceitasModel:
    def __init__(self):
        self.db = Database()
        self.log = Logger()
        self.log.info("ReceitasModel inicializado")

    def get_paginas_receita_com_produtos(
        self,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: Optional[str] = None,
        filtros: Optional[Dict] = None,
        direcao: str = 'ASC',
        tabela = ''
    ) -> Dict:
        """
        Retorna dados paginados de receitas com produtos associados
        """
        try:
            # Validação de colunas para ordenação
            colunas_validas = {
                "receitas.id", "receitas.nome", "produtos.nome",
                "receitas_produtos.quantidade", "receitas.custo_estimado",
                "receitas.tempo_preparo", "receitas.dificuldade"
            }

            # Construção da query principal
            query = """
                SELECT 
                    receitas.id,
                    receitas.nome AS nome_receita,
                    receitas.descricao,
                    receitas.modo_preparo,
                    receitas.tempo_preparo,
                    receitas.rendimento,
                    receitas.dificuldade,
                    receitas.custo_estimado,
                    categorias_receita.nome AS categoria,
                    um.simbolo AS unidade_rendimento,
                    GROUP_CONCAT(
                        CONCAT(
                            produtos.nome, ' (', 
                            receitas_produtos.quantidade, ' ', 
                            um_prod.simbolo, ')'
                        ) SEPARATOR '; '
                    ) AS ingredientes
                FROM receitas
                LEFT JOIN categorias_receita ON receitas.categoria_id = categorias_receita.id
                LEFT JOIN receitas_produtos ON receitas.id = receitas_produtos.receita_id
                LEFT JOIN produtos ON receitas_produtos.produto_id = produtos.id
                LEFT JOIN unidades_medida um ON receitas.unidade_medida_id = um.id
                LEFT JOIN unidades_medida um_prod ON receitas_produtos.unidade_medida_id = um_prod.id
            """

            # Query para contar o total
            query_total = "SELECT COUNT(*) AS total FROM receitas"

            params = []
            conditions = []

            # Aplicação de filtros
            if filtros:
                for campo, valor in filtros.items():
                    if campo == 'search':
                        conditions.append("(receitas.nome LIKE %s OR receitas.descricao LIKE %s OR produtos.nome LIKE %s)")
                        params.extend([f"%{valor}%", f"%{valor}%", f"%{valor}%"])
                    elif campo == 'categoria_id':
                        conditions.append("receitas.categoria_id = %s")
                        params.append(valor)
                    elif campo == 'dificuldade':
                        conditions.append("receitas.dificuldade = %s")
                        params.append(valor)
                    elif campo == 'tempo_maximo':
                        conditions.append("receitas.tempo_preparo <= %s")
                        params.append(valor)

            if conditions:
                where_clause = " WHERE " + " AND ".join(conditions)
                query += where_clause
                query_total += where_clause

            # Agrupamento para os ingredientes
            query += " GROUP BY receitas.id"

            # Ordenação
            if ordenar_por and ordenar_por in colunas_validas:
                direcao = 'DESC' if direcao.upper() == 'DESC' else 'ASC'
                query += f" ORDER BY {ordenar_por} {direcao}"
            else:
                query += " ORDER BY receitas.nome ASC"

            # Paginação
            offset = (pagina - 1) * por_pagina
            query += f" LIMIT {por_pagina} OFFSET {offset}"

            # Execução das queries
            dados = self.db.fetch_data(query, tuple(params))
            total = self.db.fetch_data(query_total, tuple(params))

            total_registros = total[0]['total'] if total else 0
            total_paginas = max(1, (total_registros + por_pagina - 1) // por_pagina)

            # Formatação dos dados
            for receita in dados:
                if receita['ingredientes']:
                    receita['ingredientes'] = receita['ingredientes'].split('; ')
                else:
                    receita['ingredientes'] = []

            return {
                'dados': dados,
                'pagina_atual': pagina,
                'por_pagina': por_pagina,
                'total_registros': total_registros,
                'total_paginas': total_paginas
            }

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas com produtos: {str(e)}")
            raise

    def buscar_receitas(
        self, 
        pagina: int = 1, 
        por_pagina: int = 10, 
        filtro: Optional[str] = None,
        categoria_id: Optional[int] = None,
        dificuldade: Optional[str] = None
    ) -> Dict:
        """Busca receitas paginadas com opções de filtro avançado"""
        self.log.info(f"Buscando receitas | Página: {pagina}, Itens: {por_pagina}, Filtro: '{filtro}'")

        try:
            # Query base
            query = """
                SELECT 
                    r.id,
                    r.nome,
                    r.descricao,
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

            # Query para contagem total
            count_query = "SELECT COUNT(*) AS total FROM receitas r"
            
            conditions = []
            params = []

            # Aplicação de filtros
            if filtro:
                conditions.append("(r.nome LIKE %s OR r.descricao LIKE %s)")
                params.extend([f"%{filtro}%", f"%{filtro}%"])

            if categoria_id:
                conditions.append("r.categoria_id = %s")
                params.append(categoria_id)

            if dificuldade:
                conditions.append("r.dificuldade = %s")
                params.append(dificuldade.lower())

            # Adiciona condições às queries
            if conditions:
                where_clause = " WHERE " + " AND ".join(conditions)
                query += where_clause
                count_query += where_clause

            # Ordenação padrão
            query += " ORDER BY r.nome ASC"

            # Paginação
            offset = (pagina - 1) * por_pagina
            query += f" LIMIT {por_pagina} OFFSET {offset}"

            # Execução das queries
            dados = self.db.fetch_data(query, tuple(params))
            total_result = self.db.fetch_data(count_query, tuple(params))
            total_registros = total_result[0]['total'] if total_result else 0

            # Busca ingredientes para cada receita
            for receita in dados:
                receita['ingredientes'] = self._buscar_ingredientes_receita(receita['id'])

            self.log.info(f"{len(dados)} receitas encontradas na página {pagina}")

            return {
                'dados': dados,
                'total_registros': total_registros,
                'pagina': pagina,
                'por_pagina': por_pagina,
                'total_paginas': max(1, (total_registros + por_pagina - 1) // por_pagina)
            }

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas: {str(e)}")
            return {
                'dados': [],
                'total_registros': 0,
                'pagina': pagina,
                'por_pagina': por_pagina,
                'total_paginas': 0
            }

    def _buscar_ingredientes_receita(self, receita_id: int) -> List[Dict]:
        """Busca os ingredientes de uma receita específica"""
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
            ingredientes = self.db.fetch_data(query, (receita_id,))
            return ingredientes if ingredientes else []
        except Exception as e:
            self.log.error(f"Erro ao buscar ingredientes: {str(e)}")
            return []

    def obter_receita_por_id(self, receita_id: int) -> Optional[Dict]:
        """Obtém uma receita completa por ID"""
        try:
            # Query para dados básicos da receita
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
            receita = self.db.fetch_data(query, (receita_id,))
            
            if not receita:
                return None
                
            receita = receita[0]
            
            # Adiciona ingredientes
            receita['ingredientes'] = self._buscar_ingredientes_receita(receita_id)
            
            # Adiciona informações nutricionais (se existirem)
            receita['informacoes_nutricionais'] = self._buscar_informacoes_nutricionais(receita_id)
            
            return receita
            
        except Exception as e:
            self.log.error(f"Erro ao buscar receita por ID: {str(e)}")
            return None

    def _buscar_informacoes_nutricionais(self, receita_id: int) -> Dict:
        """Busca informações nutricionais da receita (se implementado)"""
        # Implementação opcional para futuras versões
        return {}

    def adicionar_receita(self, dados_receita: Dict) -> Union[int, None]:
        """Cria uma nova receita no banco de dados"""
        try:
            self.log.info("Iniciando criação de nova receita")
            
            # Inicia transação
            #self.db.start_transaction()
            
            # Insere a receita principal
            query_receita = """
                INSERT INTO receitas (
                    nome, descricao, modo_preparo, tempo_preparo, 
                    rendimento, unidade_medida_id, dificuldade, 
                    categoria_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            params_receita = (
                dados_receita['nome'],
                dados_receita['descricao'],
                dados_receita['modo_preparo'],
                dados_receita['tempo_preparo'],
                dados_receita['rendimento'],
                dados_receita['unidade_medida_id'],
                dados_receita['dificuldade'],
                dados_receita['categoria_id']
            )
            
            receita_id = self.db.execute_query(query_receita, params_receita, return_id=True)
            
            # Insere os ingredientes
            for ingrediente in dados_receita.get('ingredientes', []):
                query_ingrediente = """
                    INSERT INTO receitas_produtos (
                        receita_id, produto_id, quantidade, unidade_medida_id
                    ) VALUES (%s, %s, %s, %s)
                """
                params_ingrediente = (
                    receita_id,
                    ingrediente['produto_id'],
                    ingrediente['quantidade'],
                    ingrediente['unidade_medida_id']
                )
                self.db.execute_query(query_ingrediente, params_ingrediente)
            
            # Atualiza o custo estimado
            self._atualizar_custo_receita(receita_id)
            
            # Commit da transação
            #self.db.commit_transaction()
            
            self.log.info(f"Receita criada com sucesso. ID: {receita_id}")
            return receita_id
            
        except Exception as e:
            self.db.rollback_transaction()
            self.log.error(f"Erro ao criar receita: {str(e)}")
            return None

    def _atualizar_custo_receita(self, receita_id: int) -> bool:
        """Atualiza o custo estimado de uma receita"""
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
            self.db.execute_query(query, (receita_id, receita_id))
            return True
        except Exception as e:
            self.log.error(f"Erro ao atualizar custo da receita: {str(e)}")
            return False
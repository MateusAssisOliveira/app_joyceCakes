from database.db import Database
from logs.logger import Logger

class ReceitasModel:
    def __init__(self):
        self.db = Database()
        self.log = Logger()
        self.log.info("ReceitasModel inicializado")

    def get_paginas_receita_com_produtos(
        self,
        tabela,
        pagina=1,
        por_pagina=20,
        ordenar_por=None,
        filtros=None,
        direcao='ASC'
    ):
        """
        Retorna dados paginados de receitas com produtos, incluindo nome da receita e do produto.
        """
        try:
            # Prevenção contra SQL Injection
            colunas_validas = {
                "receitas.id", "receitas.nome", "produtos.nome",
                "receitas_produtos.quantidade", "produtos.preco_total"
            }

            if isinstance(filtros, str):
                filtros = {'receitas.observacoes': filtros} if filtros else None

            query = """
                SELECT 
                    receitas_produtos.id,
                    receitas.nome AS nome_receita,
                    produtos.nome AS nome_produto,
                    receitas_produtos.quantidade,
                    produtos.preco_total,
                    receitas_produtos.observacoes,
                    receitas.modo_preparo AS modo_preparo_preparo_receita,
                    receitas.tempo_de_preparo AS tempo_preparo_receita,
                    receitas.rendimento AS rendimento_receita,
                    receitas.descricao AS descricao_receita
                FROM receitas_produtos
                JOIN receitas ON receitas.id = receitas_produtos.receita_id
                JOIN produtos ON produtos.id = receitas_produtos.produto_id
            """
            query_total = """
                SELECT COUNT(*) AS total
                FROM receitas_produtos
                JOIN receitas ON receitas.id = receitas_produtos.receita_id
                JOIN produtos ON produtos.id = receitas_produtos.produto_id
            """

            params = []

            # Filtros
            if filtros:
                conditions = []
                for campo, valor in filtros.items():
                    if not campo.replace("_", "").replace(".", "").isalnum():
                        continue
                    if isinstance(valor, str):
                        conditions.append(f"{campo} LIKE %s")
                        params.append(f"%{valor}%")
                    else:
                        conditions.append(f"{campo} = %s")
                        params.append(valor)

                if conditions:
                    where = " WHERE " + " AND ".join(conditions)
                    query += where
                    query_total += where

            # Ordenação
            if ordenar_por in colunas_validas:
                direcao = 'DESC' if direcao.upper() == 'DESC' else 'ASC'
                query += f" ORDER BY {ordenar_por} {direcao}"

            # Paginação
            offset = (pagina - 1) * por_pagina
            query += f" LIMIT {por_pagina} OFFSET {offset}"

            dados = self.db.fetch_data(query, tuple(params))
            total = self.db.fetch_data(query_total, tuple(params))

            total_registros = total[0]['total'] if total else 0
            total_paginas = max(1, (total_registros + por_pagina - 1) // por_pagina)

            colunas = list(dados[0].keys()) if dados else []

            return {
                'dados': dados,
                'colunas': colunas,
                'pagina_atual': pagina,
                'por_pagina': por_pagina,
                'total_registros': total_registros,
                'total_paginas': total_paginas
            }

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas com produtos: {str(e)}")
            raise



    def buscar_receitas(self, pagina: int = 1, por_pagina: int = 10, filtro: str = None) -> dict:
        """Busca receitas paginadas"""
        self.log.info(f"Iniciando busca de receitas | Página: {pagina}, Por página: {por_pagina}, Filtro: '{filtro}'")

        try:
            query = """
            SELECT r.*, 
                   GROUP_CONCAT(i.nome SEPARATOR ', ') as produtos
            FROM receitas r
            LEFT JOIN receita_produtos ri ON r.id = ri.receita_id
            LEFT JOIN produtos i ON ri.produto_id = i.id
            WHERE %s LIKE %s
            GROUP BY r.id
            LIMIT %s OFFSET %s
            """
            offset = (pagina - 1) * por_pagina
            filtro_formatado = f"%{filtro}%" if filtro else "%%"

            results = self.db.execute_query(
                query, 
                ("r.nome", filtro_formatado, por_pagina, offset)
            )

            receitas_formatadas = [self._formatar_receita(r) for r in results]
            total = self._contar_receitas(filtro_formatado)

            self.log.info(f"{len(receitas_formatadas)} receitas encontradas na página {pagina}")

            return {
                'dados': receitas_formatadas,
                'total': total,
                'pagina': pagina,
                'por_pagina': por_pagina
            }

        except Exception as e:
            self.log.error(f"Erro ao buscar receitas: {str(e)}")
            return {'dados': [], 'total': 0, 'pagina': pagina, 'por_pagina': por_pagina}

    def _contar_receitas(self, filtro: str) -> int:
        """Conta o total de receitas"""
        try:
            self.log.debug(f"Contando total de receitas com filtro: '{filtro}'")
            query = "SELECT COUNT(*) FROM receitas WHERE nome LIKE %s"
            total = self.db.execute_query(query, (filtro,))[0][0]
            self.log.debug(f"Total de receitas encontradas: {total}")
            return total
        except Exception as e:
            self.log.error(f"Erro ao contar receitas: {str(e)}")
            return 0

    def _formatar_receita(self, db_row: tuple) -> dict:
        """Formata os dados da receita"""
        receita_formatada = {
            'id': db_row[0],
            'nome': db_row[1],
            'descricao': db_row[2],
            'rendimento': db_row[3],
            'produtos': db_row[4].split(', ') if db_row[4] else []
        }
        self.log.debug(f"Receita formatada: {receita_formatada}")
        return receita_formatada

    # Outros métodos (inserir, atualizar, excluir) mantidos conforme sua implementação

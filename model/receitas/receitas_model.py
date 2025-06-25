from database.db import Database
from logs.logger import Logger

class ReceitasModel:
    def __init__(self):
        self.db = Database()
        self.log = Logger()
        self.log.info("ReceitasModel inicializado")

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

from typing import Any, Dict, List, Optional
from database.db import Database


class ProdutoModel:
    """
    Responsável por CRUD e consultas na tabela `produtos`.
    Campos principais: id, nome, descricao, codigo_barras, categoria_id,
    unidade_medida_id, custo_unitario, estoque_minimo, data_cadastro, ativo
    """
    def __init__(self, db: Database):
        self.db = db

    def listar_paginado(
        self,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: Optional[str] = None,
        filtros: Optional[str] = None
    ) -> Dict[str, Any]:
        # Monta SQL para paginação
        sql = "SELECT * FROM produtos"
        params: List[Any] = []
        if filtros:
            sql += " WHERE nome LIKE %s"
            params.append(f"%{filtros}%")
        if ordenar_por:
            sql += f" ORDER BY {ordenar_por}"
        offset = (pagina - 1) * por_pagina
        sql += " LIMIT %s OFFSET %s"
        params.extend([por_pagina, offset])

        rows = self.db.execute_query(sql, tuple(params))
        total = self.db.execute_query("SELECT COUNT(*) FROM produtos" + (" WHERE nome LIKE %s" if filtros else ""), tuple(params[:1]))
        return {
            "colunas": [col[0] for col in self.db.description],
            "dados": rows,
            "total_paginas": (total + por_pagina - 1) // por_pagina
        }

    def obter_por_id(self, produto_id: int) -> Optional[Dict[str, Any]]:
        row = self.db.execute_query("SELECT * FROM produtos WHERE id = %s", (produto_id,))
        return row

    def criar(self, dados: Dict[str, Any]) -> int:
        cols = []
        vals = []
        params = []
        for campo in ["nome","descricao","codigo_barras","categoria_id","unidade_medida_id","custo_unitario","estoque_minimo","ativo"]:
            if campo in dados:
                cols.append(campo)
                vals.append("%s")
                params.append(dados[campo])
        sql = f"INSERT INTO produtos ({', '.join(cols)}) VALUES ({', '.join(vals)})"
        return self.db.execute_query(sql, tuple(params))  # retorna o novo id

    def atualizar(self, produto_id: int, dados: Dict[str, Any]) -> bool:
        assignments = []
        params = []
        for campo in ["nome","descricao","codigo_barras","categoria_id","unidade_medida_id","custo_unitario","estoque_minimo","ativo"]:
            if campo in dados:
                assignments.append(f"{campo} = %s")
                params.append(dados[campo])
        params.append(produto_id)
        sql = f"UPDATE produtos SET {', '.join(assignments)} WHERE id = %s"
        return self.db.execute_query(sql, tuple(params)) > 0

    def excluir(self, produto_id: int) -> bool:
        return self.db.execute_query("DELETE FROM produtos WHERE id = %s", (produto_id,)) > 0
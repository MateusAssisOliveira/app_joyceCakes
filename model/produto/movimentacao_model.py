from typing import Any, Dict, List, Optional

from database.db import Database

class MovimentacaoModel:
    """
    Responsável por operações na tabela `movimentacoes_estoque`:
    registro de entradas/saídas, listagem, busca e histórico.
    """
    def __init__(self, db: Database):
        self.db = db

    def listar_todas(self, filtro: Optional[str] = None) -> List[Dict[str, Any]]:
        sql = "SELECT m.*, p.nome AS produto_nome FROM movimentacoes_estoque m " \
              "JOIN produtos p ON p.id = m.produto_id"
        params: List[Any] = []
        if filtro:
            sql += " WHERE p.nome LIKE %s"
            params.append(f"%{filtro}%")
        sql += " ORDER BY m.data_registro DESC"
        return self.db.query(sql, tuple(params))

    def registrar(
        self,
        dados: Dict[str, Any],
        tipo: str  # 'entrada' ou 'saida'
    ) -> bool:
        sql = ("INSERT INTO movimentacoes_estoque "
               "(produto_id, quantidade, tipo, origem, origem_id, data_registro, custo_unitario, usuario_id, observacoes) "
               "VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s)")
        params = (
            dados['produto_id'],
            dados['quantidade'],
            tipo,
            dados.get('origem', 'ajuste'),
            dados.get('origem_id'),
            dados.get('custo_unitario', 0),
            dados.get('usuario_id'),
            dados.get('observacoes', '')
        )
        return self.db.execute(sql, params) > 0

    def buscar(self, filtro: str) -> List[Dict[str, Any]]:
        return self.listar_todas(filtro)

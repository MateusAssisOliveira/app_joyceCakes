from decimal import Decimal
from datetime import datetime
from typing import Optional

class IngredienteData:
    def __init__(
        self,
        id: int,
        nome_produto: str,
        descricao: str,
        codigo_barras: Optional[str],
        custo_unitario: Decimal,
        estoque_minimo: Optional[int],
        data_cadastro: datetime,
        ativo: int,
        categoria_id: int,
        categoria_nome: str,
        unidade_id: int,
        unidade_nome: str,
    ):
        self.id = id
        self.nome_produto = nome_produto
        self.descricao = descricao
        self.codigo_barras = codigo_barras
        self.custo_unitario = custo_unitario
        self.estoque_minimo = estoque_minimo
        self.data_cadastro = data_cadastro
        self.ativo = ativo
        self.categoria_id = categoria_id
        self.categoria_nome = categoria_nome
        self.unidade_id = unidade_id
        self.unidade_nome = unidade_nome

    def __str__(self):
        return f"Ingrediente(id={self.id}, nome='{self.nome_produto}', custo={self.custo_unitario} por {self.unidade_nome})"

    @classmethod
    def from_dict(cls, data_dict):
        return cls(**data_dict)
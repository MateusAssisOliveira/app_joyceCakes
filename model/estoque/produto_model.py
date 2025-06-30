class ProdutoModel:
    def __init__(
        self,
        id: int,
        nome: str,
        descricao: str = None,
        codigo_barras: str = None,
        categoria_id: int = None,
        unidade_medida_id: int = None,
        custo_unitario: float = 0.0,
        estoque_minimo: float = 0.0,
        data_cadastro: str = None,
        ativo: bool = True,
        # Campos relacionados (opcionais - podem ser carregados posteriormente)
        categoria_nome: str = None,
        unidade_medida_simbolo: str = None
    ):
        self.id = id
        self.nome = nome
        self.descricao = descricao
        self.codigo_barras = codigo_barras
        self.categoria_id = categoria_id
        self.unidade_medida_id = unidade_medida_id
        self.custo_unitario = custo_unitario
        self.estoque_minimo = estoque_minimo
        self.data_cadastro = data_cadastro
        self.ativo = ativo
        
        # Campos relacionados (não estão na tabela produtos, mas úteis para exibição)
        self.categoria_nome = categoria_nome
        self.unidade_medida_simbolo = unidade_medida_simbolo

    @classmethod
    def from_db_row(cls, row: dict):
        """Cria um ProdutoModel a partir de uma linha do banco de dados"""
        return cls(
            id=row['id'],
            nome=row['nome'],
            descricao=row.get('descricao'),
            codigo_barras=row.get('codigo_barras'),
            categoria_id=row.get('categoria_id'),
            unidade_medida_id=row.get('unidade_medida_id'),
            custo_unitario=float(row.get('custo_unitario', 0.0)),
            estoque_minimo=float(row.get('estoque_minimo', 0.0)),
            data_cadastro=row.get('data_cadastro'),
            ativo=bool(row.get('ativo', True)),
            categoria_nome=row.get('categoria_nome'),
            unidade_medida_simbolo=row.get('unidade_medida_simbolo')
        )

    def to_dict(self) -> dict:
        """Converte o objeto para dicionário"""
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'codigo_barras': self.codigo_barras,
            'categoria_id': self.categoria_id,
            'unidade_medida_id': self.unidade_medida_id,
            'custo_unitario': self.custo_unitario,
            'estoque_minimo': self.estoque_minimo,
            'data_cadastro': self.data_cadastro,
            'ativo': self.ativo,
            'categoria_nome': self.categoria_nome,
            'unidade_medida_simbolo': self.unidade_medida_simbolo
        }

    def __repr__(self):
        return f"Produto(id={self.id}, nome='{self.nome}', custo_unitario={self.custo_unitario}, unidade='{self.unidade_medida_simbolo}')"
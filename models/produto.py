class Produto:
    def __init__(self, id=None, nome='', descricao='', preco=0.0, quantidade=0, tipo='unidade'):
        self.id = id
        self.nome = nome
        self.descricao = descricao
        self.preco = preco
        self.quantidade = quantidade
        self.tipo = tipo
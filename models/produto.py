class Produto:
    def __init__(self, id=None, nome='', descricao='', preco=0.0, quantidade=0, tipo='unidade'):
        self.id = id
        self.nome = nome
        self.descricao = descricao
        self.preco = preco
        self.quantidade = quantidade
        self.tipo = tipo
    def get_id(self):
        return self.id
    def get_nome(self):
        return self.nome
    def get_descricao(self):
        return self.descricao
    def get_preco(self):
        return self.preco
    def get_quantidade(self):
        return self.quantidade
    def get_tipo(self): 
        return self.tipo
    def set_id(self, id):
        self.id = id
    def set_nome(self, nome):
        self.nome = nome
    def set_descricao(self, descricao):
        self.descricao = descricao
    def set_preco(self, preco):
        self.preco = preco
    def set_quantidade(self, quantidade):
        self.quantidade = quantidade
    def set_tipo(self, tipo):
        self.tipo = tipo
    
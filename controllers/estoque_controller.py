
class AcoesEstoque:
    def __init__(self, estoque):
        self.estoque = estoque

    def adicionar(self, e):
        self.estoque.adicionar_produto()

    def buscar(self, termo):
        self.estoque.buscar_produto(termo)

    def editar(self, produto):
        self.estoque.editar_produto(produto)
    
    def remover(self, produto):
        self.estoque.remover_produto(produto)
    

import logging

class AcoesEstoque:
    def __init__(self, estoque):
        self.estoque = estoque
        self.logger = logging.getLogger(self.__class__.__name__)

    def adicionar(self, e):
        self.logger.info("Ação: adicionar produto")
        self.estoque.adicionar_produto()

    def buscar(self, termo):
        self.logger.info(f"Busca por: '{termo}'")
        self.estoque.buscar_produto(termo)

    def editar(self, produto):
        self.logger.info(f"Edição solicitada para o produto: {produto}")
        self.estoque.editar_produto(produto)

    def remover(self, produto):
        self.logger.info(f"Remoção solicitada para o produto: {produto}")
        self.estoque.remover_produto(produto)

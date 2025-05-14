from logs.logger import Logger

class EstoquePageController:
    def __init__(self, model, view):
        self.model = model
        self.view = view
        self.log = Logger()

        self.log.info("EstoquePageController inicializado.")

    def exibir_view_estoque(self):
        self.log.debug("Chamando view_estoque() da view.")
        return self.carregar_dados_estoque()
    
    def carregar_dados_estoque(self):
        self.log.debug("Buscando dados de produtos no model.")
        rows_produtos = self.model.buscar_produtos()
        headers_produtos = self.model.get_colunas_produto()
        
        self.log.debug(f"{len(headers_produtos)} colunas retonadas do modeu")
        self.log.debug(f"{len(rows_produtos)} produtos retornados do model.")
        
        self.log.debug("Chamando create_view_estoque() com os dados.")
        
        return self.view.create_view_estoque(headers_produtos,rows_produtos)

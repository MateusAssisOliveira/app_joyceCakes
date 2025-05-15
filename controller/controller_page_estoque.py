from logs.logger import Logger

class EstoquePageController:
    def __init__(self, estoque_model, estoque_view):
        self.estoque_model = estoque_model
        self.estoque_view = estoque_view
        self.log = Logger()

        self.log.info("EstoquePageController inicializado.")

    def exibir_view_estoque(self):
        self.log.debug("Chamando view_estoque() da view.")
        return self.carregar_dados_estoque()
    
    def carregar_dados_estoque(self):
        self.log.debug("Buscando dados de produtos no model.")
        rows_produtos = self.estoque_model.buscar_produtos()
        headers_produtos = self.estoque_model.get_colunas_produto()
        
        self.log.debug(f"{len(headers_produtos)} colunas retonadas do modeu")
        self.log.debug(f"{len(rows_produtos)} produtos retornados do model.")
        
        self.log.debug("Chamando create_view_estoque() com os dados.")
        
        return self.estoque_view.create_view_estoque(headers_produtos,rows_produtos)
    
    def listar_produtos(self, pagina=1, por_pagina=20, ordenar_por=None):
        
        self.log.debug(f"Chamando listar_produtos() com as especificaçoe : Pagina : {pagina} - Quantidade : {por_pagina}")
        """
        Controlador para listar produtos com paginação.
        """
        try:
            
            dados_paginados = self.estoque_model.get_pagina(
                tabela="produtos", 
                pagina=pagina, 
                por_pagina=por_pagina, 
                ordenar_por=ordenar_por
            )
            
            # Suponha que você queira retornar os dados para a View (ou para uma API)
            return dados_paginados  # Ou renderizar em uma view, por exemplo

        except ValueError as e:
            # Caso ocorra um erro de valor, podemos tratar aqui (por exemplo, tabela ou coluna inválida)
            print(f"Erro: {e}")
            return {"erro": "Tabela ou coluna inválida."}

        except Exception as e:
            # Qualquer outro erro
            print(f"Erro inesperado: {e}")
            return {"erro": "Erro ao buscar produtos."}

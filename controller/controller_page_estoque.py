from logs.logger import Logger

class EstoquePageController:
    def __init__(self, page , estoque_model, estoque_view):
        self.estoque_model = estoque_model
        self.estoque_view = estoque_view
        self.log = Logger()
        self._cache_paginacao = {}
        self.page = page
        self.estoque_view.set_on_buscar(self.busca_por_nome)


        self.log.info("EstoquePageController inicializado.")

    def exibir_view_estoque(self):
        self.log.debug("Chamando view_estoque() da view.")
        self.carregar_dados_estoque()
        return self.estoque_view.create_view_estoque()

    def carregar_dados_estoque(self, pagina=1):

        self.log.debug("Buscando dados de produtos no model.")
        resultado_final = self.listar_produtos_paginados(pagina=pagina)

        headers_produtos = resultado_final.get('colunas', [])
        rows_produtos = resultado_final.get('dados', [])
        total_paginas = resultado_final.get('total_paginas', 1)

        self.log.debug(f"{len(headers_produtos)} colunas retornadas do model.")
        self.log.debug(f"{len(rows_produtos)} produtos retornados do model.")
        self.log.debug(f"Total de páginas: {total_paginas}")

        # Atualiza o total de páginas e a função de callback
        self.estoque_view.rodaPe.total_paginas = total_paginas
        self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
        self.estoque_view.rodaPe.ao_mudar_pagina = self.carregar_dados_estoque
        self.page.update()
        
        return 

    def listar_produtos_paginados(self, pagina=1, por_pagina=20, ordenar_por=None):
        self.log.debug(f"Chamando listar_produtos() com: Página={pagina}, Quantidade={por_pagina}, OrdenarPor={ordenar_por}")

        chave_cache = f"{pagina}-{por_pagina}-{ordenar_por}"

        if chave_cache in self._cache_paginacao:
            self.log.debug("Usando resultado em cache da paginação.")
            return self._cache_paginacao[chave_cache]

        try:
            dados_paginados = self.estoque_model.get_pagina(
                pagina=pagina,
                tabela="produtos",
                por_pagina=por_pagina,
                ordenar_por=ordenar_por
            )
            self._cache_paginacao[chave_cache] = dados_paginados
            return dados_paginados

        except ValueError as e:
            self.log.error(f"Erro: {e}")
            return {"erro": "Tabela ou coluna inválida."}

        except Exception as e:
            self.log.error(f"Erro inesperado: {e}")
            return {"erro": "Erro ao buscar produtos."}
        
    def limpar_cache_paginacao(self):
        self._cache_paginacao.clear()

    
    def busca_por_nome(self, produto=None, pagina=1):

        if not produto :
            self.limpar_cache_paginacao()
            return self.listar_produtos_paginados()
        
        self.log.debug(f"Realizando busca por nome: {produto}")

        try:
            resultado_final = self.estoque_model.get_pagina(
                tabela="produtos",
                pagina=pagina,
                por_pagina=20,
                ordenar_por="nome",
                filtros=str(produto)
            )

            headers_produtos = resultado_final.get('colunas', [])
            rows_produtos = resultado_final.get('dados', [])
            total_paginas = resultado_final.get('total_paginas', 1)

            if not rows_produtos:
                self.estoque_view.error_message.value = f"Nenhum produto encontrado com o nome '{produto}'."
            else:
                self.estoque_view.error_message.value = ""  # limpa erro anterior

            self.estoque_view.rodaPe.total_paginas = total_paginas
            self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
            self.estoque_view.rodaPe.ao_mudar_pagina = lambda p: self.busca_por_nome(produto, pagina=p)
            self.page.update()

        except Exception as e:
            self.log.error(f"Erro na busca por nome: {e}")
            self.estoque_view.error_message.value = f"Erro ao buscar produtos: {e}"
            self.page.update()


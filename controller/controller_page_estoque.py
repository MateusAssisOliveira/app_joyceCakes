from logs.logger import Logger

from logs.logger import Logger

class EstoquePageController:
    def __init__(self, page, estoque_model, estoque_view):
        self.estoque_model = estoque_model
        self.estoque_view = estoque_view
        self.page = page
        self.log = Logger()
        self._cache_paginacao = {}
        
        self.estoque_view.set_on_buscar(self.busca_por_nome)
        self.estoque_view.definir_acoes_botoes(callbacks={
        "home": '',
        "novo": self.adicionar_produto,
        "editar": self.editar_produto,
        "deletar": self.excluir_produto
        })
        
        self.log.info("EstoquePageController inicializado.")

    def exibir_view_estoque(self):
        self.log.debug("Exibindo view_estoque.")
        self.carregar_dados_estoque()
        return self.estoque_view.create_view_estoque()

    def carregar_dados_estoque(self, pagina=1):
        self.log.debug("Buscando dados de produtos no model.")
        resultado_final = self.listar_produtos_paginados(pagina=pagina)

        headers_produtos = resultado_final.get('colunas', [])
        rows_produtos = resultado_final.get('dados', [])
        total_paginas = resultado_final.get('total_paginas', 1)

        self.log.debug(f"{len(headers_produtos)} colunas retornadas.")
        self.log.debug(f"{len(rows_produtos)} produtos retornados.")
        self.log.debug(f"Total de páginas: {total_paginas}")

        # Atualiza o total de páginas e a função de callback
        self.estoque_view.rodaPe.total_paginas = total_paginas
        self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
        self.estoque_view.rodaPe.ao_mudar_pagina = self.carregar_dados_estoque
        self.page.update()

    def listar_produtos_paginados(self, pagina=1, por_pagina=20, ordenar_por=None, filtros=None):
        self.log.debug(f"Chamando listar_produtos() com: Página={pagina}, Quantidade={por_pagina}, OrdenarPor={ordenar_por}, Filtros={filtros}")
        chave_cache = f"{pagina}-{por_pagina}-{ordenar_por}-{filtros}"

        if chave_cache in self._cache_paginacao:
            self.log.debug("Usando resultado em cache da paginação.")
            return self._cache_paginacao[chave_cache]

        try:
            dados_paginados = self.estoque_model.get_pagina(
                pagina=pagina,
                tabela="produtos",
                por_pagina=por_pagina,
                ordenar_por=ordenar_por,
                filtros=filtros
            )
            self._cache_paginacao[chave_cache] = dados_paginados
            return dados_paginados
        except Exception as e:
            self.log.error(f"Erro ao buscar dados: {e}")
            return {"erro": "Erro ao buscar produtos."}

    # Função para buscar produto por nome
    def busca_por_nome(self, produto=None, pagina=1):
        if not produto:
            self.limpar_cache_paginacao()
            return self.carregar_dados_estoque(pagina)  # Chama a listagem de produtos sem filtro

        self.log.debug(f"Buscando produtos por nome: {produto}")
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
                self.estoque_view.error_message.value = ""  # Limpa erro anterior

            self.estoque_view.rodaPe.total_paginas = total_paginas
            self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
            self.estoque_view.rodaPe.ao_mudar_pagina = lambda p: self.busca_por_nome(produto, pagina=p)
            self.page.update()

        except Exception as e:
            self.log.error(f"Erro na busca por nome: {e}")
            self.estoque_view.error_message.value = f"Erro ao buscar produtos: {e}"
            self.page.update()

    # Função para adicionar um novo produto
    def adicionar_produto(self):
        def callback_salvar(dados):
            # Valida e salva os dados
            self.estoque_model.adicionar(dados)
            
            # Atualiza a tabela ou dados do estoque
            self.carregar_dados_estoque()

            # Fecha o diálogo e atualiza a página
            self.estoque_view.dialog_adicionar.dialog.open = False
            self.page.update()

        # Abre o diálogo para adicionar produto, passando a página e o callback de salvar
        self.estoque_view.dialog_adicionar.abrir(
            page=self.page,
            on_salvar=callback_salvar
        )


    def _salvar_produto(self, dados):
        # Lógica para salvar no model
        self.estoque_model.adicionar(dados)
        self.carregar_dados_estoque()  # Atualiza a view
    
    
    # Função para editar um produto existente
    def editar_produto(self, produto_id):
        self.log.debug(f"Editando produto com ID: {produto_id}")
        produto = self.estoque_model.get_produto_by_id(produto_id)
        if produto:
            self.estoque_view.abrir_tela_editar_produto(produto)

    # Função para excluir um produto
    def excluir_produto(self, produto_id):
        self.log.debug(f"Excluindo produto com ID: {produto_id}")
        try:
            self.estoque_model.deletar_produto(produto_id)
            self.estoque_view.atualizar_lista_produtos()
            self.log.info(f"Produto com ID {produto_id} excluído com sucesso.")
        except Exception as e:
            self.log.error(f"Erro ao excluir produto: {e}")
            self.estoque_view.error_message.value = f"Erro ao excluir produto: {e}"
            self.page.update()

    # Função para limpar o cache de paginação
    def limpar_cache_paginacao(self):
        self._cache_paginacao.clear()

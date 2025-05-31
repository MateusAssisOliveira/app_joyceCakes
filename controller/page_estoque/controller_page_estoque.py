from components.dialog_produto import DialogProduto
from controller.page_estoque.estoque_data_handler import EstoqueDataHandler
from controller.page_estoque.estoque_product_handler import EstoqueProductHandler
from logs.logger import Logger
import flet as ft
from model.estoque_model import EstoqueModel
from view.estoque_page_view import EstoquePageView

class EstoquePageController:
    def __init__(self, page: ft.Page, estoque_model: EstoqueModel, estoque_view: EstoquePageView):
        self.page = page
        self.estoque_view = estoque_view
        self.log = Logger()
        
        # Inicializa handlers especializados
        self.data_handler = EstoqueDataHandler(estoque_model, self.log)
        self.product_handler = EstoqueProductHandler(estoque_model, self.log)

        # Configura callbacks da view
        self._setup_view_callbacks()
        self.log.info("EstoquePageController inicializado.")

    def _setup_view_callbacks(self):
        """Configura todos os callbacks da view"""
        self.estoque_view.set_on_buscar(self.busca_por_nome)
        self.estoque_view.table.set_callback_handle_row_click(self.product_handler.selecionar_produto)
        self.estoque_view.definir_acoes_botoes(callbacks={
            "home": lambda: print("Navegar para home"),
            "novo": self.adicionar_produto,
            "editar": self.editar_produto,
            "deletar": self.excluir_produto_selecionado
        })

    def exibir_view_estoque(self):
        """Exibe a view principal do estoque"""
        self.log.debug("Exibindo view_estoque.")
        self.carregar_dados_estoque()
        return self.estoque_view.create_view_estoque()

    def carregar_dados_estoque(self, pagina=1):
        """Carrega os dados do estoque de forma paginada"""
        self.log.debug("Buscando dados de produtos no model.")
        resultado_final = self.data_handler.listar_produtos_paginados(pagina=pagina)
        self._atualizar_view_com_dados(resultado_final, lambda p: self.carregar_dados_estoque(p))
        self.page.update()

    def busca_por_nome(self, produto=None, pagina=1):
        """Realiza busca de produtos por nome"""
        if not produto:
            self.data_handler.limpar_cache_paginacao()
            return self.carregar_dados_estoque(pagina)

        self.log.debug(f"Buscando produtos por nome: {produto}")
        
        try:
            resultado_final = self.data_handler.listar_produtos_paginados(
                pagina=pagina,
                filtros=str(produto))
            
            if not resultado_final.get('dados', []):
                self.estoque_view.error_message.value = (f"Nenhum produto encontrado com o nome '{produto}'.")
            else:
                self.estoque_view.error_message.value = ""

            self._atualizar_view_com_dados(
                resultado_final, 
                lambda p: self.busca_por_nome(produto, pagina=p))
            
            self.page.update()
        except Exception as e:
            self._handle_error(f"Erro na busca por nome: {e}")

    def _atualizar_view_com_dados(self, resultado_final, callback_paginacao):
        """Atualiza a view com os dados recebidos"""
        headers_produtos = resultado_final.get('colunas', [])
        rows_produtos = resultado_final.get('dados', [])
        total_paginas = resultado_final.get('total_paginas', 1)

        self.estoque_view.rodaPe.total_paginas = total_paginas
        self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
        self.estoque_view.rodaPe.ao_mudar_pagina = callback_paginacao

    def _handle_error(self, error_msg):
        """Tratamento centralizado de erros"""
        self.log.error(error_msg)
        self.estoque_view.error_message.value = error_msg
        self.page.update()

    def _show_snackbar(self, message, success=True):
        """Exibe uma snackbar com mensagem"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(message),
            bgcolor=ft.colors.GREEN_300 if success else ft.colors.RED_300,
            duration=3000  # duração em milissegundos
        )
        self.page.open(self.page.snack_bar)
        self.page.snack_bar.open = True


    def adicionar_produto(self, e=None):
        """Abre diálogo para adicionar novo produto"""
        dialog = DialogProduto(self.page)
        
        def salvar_callback(dados):
            success, message = self.product_handler.adicionar_produto(dados)
            self._show_snackbar(message, success)
            
            if success:
                self.log.info(f"Produto adicionado: {dados}")
                dialog.fechar()
                self.carregar_dados_estoque()
           

        dialog.abrir(
            modo_edicao=False,
            on_salvar=salvar_callback,
            on_cancelar=lambda: print("Operação cancelada")
        )
        

    def editar_produto(self, e=None):
        """Abre diálogo para editar produto selecionado"""
        if not self.product_handler.produto_selecionado:
            self._show_snackbar("Nenhum produto selecionado para edição", False)
            return

        produto = self.product_handler.produto_selecionado
        self.log.info(f"Produto para ediar : {produto}")
        dialog = DialogProduto(self.page)
        
        def salvar_callback(dados_editados):
            success, message = self.product_handler.editar_produto(dados_editados)
            self._show_snackbar(message, success)
            if success:
                self.carregar_dados_estoque()
            dialog.fechar()

        dialog.abrir(
            modo_edicao=True,
            produto=produto,
            on_salvar=salvar_callback,
            on_cancelar=lambda: print("Edição cancelada")
        )

    def excluir_produto_selecionado(self, e=None):
        """Exclui o produto atualmente selecionado"""
        if not self.product_handler.produto_selecionado:
            self._show_snackbar("Nenhum produto selecionado para exclusão", False)
            return

        produto_id = self.product_handler.produto_selecionado['id']
        self.excluir_produto(produto_id)

    def excluir_produto(self, produto_id):
        """Exclui um produto específico por ID"""
        success, message = self.product_handler.excluir_produto(produto_id)
        self._show_snackbar(message, success)
        if success:
            self.carregar_dados_estoque()
from components.dialog_produto import DialogProduto
from controller.page_estoque.estoque_data_handler import EstoqueDataHandler
from controller.page_estoque.estoque_product_handler import EstoqueProductHandler
from logs.logger import Logger
import flet as ft
from model.estoque_model import EstoqueModel
from view.estoque_page_view import EstoquePageView
import time

class EstoquePageController:
    def __init__(self, page: ft.Page, estoque_model: EstoqueModel, estoque_view: EstoquePageView):
        self.page = page
        self.estoque_view = estoque_view
        self.log = Logger()
        
        try:
            self.log.debug("Inicializando EstoqueDataHandler e EstoqueProductHandler.")
            self.data_handler = EstoqueDataHandler(estoque_model, self.log)
            self.product_handler = EstoqueProductHandler(estoque_model, self.log)

            self.log.debug("Configurando callbacks da view.")
            self._setup_view_callbacks()
            self.log.info("EstoquePageController inicializado com sucesso.")
        except Exception as e:
            self._handle_error(f"Erro ao inicializar EstoquePageController: {e}")

    def _setup_view_callbacks(self):
        try:
            self.estoque_view.set_on_buscar(self.busca_por_nome)
            self.estoque_view.table.set_callback_handle_row_click(self.product_handler.selecionar_produto)
            self.estoque_view.definir_acoes_botoes(callbacks={
                "home": lambda: print("Navegar para home"),
                "novo": self.adicionar_produto,
                "editar": self.editar_produto,
                "deletar": self.excluir_produto_selecionado
            })
            self.log.debug("Callbacks configurados com sucesso.")
        except Exception as e:
            self._handle_error(f"Erro ao configurar callbacks: {e}")

    def exibir_view_estoque(self):
        try:
            self.log.debug("Exibindo view_estoque.")
            self.carregar_dados_estoque()
            return self.estoque_view.create_view_estoque()
        except Exception as e:
            self._handle_error(f"Erro ao exibir a view do estoque: {e}")

    def carregar_dados_estoque(self, pagina=1):
        try:
            self.log.debug(f"Carregando dados do estoque - Página: {pagina}")
            resultado_final = self.data_handler.listar_produtos_paginados(pagina=pagina)
            self._atualizar_view_com_dados(resultado_final, lambda p: self.carregar_dados_estoque(p))
            self.page.update()
        except Exception as e:
            self._handle_error(f"Erro ao carregar dados do estoque: {e}")

    def busca_por_nome(self, produto=None, pagina=1):

        self.log.debug(f"Iniciando busca_por_nome - Produto: {produto}, Página: {pagina}")
        try:
            if not produto:
                self.data_handler.limpar_cache_paginacao()
                return self.carregar_dados_estoque(pagina)

            resultado_final = self.data_handler.listar_produtos_paginados(
                pagina=pagina,
                filtros=str(produto)
            )
            if not resultado_final.get('dados', []):
                self.estoque_view.error_message.value = f"Nenhum produto encontrado com o nome '{produto}'."
            else:
                self.estoque_view.error_message.value = ""

            self._atualizar_view_com_dados(
                resultado_final,
                lambda p: self.busca_por_nome(produto, pagina=p)
            )
            self.page.update()
        except Exception as e:
            self._handle_error(f"Erro na busca por nome: {e}")

    def _atualizar_view_com_dados(self, resultado_final, callback_paginacao):
        try:
            
            headers_produtos = resultado_final.get('colunas', [])
            rows_produtos = resultado_final.get('dados', [])
            total_paginas = resultado_final.get('total_paginas')

            self.log.info(f"headers_produtos : {headers_produtos}")
            self.log.info(f"rows_produtos : {rows_produtos}")
            self.log.info(f"total_paginas : {total_paginas}")


            self.estoque_view.rodaPe.total_paginas = total_paginas
            self.estoque_view.rodaPe.ao_mudar_pagina = callback_paginacao

            sucesso = self.estoque_view.alimentar_Dados(headers_produtos, rows_produtos)
            
            if not sucesso:
                self._handle_error("Falha ao preencher a tabela com os dados.")
        except Exception as e:
            self._handle_error(f"Erro ao atualizar dados na view: {e}")


    def _handle_error(self, error_msg):
        self.log.error(error_msg)
        self.estoque_view.error_message.value = error_msg
        self.page.update()

    def _show_snackbar(self, message, success=True):
        try:
            self.log.debug(f"Exibindo snackbar: '{message}', sucesso: {success}")
            self.page.snack_bar = ft.SnackBar(
                content=ft.Text(message),
                bgcolor=ft.Colors.GREEN_300 if success else ft.Colors.RED_300,
                duration=3000
            )
            self.page.snack_bar.open = True
            self.page.open(self.page.snack_bar)
        except Exception as e:
            self._handle_error(f"Erro ao exibir snackbar: {e}")

    def adicionar_produto(self, e=None):

        self.log.debug("Abrindo diálogo para adicionar novo produto.")
        try:
            dialog = DialogProduto(self.page)

            def salvar_callback(dados):
                try:
                    self.log.debug(f"Salvando novo produto: {dados}")
                    success, message = self.product_handler.adicionar_produto(dados)
                    self._show_snackbar(message, success)
                    if success:
                        self.log.info(f"Produto adicionado: {dados}")
                        self.data_handler.limpar_cache_paginacao()
                        dialog.fechar()
                        self.page.update()
                        time.sleep(0.3)
                        self.carregar_dados_estoque()

                except Exception as e:
                    self._handle_error(f"Erro ao salvar novo produto: {e}")

            dialog.abrir(
                modo_edicao=False,
                on_salvar=salvar_callback,
                on_cancelar=lambda: self.log.debug("Adição de produto cancelada.")
            )
        except Exception as e:
            self._handle_error(f"Erro ao abrir diálogo de novo produto: {e}")

    def editar_produto(self, e=None):

        self.log.debug("Abrindo diálogo para edição de produto.")
        try:
            if not self.product_handler.produto_selecionado:
                self._show_snackbar("Nenhum produto selecionado para edição", False)
                return

            produto = self.product_handler.produto_selecionado
            dialog = DialogProduto(self.page)

            def salvar_callback(dados_editados):
                try:
                    self.log.debug(f"Salvando edição do produto: {dados_editados}")
                    success, message = self.product_handler.editar_produto(dados_editados)
                    self._show_snackbar(message, success)

                    if success:
                        self.data_handler.limpar_cache_paginacao()
                        dialog.fechar()
                        self.page.update()
                        time.sleep(0.3)
                        self.carregar_dados_estoque()
                        
                except Exception as e:
                    self._handle_error(f"Erro ao editar produto: {e}")

            dialog.abrir(
                modo_edicao=True,
                produto=produto,
                on_salvar=salvar_callback,
                on_cancelar=lambda: self.log.debug("Edição de produto cancelada.")
            )
        except Exception as e:
            self._handle_error(f"Erro ao abrir diálogo de edição: {e}")

    def excluir_produto_selecionado(self, e=None):

        self.log.debug("Iniciando processo de exclusão de produto.")
        try:
            if not self.product_handler.produto_selecionado:
                self._show_snackbar("Nenhum produto selecionado para exclusão", False)
                return

            produto_id = self.product_handler.produto_selecionado.get('id')

            def _excluir_produto(e):
                try:
                    self.log.info(f"Confirmada exclusão do produto ID {produto_id}")
                    success, message = self.product_handler.excluir_produto()
                    self._show_snackbar(message, success)
                    if success:
                        
                        self.data_handler.limpar_cache_paginacao()
                        self.page.close(dialog)
                        self.page.update()
                        time.sleep(0.3)
                        self.carregar_dados_estoque()
                        
                except Exception as e:
                    self._handle_error(f"Erro ao excluir produto: {e}")

            dialog = ft.AlertDialog(
                title=ft.Text("Confirmar Exclusão"),
                content=ft.Text(f"Você tem certeza que deseja excluir o produto com ID {produto_id}?"),
                actions=[
                    ft.TextButton("Cancelar", on_click=lambda e: self.page.close(dialog)),
                    ft.TextButton("Excluir", on_click=_excluir_produto)
                ]
            )

            self.page.dialog = dialog
            self.page.open(dialog)
            self.page.update()
            self.log.debug("Exibido diálogo de confirmação de exclusão.")
        except Exception as e:
            self._handle_error(f"Erro ao preparar exclusão de produto: {e}")

import flet as ft
import time
from typing import Callable, Optional
from controller.estoque.controller_estoque_data_handler import EstoqueDataHandler
from controller.estoque.controller_estoque_product_handler import EstoqueProductHandler
from logs.logger import Logger
from model.estoque.estoque_model import EstoqueModel
from view.estoque.estoque_page_view import EstoquePageView
from components.dialog_produto import DialogProduto

class EstoquePageController:
    """Controlador principal da página de estoque, coordena view, dados e operações"""
    
    def __init__(self, page: ft.Page, estoque_model: EstoqueModel, estoque_view: EstoquePageView):
        self.page = page
        self.estoque_view = estoque_view
        self.estoque_model = estoque_model
        self.log = Logger()
        self._initialize_handlers()
        self._setup_view_callbacks()
        

    def _initialize_handlers(self):
        """Inicializa os handlers de dados e produtos"""
        try:
            self.data_handler = EstoqueDataHandler(self.estoque_model, self.log)
            self.product_handler = EstoqueProductHandler(self.estoque_model, self.log)
            self.log.info("Handlers inicializados com sucesso")
        except Exception as e:
            self._handle_error(f"Falha na inicialização: {e}")

    def _setup_view_callbacks(self):
        """Configura todos os callbacks da view"""
        try:
            # Callbacks de busca e tabela
            self.estoque_view.set_on_buscar(self._handle_busca)
            self.estoque_view.table.set_callback_handle_row_click(
                self.product_handler.selecionar_produto
            )

            # Callbacks da navbar
            self.estoque_view.definir_acoes_botoes_navBar({
                "home": lambda: self.page.go("/"),
                "novo": self._handle_adicionar_produto,
                "editar": self._handle_editar_produto,
                "deletar": self._handle_excluir_produto
            })

            # Callback do rodapé
            self.estoque_view.definir_acoes_botoes_rodape(
                self.carregar_dados_estoque
            )
        except Exception as e:
            self._handle_error(f"Erro configurando callbacks: {e}")

    def exibir_view_estoque(self) -> ft.Control:
        """Exibe a view principal do estoque"""
        self.carregar_dados_estoque()
        return self.estoque_view.create_view_estoque()

    def carregar_dados_estoque(self, pagina: int = 1):
        """Carrega os dados do estoque para uma página específica"""
        try:
            resultado = self.data_handler.listar_produtos_paginados(pagina=pagina)
            self._atualizar_view_com_dados(resultado)
            
            self.page.update()
        except Exception as e:
            self._handle_error(f"Erro carregando dados: {e}")

    def _handle_busca(self, produto: Optional[str] = None):
        """Lida com a busca por nome de produto"""
        try:
            if not produto:
                self.data_handler.limpar_cache_paginacao()
                return self.carregar_dados_estoque()

            resultado = self.data_handler.listar_produtos_paginados(filtros=produto)
            self._processar_resultado_busca(resultado, produto)
        except Exception as e:
            self._handle_error(f"Erro na busca: {e}")

    def _processar_resultado_busca(self, resultado: dict, termo_busca: str):
        """Processa o resultado da busca e atualiza a view"""
        if not resultado.get('dados'):
            self.estoque_view.error_message.value = f"Nenhum produto encontrado para '{termo_busca}'"
        else:
            self.estoque_view.error_message.value = ""
        
        self._atualizar_view_com_dados(resultado)

    def _atualizar_view_com_dados(self, resultado: dict):
        """Atualiza a view com os dados recebidos"""
        try:
            self.estoque_view.rodaPe.total_paginas = resultado.get('total_paginas')
            self.estoque_view.alimentar_Dados(
                resultado.get('colunas', []),
                resultado.get('dados', [])
            )
            self.estoque_view.rodaPe._atualizar_ui()
        except Exception as e:
            self._handle_error(f"Erro atualizando view: {e}")

    def _handle_adicionar_produto(self, e=None):
        """Abre diálogo para adicionar novo produto"""
        dialog = DialogProduto(self.page)
        
        def on_salvar(dados):
            success, message = self.product_handler.adicionar_produto(dados)
            self._finalizar_operacao_produto(success, message, dialog)
            
        dialog.abrir(
            modo_edicao=False,
            on_salvar=on_salvar,
            on_cancelar=lambda: self.log.debug("Adição cancelada")
        )

    def _handle_editar_produto(self, e=None):
        """Abre diálogo para editar produto existente"""
        if not self.product_handler.produto_selecionado:
            return self._show_snackbar("Selecione um produto para editar", False)
            
        dialog = DialogProduto(self.page)
        
        def on_salvar(dados):
            success, message = self.product_handler.editar_produto(dados)
            self._finalizar_operacao_produto(success, message, dialog)
            
        dialog.abrir(
            modo_edicao=True,
            produto=self.product_handler.produto_selecionado,
            on_salvar=on_salvar,
            on_cancelar=lambda: self.log.debug("Edição cancelada")
        )

    def _handle_excluir_produto(self, e=None):
        """Inicia processo de exclusão de produto"""
        if not self.product_handler.produto_selecionado:
            return self._show_snackbar("Selecione um produto para excluir", False)
            
        self._confirmar_exclusao()

    def _confirmar_exclusao(self):
        """Mostra diálogo de confirmação de exclusão"""
        produto_id = self.product_handler.produto_selecionado['id']
        dialog = ft.AlertDialog(
            title=ft.Text("Confirmar Exclusão"),
            content=ft.Text(f"Excluir produto ID {produto_id}?"),
            actions=[
                ft.TextButton("Cancelar", on_click=lambda e: self.page.close(dialog)),
                ft.TextButton("Excluir", on_click=lambda e: self._executar_exclusao(dialog))
            ]
        )
        self.page.dialog = dialog
        dialog.open = True
        self.page.open(self.page.dialog)
        self.page.update()

    def _executar_exclusao(self, dialog):
        """Executa a exclusão após confirmação"""
        success, message = self.product_handler.excluir_produto()
        self._finalizar_operacao_produto(success, message, dialog)

    def _finalizar_operacao_produto(self, success: bool, message: str, dialog=None):
        """Finaliza operações comuns após adição/edição/exclusão"""
        self._show_snackbar(message, success)
        if success:
            if dialog:
                dialog.open = False
                self.page.update()

            self.data_handler.limpar_cache_paginacao()
            time.sleep(0.3)  # Pequeno delay para visualização
            self.carregar_dados_estoque()

    def _show_snackbar(self, message: str, success: bool):
        """Exibe mensagem de feedback"""
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(message),
            bgcolor=ft.Colors.GREEN_300 if success else ft.Colors.RED_300
        )
        self.page.snack_bar.open = True
        self.page.open(self.page.snack_bar)
        self.page.update()

    def _handle_error(self, error_msg: str):
        """Tratamento centralizado de erros"""
        self.log.error(error_msg)
        self.estoque_view.error_message.value = error_msg
        self.page.update()
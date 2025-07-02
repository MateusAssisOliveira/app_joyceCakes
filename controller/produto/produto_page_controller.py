# controller/produto/produto_page_controller.py

import flet as ft
from typing import Optional
from controller.estoque.produto_data_handler import ProdutoDataHandler
from controller.estoque.produto_handler import ProdutoHandler
from model.produto.produto_model import ProdutoModel
from ui.dialogs.produto.dialog_produto import DialogProduto
from logs.logger import Logger
from view.produto.produtos_view import ProdutosView

class ProdutoPageController:
    def __init__(self, page: ft.Page, model: ProdutoModel, view: ProdutosView):
        self.page = page
        self.model = model
        self.view = view
        self.log = Logger()

        self.handler = ProdutoHandler(model, self.log)
        self.data_handler = ProdutoDataHandler(model, self.log)
        
        self._setup_callbacks()

    def _setup_callbacks(self):
        self.view.set_on_buscar(self._handle_busca)
        self.view.definir_acoes_botoes_navBar({
            "novo": self._adicionar,
            "editar": self._editar,
            "deletar": self._excluir,
            "home": lambda: self.page.go("/")
        })

    def exibir(self) -> ft.Control:
        self.carregar_produtos()
        return self.view._build_main_container()

    def carregar_produtos(self, pagina: int = 1):
        dados = self.data_handler.listar_produtos_paginados(pagina)
        self.view.alimentar_Dados(dados)

    def _handle_busca(self, termo: str):
        resultado = self.data_handler.listar_produtos_paginados(filtros=termo)
        self.view.alimentar_Dados(resultado)
        self.page.update()

    def _adicionar(self, e=None):
        dialog = DialogProduto(self.page)

        def on_salvar(dados):
            sucesso, msg = self.handler.adicionar_produto(dados)
            self._finalizar_operacao(sucesso, msg, dialog)

        dialog.abrir(modo_edicao=False, on_salvar=on_salvar)

    def _editar(self, e=None):
        if not self.handler.produto_selecionado:
            return self._snack("Selecione um produto", sucesso=False)
        dialog = DialogProduto(self.page)

        def on_salvar(dados):
            sucesso, msg = self.handler.editar_produto(dados)
            self._finalizar_operacao(sucesso, msg, dialog)

        dialog.abrir(
            modo_edicao=True,
            produto=self.handler.produto_selecionado,
            on_salvar=on_salvar
        )

    def _excluir(self, e=None):
        if not self.handler.produto_selecionado:
            return self._snack("Selecione um produto", sucesso=False)

        dialog = ft.AlertDialog(
            title=ft.Text("Confirmar Exclusão"),
            content=ft.Text("Deseja excluir este produto?"),
            actions=[
                ft.TextButton("Cancelar", on_click=lambda e: self.page.close(dialog)),
                ft.TextButton("Excluir", on_click=lambda e: self._executar_exclusao(dialog))
            ]
        )
        self.page.dialog = dialog
        dialog.open = True
        self.page.update()

    def _executar_exclusao(self, dialog):
        sucesso, msg = self.handler.excluir_produto()
        self._finalizar_operacao(sucesso, msg, dialog)

    def _finalizar_operacao(self, sucesso: bool, msg: str, dialog: Optional[ft.AlertDialog] = None):
        self._snack(msg, sucesso)
        if sucesso and dialog:
            dialog.open = False
        self.carregar_produtos()

    def _snack(self, msg: str, sucesso=True):
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(msg),
            bgcolor=ft.Colors.GREEN_300 if sucesso else ft.Colors.RED_400
        )
        self.page.snack_bar.open = True
        self.page.update()

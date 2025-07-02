import flet as ft
from controller.forms.produto_form_controller import ProdutoFormController
from ui.forms.produto.produto_form_fields import ProdutoFormFields
from logs.logger import Logger
from typing import Optional, Callable, Dict, Any


class DialogProduto:
    def __init__(self, page: ft.Page):
        self.page = page
        self.log = Logger()
        self.fields = ProdutoFormFields()
        self.controller = ProdutoFormController(self.fields)
        self._construir_dialogo()

    def _construir_dialogo(self):
        self.botao_salvar = ft.ElevatedButton("Salvar")
        self.botao_cancelar = ft.TextButton("Cancelar")

        self.dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Produto", size=18, weight=ft.FontWeight.BOLD),
            shape=ft.RoundedRectangleBorder(radius=10),
            content=ft.Container(
                width=450,
                padding=ft.Padding(20, 10, 20, 10),
                content=ft.Column([
                    self.fields.id,
                    self.fields.nome,
                    self.fields.descricao,
                    ft.Row([self.fields.preco, self.fields.estoque_minimo], spacing=20),
                    self.fields.unidade_medida,
                    self.fields.categoria,
                    self.fields.ativo
                ], spacing=10, scroll=ft.ScrollMode.AUTO)
            ),
            actions=[self.botao_cancelar, self.botao_salvar],
            actions_alignment=ft.MainAxisAlignment.END
        )

    def abrir(self, editar=False, produto: Optional[Dict[str, Any]] = None,
              on_salvar: Optional[Callable[[Dict[str, Any]], None]] = None,
              on_cancelar: Optional[Callable[[], None]] = None):

        if editar and produto:
            self.controller.preencher(produto)
            self.dialog.title.value = "Editar Produto"
        else:
            self.controller.limpar()
            self.dialog.title.value = "Novo Produto"

        def salvar(e):
            try:
                dados = self.controller.coletar()
                if on_salvar:
                    on_salvar(dados)
                self.fechar()
            except ValueError as erro:
                self._erro(str(erro))

        def cancelar(e):
            if on_cancelar:
                on_cancelar()
            self.fechar()

        self.botao_salvar.on_click = salvar
        self.botao_cancelar.on_click = cancelar

        self.page.dialog = self.dialog
        self.dialog.open = True
        self.page.update()

    def fechar(self):
        self.dialog.open = False
        self.page.update()

    def _erro(self, mensagem: str):
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem, color=ft.Colors.WHITE),
            bgcolor=ft.Colors.RED_400
        )
        self.page.snack_bar.open = True
        self.page.update()

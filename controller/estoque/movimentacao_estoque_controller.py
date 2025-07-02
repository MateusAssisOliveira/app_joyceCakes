# controller/estoque/movimentacao_estoque_controller.py

import flet as ft
from typing import Optional
from logs.logger import Logger
from model.produto.movimentacao_model import MovimentacaoModel
from view.movimentacao.movimentacao_page_view import MovimentacaoPageView

class MovimentacaoEstoqueController:
    def __init__(self, page: ft.Page, model: MovimentacaoModel, view: MovimentacaoPageView):
        self.page = page
        self.model = model
        self.view = view
        self.log = Logger()

        self._setup_callbacks()

    def _setup_callbacks(self):
        self.view.set_on_entrada(self.registrar_entrada)
        self.view.set_on_saida(self.registrar_saida)
        self.view.set_on_buscar(self.buscar_movimentacoes)

    def exibir(self) -> ft.Control:
        self.carregar_movimentacoes()
        return self.view.create()

    def carregar_movimentacoes(self):
        movimentacoes = self.model.listar_movimentacoes()
        self.view.exibir_movimentacoes(movimentacoes)

    def registrar_entrada(self, dados):
        self.model.registrar(dados, tipo="entrada")
        self._snack("Entrada registrada com sucesso!")
        self.carregar_movimentacoes()

    def registrar_saida(self, dados):
        self.model.registrar(dados, tipo="saida")
        self._snack("Saída registrada com sucesso!")
        self.carregar_movimentacoes()

    def buscar_movimentacoes(self, filtro: Optional[str] = None):
        resultados = self.model.buscar(filtro)
        self.view.exibir_movimentacoes(resultados)

    def _snack(self, msg: str):
        self.page.snack_bar = ft.SnackBar(content=ft.Text(msg), bgcolor=ft.Colors.BLUE_200)
        self.page.snack_bar.open = True
        self.page.update()

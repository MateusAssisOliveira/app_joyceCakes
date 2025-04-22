from venv import logger
import flet as ft
from views.listagem_produtos import ListagemProdutos

class NavebarSuperiorEstoque(ft.Column):
    def __init__(self, acoes=None):
        super().__init__()
        self.acoes = acoes 
        self.campo_busca = ft.TextField(label="Buscar produto...")

        self.controls = [
            ft.Row([
                ft.Text("Estoque", size=24, weight="bold"),
                ft.Icon(name=ft.icons.STORE),
            ], alignment="spaceBetween"),

            ft.Row([
                self.campo_busca,
                ft.ElevatedButton("Buscar", icon=ft.icons.SEARCH, on_click=self.buscar_produto),
                ft.ElevatedButton("Novo Produto", icon=ft.icons.ADD, on_click=acoes.adicionar),
                ft.ElevatedButton("Editar Produto", icon=ft.icons.EDIT, on_click=acoes.editar),
                ft.ElevatedButton("Remover Produto", icon=ft.icons.DELETE, on_click=acoes.remover),
                
            ], alignment="start", spacing=10)
        ]
    def buscar_produto(self, e):
        termo = self.campo_busca.value.strip().lower()
        if termo == "":
            self.acoes.buscar(e)
            logger.info(e)
        else:
            self.acoes.buscar(termo)
        self.campo_busca.value = termo
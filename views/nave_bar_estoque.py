import flet as ft
from views.listagem_produtos import ListagemProdutos

class NavebarSuperiorEstoque(ft.Column):
    def __init__(self, on_add_produto=None):
        super().__init__()

        self.campo_busca = ft.TextField(label="Buscar produto...")

        self.controls = [
            ft.Row([
                ft.Text("Estoque", size=24, weight="bold"),
                ft.Icon(name=ft.icons.STORE),
            ], alignment="spaceBetween"),

            ft.Row([
                self.campo_busca,
                ft.ElevatedButton("Buscar", icon=ft.icons.SEARCH, on_click=self.buscar_produto),
                ft.ElevatedButton("Novo Produto", icon=ft.icons.ADD, on_click=on_add_produto),
            ], alignment="start", spacing=10)
        ]

    def buscar_produto(self, e):
        termo = self.campo_busca.value.strip().lower()
        print(f"🔍 Buscando produto com termo: {termo}")

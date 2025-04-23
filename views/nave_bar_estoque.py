import flet as ft

class NavebarSuperiorEstoque(ft.Column):
    def __init__(self, on_adicionar, on_buscar, on_editar, on_remover):
        super().__init__()
        self.campo_busca = ft.TextField(
            label="Buscar produto...",
            on_submit=lambda e: on_buscar(self.campo_busca.value)
        )

        self.controls = [
            ft.Row([
                ft.Text("Estoque", size=24, weight="bold"),
                ft.Icon(name=ft.icons.STORE),
            ], alignment="spaceBetween"),

            ft.Row([
                self.campo_busca,
                ft.ElevatedButton(
                    "Buscar", 
                    icon=ft.icons.SEARCH, 
                    on_click=lambda e: on_buscar(self.campo_busca.value)
                ),
                ft.ElevatedButton(
                    "Novo Produto", 
                    icon=ft.icons.ADD, 
                    on_click=on_adicionar
                ),
                ft.ElevatedButton(
                    "Editar Produto", 
                    icon=ft.icons.EDIT, 
                    on_click=on_editar
                ),
                ft.ElevatedButton(
                    "Remover Produto", 
                    icon=ft.icons.DELETE, 
                    on_click=on_remover
                ),
            ], alignment="start", spacing=10)
        ]
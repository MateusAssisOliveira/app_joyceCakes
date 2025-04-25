import flet as ft

class NavBar(ft.Row):
    def __init__(self, page: ft.Page, actions: dict):
        """
        Cria uma barra de navegação genérica
        
        Args:
            page: referência à página Flet
            actions: dicionário no formato {ícone: função}
                    Exemplo: {ft.icons.ADD: lambda e: print("Adicionar")}
        """
        super().__init__()
        self.page = page
        self.alignment = ft.MainAxisAlignment.SPACE_BETWEEN
        self.controls = [
            ft.Row([
                self._create_action_button(icon, callback)
                for icon, callback in actions.items()
            ]),
            ft.Text("Controle de Estoque - Joyce Cakes", size=18, weight=ft.FontWeight.BOLD)
        ]
    
    def _create_action_button(self, icon, callback):
        return ft.IconButton(
            icon=icon,
            on_click=callback,
            icon_size=30,
            tooltip=icon.split(".")[-1].capitalize(),
            style=ft.ButtonStyle(
                shape=ft.CircleBorder(),
                padding=15
            )
        )
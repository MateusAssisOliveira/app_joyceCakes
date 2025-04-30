import flet as ft

class NavBar(ft.Row):
    def __init__(self, page: ft.Page, actions: dict):
        """
        Cria uma barra de navegação genérica com ícones personalizados.
        
        Args:
            page: referência à página Flet
            actions: dicionário no formato {ícone: função}
        """
        super().__init__()
        self.page = page
        self.alignment = ft.MainAxisAlignment.SPACE_BETWEEN
        
        size_icons = 20  # <<<<< Aqui você define o tamanho padrão dos ícones
        padding_icons = 10  # <<<<< E aqui o padding interno do botão

        self.controls = [
            ft.Row([
                self._create_action_button(icon, callback, size_icons, padding_icons)
                for icon, callback in actions.items()
            ])
        ]
    
    def _create_action_button(self, icon, callback, size_icons, padding_icons):
        return ft.IconButton(
            icon=icon,
            on_click=callback,
            icon_size=size_icons,
            tooltip=icon.split(".")[-1].capitalize(),
            style=ft.ButtonStyle(
                shape=ft.CircleBorder(),
                padding=padding_icons
            )
        )

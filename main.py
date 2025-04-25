import flet as ft
from views.estoque_view import EstoqueView
from controllers.estoque_controller import EstoqueController

def main(page: ft.Page):
    # Configuração da página
    page.title = "Controle de Estoque - Joyce Cakes"
    page.padding = 0
    page.scroll = ft.ScrollMode.AUTO
    page.window_min_width = 1000
    page.window_min_height = 600
    
    # Configuração do tema
    page.theme = ft.Theme(
        color_scheme=ft.ColorScheme(
            primary=ft.colors.BLUE,
            secondary=ft.colors.GREEN,
        ),
    )
    
    # Criação das instâncias
    estoque_view = EstoqueView(page)
    estoque_controller = EstoqueController(estoque_view)
    estoque_view.set_controller(estoque_controller)
    
    # Layout principal
    page.add(
        ft.Container(
            content=estoque_view,
            padding=20,
            expand=True
        )
    )

ft.app(target=main)
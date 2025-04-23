import flet as ft
from views.estoque import Estoque

def main(page: ft.Page):
    # Configuração da página
    page.title = "Controle de Estoque - Joyce Cakes"
    page.padding = 0  # Removemos o padding da página
    page.scroll = ft.ScrollMode.AUTO
    page.window_min_width = 1000  # Largura mínima da janela
    page.window_min_height = 600  # Altura mínima da janela
    
    # Configuração do tema (opcional)
    page.theme = ft.Theme(
        color_scheme=ft.ColorScheme(
            primary=ft.colors.BLUE,
            secondary=ft.colors.GREEN,
        ),
    )
    
    estoque_view = Estoque(page)
    
    # Usamos um Container para controlar o padding geral
    page.add(
        ft.Container(
            content=estoque_view,
            padding=20,
            expand=True
        )
    )

ft.app(target=main)
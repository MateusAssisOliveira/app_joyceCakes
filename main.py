import flet as ft
from controller.routes.route_controller import RouteController

def main(page: ft.Page):
    page.title = "Sistema"
    page.scroll = "auto"
    page.theme_mode = ft.ThemeMode.LIGHT

    # Inicia o sistema de rotas
    router = RouteController(page)
    page.on_route_change = router.route_change

    # Vai para a rota atual (ou "/" se nenhuma)
    page.go(page.route or "/receitas")

ft.app(target=main)
import flet as ft

from router.router import Router

class App:
    def __init__(self, page: ft.Page):
        self.page = page
        self.router = Router(page)

        # Configurações do app
        self.page.title = "App com Menu Lateral"
        self.page.theme_mode = "light"
        self.page.window_width = 800
        self.page.window_height = 600

        # Define o comportamento de mudança de rota
        self.page.on_route_change = self.route_change
        self.page.go("/pagina1")  # Inicializa a página com a primeira rota

    def route_change(self, e):
        # Limpa a visualização atual
        self.page.views.clear()

        # Adiciona a nova visualização com base na rota
        self.page.views.append(self.router.build_view(self.page.route))
        self.page.update()
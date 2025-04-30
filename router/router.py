import flet as ft

from controllers.estoque_controller import EstoqueController
from views.estoque_view import EstoqueView

# Classe Router para controle de rotas
class Router:
    def __init__(self, page: ft.Page):
        self.page = page
        self.routes = {
            "/estoque": self.estoque_view,
            "/home": self.home_view,
        }
    
    def route_change(self, route):
        self.page.views.clear()
        
        # Obtém a função de visualização com base na rota
        view_function = self.routes.get(route.route, self.not_found_view)
        
        # Chama a função de visualização e adiciona à página
        self.page.views.append(view_function())
        
        self.page.update()
    
    def estoque_view(self):
        # Cria a view de estoque
        estoque_view = EstoqueView(self.page)
        estoque_controller = EstoqueController(estoque_view)
        estoque_view.set_controller(estoque_controller)
        
        return ft.View(
            "/estoque",
            controls=[
                ft.Row(
                    [
                        ft.IconButton(
                            icon=ft.icons.HOME,
                            tooltip="Ir para Home",
                            on_click=lambda _: self.page.go("/home"),
                            padding=0
                        )
                    ]
                ),
                ft.Container(
                    content=estoque_view,
                    padding=20,
                    expand=True
                )
            ]
        )
    
    def home_view(self):
        return ft.View(
            "/home",
            [
                ft.AppBar(title=ft.Text("Configurações"), bgcolor=ft.colors.SURFACE_VARIANT),
                ft.ElevatedButton(
                    "Voltar para Estoque",
                    on_click=lambda _: self.page.go("/estoque")
                ),
            ],
        )
    
    def not_found_view(self):
        return ft.View(
            "/404",
            [
                ft.AppBar(title=ft.Text("404 - Página não encontrada")),
                ft.Text("A página que você está procurando não existe."),
                ft.ElevatedButton(
                    "Voltar para Estoque",
                    on_click=lambda _: self.page.go("/estoque")
                ),
            ],
        )

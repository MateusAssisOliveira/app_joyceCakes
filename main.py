import flet as ft
<<<<<<< HEAD
from router.router import Router
from views.estoque_view import EstoqueView
from controllers.estoque_controller import EstoqueController



# Função principal para rodar o app
def main(page: ft.Page):
    # Configuração da página
    #page.title = "Controle de Estoque - Joyce Cakes"
    page.padding = 0
    page.window_min_width = 1000
    page.window_min_height = 600
    
    # Configuração do tema
    page.theme = ft.Theme(
        color_scheme=ft.ColorScheme(
            primary=ft.colors.BLUE,
            secondary=ft.colors.GREEN,
        ),
    )
    
    # Instancia o Router para controle de rotas
    router = Router(page)

    # Define o comportamento de mudança de rota
    def route_change(e):
        router.route_change(e)

    page.on_route_change = route_change
    
    # Começa pela rota inicial (estoque)
    page.go("/estoque")


# Roda o app
ft.app(target=main)
=======
from views.estoque import Estoque

def main(page: ft.Page):
    page.title = "Controle de Estoque - Joyce Cakes"
    page.padding = 20
    page.scroll = True

    estoque_view = Estoque(page)
    page.add(estoque_view)

ft.app(target=main)
>>>>>>> f08f16e695d0881e7c5fcdaa28b14b86b2e789f1

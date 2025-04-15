import flet as ft
from views.estoque import Estoque

def main(page: ft.Page):
    page.title = "Controle de Estoque - Joyce Cakes"
    page.padding = 20
    page.scroll = True

    estoque_view = Estoque(page)
    page.add(estoque_view)

ft.app(target=main)

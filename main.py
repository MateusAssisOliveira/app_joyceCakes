import flet as ft
from page.estoque_page import EstoquePage

def main(page: ft.Page):
    page.title = "Sistema"
    page.scroll = "auto"
    
    estoque_page = EstoquePage(page)
    estoque_page.start()

ft.app(target=main)

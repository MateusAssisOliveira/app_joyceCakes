import flet as ft
from views.listagem_produtos import ListagemProdutos

def main(page: ft.Page):
    page.title = "Controle de Estoque - Produtos"
    
    lista_produtos = ListagemProdutos()
    
    page.add(lista_produtos.build())
    
ft.app(target=main)

import flet as ft
from logs.logger import Logger
from ui.forms.ingrediente.ingrediente_data import IngredienteData


class IngredienteUI:
    """Classe responsável por criar e gerenciar componentes UI de ingredientes"""
    def __init__(self, page: ft.Page, logger: Logger):
        self.page = page
        self.log = logger
    
    def criar_campo_pesquisa(self) -> ft.TextField:
        """Cria o campo de pesquisa de ingredientes"""
        return ft.TextField(
            label="Pesquisar ingrediente",
            height=30,
            expand=True,
            text_align=ft.TextAlign.LEFT,
            text_size=12
        )
    def criar_campo_valor_medida(self):
        return ft.TextField(
            label="Valor da medida ingrediente",
            height=30,
            expand=True,
            text_align=ft.TextAlign.LEFT,
            text_size=12
        )
    
    def criar_lista_sugestoes(self) -> ft.ListView:
        """Cria a lista de sugestões de pesquisa"""
        return ft.ListView(
            height=100,
            visible=False,
            padding=ft.padding.symmetric(vertical=5),
        )
    
    def criar_botao_adicionar(self) -> ft.IconButton:
        """Cria o botão de adicionar ingrediente"""
        return ft.IconButton(icon=ft.Icons.ADD)
    
    def criar_painel_sugestoes(self, suggestions_list: ft.ListView) -> ft.Container:
        """Cria o container do painel de sugestões"""
        return ft.Container(
            content=suggestions_list,
            border=ft.border.all(1, ft.Colors.GREY_300),
            border_radius=5,
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=5,
                color=ft.Colors.BLACK26,
                offset=ft.Offset(0, 3),
            )
        )
    
    def criar_card_ingrediente(self, ingrediente: IngredienteData,quantidade) -> ft.Card:
        """Cria um card visual para representar um ingrediente"""
        campo_receita_medida = ft.Container(
            content = ft.Text(f"{ingrediente['nome_produto']} {quantidade} {ingrediente.get('simbolo', '') }"),
        )
        
        container = ft.Container(
            content=ft.Column([
                ft.ListTile(title=campo_receita_medida),
            ]),
            padding=10,
        )
        
        return ft.Card(content=container, data=ingrediente)
    
    def criar_item_sugestao(self, produto: IngredienteData) -> ft.ListTile:
        """Cria um item da lista de sugestões"""
        return ft.ListTile(
            title=ft.Text(produto["nome_produto"]),
        )
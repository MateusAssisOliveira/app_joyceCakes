import flet as ft
from views.nave_bar_estoque import NavebarSuperiorEstoque
from views.listagem_produtos import ListagemProdutos
from views.cadastro_produto_view import CadastroProduto
from components.navbar import NavBar


class EstoqueView(ft.Column):
    def __init__(self, page: ft.Page):
        super().__init__()
        self.page = page
        self.expand = True
        self.spacing = 20
                
        # Componentes da interface
        self.tabela = ListagemProdutos(self.page)
        self.cadastro_produto_class = CadastroProduto
        self.navbar = None  # Será configurado após ter o controller
        
        self.controls = [
            ft.Divider(height=1, thickness=1),
            ft.Container(
                content=self.tabela.content,
                expand=True,
                padding=ft.padding.symmetric(horizontal=20)
            )
        ]
        
    def set_controller(self, controller):
        """Configura o controller e completa a inicialização"""
        self.controller = controller
        
        # Cria a navbar genérica com as ações do estoque
        self.navbar = NavBar(
            page=self.page,
            actions={
                ft.icons.SEARCH: lambda e: self.controller.buscar_produto(self.navbar.controls[0].controls[0].value),
                ft.icons.ADD: lambda e: self.controller.adicionar_produto(),
                ft.icons.EDIT: lambda e: self.controller.editar_produto(),
                ft.icons.DELETE: lambda e: self.controller.remover_produto(),
                ft.icons.REFRESH: lambda e: self.controller.atualizar_tabela()
            }
        )
        
        # Adiciona um campo de busca à navbar
        self.navbar.controls[0].controls.insert(
            0,
            ft.TextField(
                hint_text="Buscar produto...",
                width=300,
                on_submit=lambda e: self.controller.buscar_produto(e.control.value),
            )
        )
        
        # Insere a navbar no início dos controles
        self.controls.insert(0, self.navbar)
        self.page.update()
        
    def abrir_dialogo(self, dialogo):
        """Abre um diálogo na página"""
        try:
            dialogo.open = True
            if dialogo not in self.page.overlay:
                self.page.overlay.append(dialogo)
            self.page.update()
        except Exception as e:
            self.mostrar_mensagem(f"Erro ao abrir diálogo: {str(e)}", "erro")

    def mostrar_mensagem(self, mensagem, tipo="erro"):
        """Exibe uma mensagem na interface"""
        cores = {
            "erro": ft.colors.RED,
            "sucesso": ft.colors.GREEN,
            "aviso": ft.colors.AMBER
        }
        self.page.snack_bar = ft.SnackBar(
            content=ft.Text(mensagem),
            bgcolor=cores.get(tipo, ft.colors.RED)
        )
        self.page.snack_bar.open = True
        self.page.update()
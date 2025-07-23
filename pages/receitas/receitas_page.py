# view/receitas/receitas_page.py
import flet as ft
from controller.page_receitas.controller_receitas_page import ReceitasPageController
from database.db import Database
from view.receitas.receitas_page_view import ReceitasPageView
from model.receitas.receitas_model import ReceitasModel
from logs.logger import Logger

class ReceitasPage:
    def __init__(self, page: ft.Page):
        self.log = Logger()
        self.page = page
        self.log.info("Iniciando ReceitasPage...")

        # Inicializa os componentes do padrão MVC
        self.data_base = Database()
        self._receitas_model = ReceitasModel(self.data_base, self.log)
        self._receitas_view = ReceitasPageView()
        
        # Primeiro cria a view básica
        self._receitas_view.create_view()
        
        # Depois cria o controller
        self.controller = ReceitasPageController(
            page=self.page,
            receitas_model=self._receitas_model,
            receitas_view=self._receitas_view
        )

        self.log.info("ReceitasPageController criado com sucesso.")

    def start(self) -> None:
        """Inicia a página de receitas, configurando a interface do usuário"""
        self.log.debug("Método start() chamado. Exibindo view das receitas.")
        
        # Limpa os controles anteriores da página
        self.page.controls.clear()

        # Garante que a view está criada antes de carregar dados
        view_content = self._receitas_view.create_view()
        self.page.add(ft.Column(controls=[view_content], expand=True))
        
        # Carrega os dados após a view estar pronta
        self.controller.carregar_dados_receitas()
        self.page.update()

        self.log.info("View de receitas adicionada à página.")

    def as_view(self) -> ft.View:
        """Retorna a tela de receitas como uma View para navegação com rotas"""
        self.log.debug("Criando view para navegação por rotas")
        
        # Garante que a view está criada antes de carregar dados
        view_content = self._receitas_view.create_view()
        
        view = ft.View(
            route="/receitas",
            controls=[
                ft.Column(
                    controls=[view_content],
                    expand=True
                )
            ]
        )
        
        # Carrega os dados após a view estar pronta
        self.controller.carregar_dados_receitas()
        
        self.page.views.clear()
        self.page.views.append(view)
        self.page.update()
        
        return view
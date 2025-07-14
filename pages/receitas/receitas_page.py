# view/receitas/receitas_page.py
import flet as ft
from controller.page_receitas.controller_receitas_page import ReceitasPageController
from view.receitas.receitas_page_view import ReceitasPageView
from model.receitas.receitas_model import ReceitasModel
from logs.logger import Logger

class ReceitasPage:
    def __init__(self, page: ft.Page):
        self.log = Logger()  # Instância do logger
        self.page = page

        self.log.info("Iniciando ReceitasPage...")

        # Inicializa os componentes do padrão MVC
        self._receitas_model = ReceitasModel()
        self._receitas_view = ReceitasPageView()
        
        # Cria o controller com as dependências injetadas
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

        # Adiciona a nova view usando o controller
        self.page.add(
            ft.Column(
                controls=[self.controller.exibir_view_receitas()],
                expand=True
            )
        )

        # Atualiza a interface
        self.page.update()

        self.log.info("View de receitas adicionada à página.")

    def as_view(self) -> ft.View:
        """Retorna a tela de receitas como uma View para navegação com rotas"""
        self.page.controls.clear()

        view = ft.View(
            route="/receitas",
            controls=[
                ft.Column(
                    controls=[self.controller.exibir_view_receitas()],
                    expand=True
                )
            ]
        )
        self.page.views.clear()
        self.page.views.append(view)
        self.page.update()
        
        return view
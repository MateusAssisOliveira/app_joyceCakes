import flet as ft
from controller.controller_page_estoque import EstoquePageController
from view.estoque_page_view import EstoquePageView
from model.estoque_model import EstoqueModel
from logs.logger import Logger

class EstoquePage:
    def __init__(self, page):
        self.log = Logger()  # Instância do logger
        self.page = page

        self.log.info("Iniciando EstoquePage...")

        self._estoque_model = EstoqueModel()
        self._estoque_view = EstoquePageView()
        self.controller = EstoquePageController(page, self._estoque_model, self._estoque_view)

        self.log.info("EstoquePageController criado com sucesso.")

    def start(self):
        self.log.debug("Método start() chamado. Exibindo view do estoque.")
        
        # Limpa os controles anteriores da página
        self.page.controls.clear()

        # Adiciona a nova view
        self.page.add(
            ft.Column(
                controls=[self.controller.exibir_view_estoque()],
                expand=True
            )
        )

        # Atualiza a interface
        self.page.update()

        self.log.info("View de estoque adicionada à página.")
        self.log.info(self.controller.listar_produtos_paginados())

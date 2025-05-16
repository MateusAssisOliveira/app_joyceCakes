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

        _estoque_model = EstoqueModel()
        _estoque_view = EstoquePageView()
        self.controller = EstoquePageController(_estoque_model, _estoque_view)

        self.log.info("EstoquePageController criado com sucesso.")

    def start(self):
        self.log.debug("Método start() chamado. Exibindo view do estoque.")
        
        # Adicionando a view de estoque com um layout expansível (para expandir com a tela)
        self.page.add(
            ft.Column(
                controls=[
                    self.controller.exibir_view_estoque()
                ],
                expand=True
            )
        )
        
        self.log.info("View de estoque adicionada à página.")
        self.log.info(self.controller.listar_produtos_paginados())

        

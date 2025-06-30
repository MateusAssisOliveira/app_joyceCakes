from controller.estoque.controller_estoque_data_handler import EstoqueDataHandler
from controller.estoque.controller_page_estoque import EstoquePageController
from model.estoque.estoque_model import EstoqueModel


class ProdutoService:
    @staticmethod
    def listar_para_dropdown():
        return EstoqueDataHandler(EstoqueModel())._obter_todos_dados_prdoutos()

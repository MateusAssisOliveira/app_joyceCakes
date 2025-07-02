from controller.estoque.produto_data_handler import ProdutoDataHandler
from model.produto.produto_model import ProdutoModel


class ProdutoService:
    @staticmethod
    def listar_para_dropdown():
        return ProdutoDataHandler(ProdutoModel())._obter_todos_dados_prdoutos()

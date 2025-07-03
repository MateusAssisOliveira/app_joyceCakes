from controller.estoque.produto_data_handler import ProdutoDataHandler
from model.produto.produto_model import ProdutoModel
from database.db import Database



class ProdutoService:
    @staticmethod
    def listar_para_dropdown():
        db = Database()
        return ProdutoDataHandler(ProdutoModel(db))._obter_todos_dados_prdoutos()

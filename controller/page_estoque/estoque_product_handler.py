from logs.logger import Logger
from model.estoque_model import EstoqueModel


class EstoqueProductHandler:
    """Classe para lidar com operações específicas de produtos"""
    def __init__(self, estoque_model: EstoqueModel, logger: Logger):
        self.estoque_model = estoque_model
        self.log = logger

    def adicionar_produto(self, dados):
        try:
            dados["quantidade"] = int(dados["quantidade"])
            self.estoque_model.adicionar(dados)
            return True, "Produto adicionado com sucesso!"
        except Exception as e:
            self.log.error(f"Erro ao salvar produto: {e}")
            return False, f"Erro ao salvar: {str(e)}"

    def editar_produto(self, produto_id, dados):
        # Implementar lógica de edição
        pass

    def excluir_produto(self, produto_id):
        try:
            self.estoque_model.deletar_produto(produto_id)
            return True, f"Produto com ID {produto_id} excluído com sucesso."
        except Exception as e:
            self.log.error(f"Erro ao excluir produto: {e}")
            return False, f"Erro ao excluir produto: {e}"
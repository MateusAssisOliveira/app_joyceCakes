from typing import Dict, Any, Optional, Tuple
from logs.logger import Logger
from model.estoque.estoque_model import EstoqueModel

class EstoqueProductHandler:
    """Handler para operações específicas de produtos"""
    
    def __init__(self, estoque_model: EstoqueModel, logger: Logger):
        self.estoque_model = estoque_model
        self.log = logger
        self.produto_selecionado: Optional[Dict[str, Any]] = None

    def selecionar_produto(self, produto_data: Dict[str, Any]):
        """Seleciona um produto para operações futuras"""
        self.produto_selecionado = produto_data
        self.log.info(f"Produto selecionado - ID: {produto_data.get('id')}")

    def adicionar_produto(self, dados: Dict[str, Any]) -> Tuple[bool, str]:
        """Adiciona um novo produto ao estoque"""
        try:
            dados["quantidade"] = int(dados["quantidade"])
            if self.estoque_model.adicionar(dados):
                return True, "Produto adicionado com sucesso!"
            return False, "Falha ao adicionar produto"
        except Exception as e:
            return False, f"Erro: {str(e)}"

    def editar_produto(self, novos_dados: Dict[str, Any]) -> Tuple[bool, str]:
        """Edita o produto selecionado"""
        if not self.produto_selecionado:
            return False, "Nenhum produto selecionado"
            
        try:
            produto_id = self.produto_selecionado['id']
            dados_atualizados = {**self.produto_selecionado, **novos_dados}
            self.estoque_model.atualizar(produto_id, dados_atualizados)
            self.produto_selecionado = None
            return True, "Produto atualizado!"
        except Exception as e:
            return False, f"Erro: {str(e)}"

    def excluir_produto(self) -> Tuple[bool, str]:
        """Exclui o produto selecionado"""
        if not self.produto_selecionado:
            return False, "Nenhum produto selecionado"
            
        try:
            produto_id = self.produto_selecionado['id']
            self.estoque_model.excluir(produto_id)
            self.produto_selecionado = None
            return True, f"Produto ID {produto_id} excluído!"
        except Exception as e:
            return False, f"Erro: {str(e)}"
from logs.logger import Logger
from model.estoque_model import EstoqueModel
from typing import Optional, Dict, Any

class EstoqueProductHandler:
    """Classe para lidar com operações específicas de produtos"""
    def __init__(self, estoque_model: EstoqueModel, logger: Logger):
        self.estoque_model = estoque_model
        self.log = logger
        self.produto_selecionado: Optional[Dict[str, Any]] = None  # Armazena a linha selecionada

    def adicionar_produto(self, dados: Dict[str, Any]) -> tuple[bool, str]:
        """Adiciona um novo produto ao estoque"""
        try:
            dados["quantidade"] = int(dados["quantidade"])
            self.estoque_model.adicionar(dados)
            return True, "Produto adicionado com sucesso!"
        except Exception as e:
            self.log.error(f"Erro ao salvar produto: {e}")
            return False, f"Erro ao salvar: {str(e)}"

    def selecionar_produto(self, produto_data: Dict[str, Any]):
        """Armazena o produto selecionado para edição posterior"""
        self.produto_selecionado = produto_data
        self.log.info(f"Produto selecionado: ID {produto_data.get('id')}")

    def editar_produto(self, novos_dados: Dict[str, Any]) -> tuple[bool, str]:
        """Edita o produto previamente selecionado"""
        if not self.produto_selecionado:
            return False, "Nenhum produto selecionado para edição"

        try:
            produto_id = self.produto_selecionado['id']
            
            # Atualiza apenas os campos fornecidos em novos_dados
            dados_atualizados = {**self.produto_selecionado, **novos_dados}
            
            self.estoque_model.atualizar(produto_id, dados_atualizados)
            self.produto_selecionado = None  # Limpa a seleção após editar
            return True, "Produto atualizado com sucesso!"
        except Exception as e:
            self.log.error(f"Erro ao editar produto: {e}")
            return False, f"Erro ao editar: {str(e)}"

    def excluir_produto(self, produto_id: Optional[int] = None) -> tuple[bool, str]:
        """Exclui o produto selecionado ou um específico por ID"""
        try:
            id_a_excluir = produto_id or (self.produto_selecionado['id'] if self.produto_selecionado else None)
            
            if not id_a_excluir:
                return False, "Nenhum produto especificado para exclusão"
            
            self.estoque_model.deletar_produto(id_a_excluir)
            
            # Se estava excluindo o produto selecionado, limpa a seleção
            if self.produto_selecionado and self.produto_selecionado['id'] == id_a_excluir:
                self.produto_selecionado = None
                
            return True, f"Produto com ID {id_a_excluir} excluído com sucesso."
        except Exception as e:
            self.log.error(f"Erro ao excluir produto: {e}")
            return False, f"Erro ao excluir produto: {e}"
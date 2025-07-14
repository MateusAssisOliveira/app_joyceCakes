from model.receitas.receitas_model import ReceitasModel
from logs.logger import Logger
from typing import Optional, Callable, Dict, Any, List, Tuple



class ReceitastHandler:
    def __init__(self,receitas_model :ReceitasModel, logger :Logger):
        self.receitas_model = receitas_model
        self.log = logger
        self.receita_selecionada: Optional[Dict[str, Any]] = None
        pass

    def selecionar_receita(self, receita_data: Dict[str, Any]):
        """Seleciona um receita para operações futuras"""
        self.receita_selecionada = receita_data
        self.log.info(f"receita selecionado - ID: {receita_data.get('id')}")

    def adicionar_receita(self, dados: Dict[str, Any]) -> Tuple[bool, str]:
        """Adiciona um novo receita ao estoque"""
        try:
            dados["quantidade"] = int(dados["quantidade"])
            if self.receitas_model.adicionar_receita(dados):
                return True, "receita adicionado com sucesso!"
            return False, "Falha ao adicionar receita"
        except Exception as e:
            return False, f"Erro: {str(e)}"

    def editar_receita(self, novos_dados: Dict[str, Any]) -> Tuple[bool, str]:
        """Edita o receita selecionado"""
        if not self.receita_selecionado:
            return False, "Nenhum receita selecionado"
            
        try:
            receita_id = self.receita_selecionado['id']
            dados_atualizados = {**self.receita_selecionado, **novos_dados}
            self.receitas_model.atualizar(receita_id, dados_atualizados)
            self.receita_selecionado = None
            return True, "receita atualizado!"
        except Exception as e:
            return False, f"Erro: {str(e)}"

    def excluir_receita(self) -> Tuple[bool, str]:
        """Exclui o receita selecionado"""
        if not self.receita_selecionado:
            return False, "Nenhum receita selecionado"
            
        try:
            receita_id = self.receita_selecionado['id']
            self.receitas_model.excluir(receita_id)
            self.receita_selecionado = None
            return True, f"receita ID {receita_id} excluído!"
        except Exception as e:
            return False, f"Erro: {str(e)}"
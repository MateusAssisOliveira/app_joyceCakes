from typing import List

from logs.logger import Logger
from ui.forms.add_ingrediente_dialog_receita.ingrediente_data import IngredienteData


class IngredienteService:
    """Classe responsável pela lógica de negócio relacionada a ingredientes"""
    def __init__(self, produtos: List[IngredienteData], logger: Logger):
        self.produtos = produtos
        self.log = logger

        
    
    def pesquisar_ingredientes(self, termo: str) -> List[IngredienteData]:

        self.log.info(f'TODOS DOS PRODUTOS DO IngredienteService {self.produtos}')
        
        """Pesquisa ingredientes com base no termo fornecido"""
        self.log.debug(f"\nPesquisando ingredientes para: '{termo}'")
        
        if len(termo) < 2:
            return []
        
        termo = termo.lower()
        return [
            p for p in self.produtos 
            if termo in p["nome_produto"].lower()
        ][:5]
    
    def validar_ingrediente(self, nome: str) -> IngredienteData:
        """Valida e normaliza um ingrediente"""
        if not nome.strip():
            raise ValueError("Nome do ingrediente não pode ser vazio")
        
        ingrediente = next(
            (p for p in self.produtos if p['nome_produto'].lower() == nome.lower()), 
            None
        )
        
        if not ingrediente:
            self.log.warning(f"Ingrediente '{nome}' não encontrado na lista de produtos")
            return {'nome_produto': nome, 'simbolo': ''}
        
        return ingrediente
from typing import List, Dict, Any
from logs.logger import Logger
from ui.forms.add_ingrediente_dialog_receita.ingrediente_data import IngredienteData
from util.retornos import Retorno


class IngredienteService:
    """Classe responsável pela lógica de negócio relacionada a ingredientes"""
    def __init__(self, produtos: List[IngredienteData], logger: Logger):
        self.produtos = produtos
        self.log = logger
        self.log.info("IngredienteService inicializado")

    def pesquisar_ingredientes(self, termo: str) -> Dict[str, Any]:
        """Pesquisa ingredientes com base no termo fornecido
        
        Args:
            termo: Termo de pesquisa
            
        Returns:
            Dict[str, Any]: Retorno padronizado com lista de ingredientes ou erro
        """
        try:
            self.log.info(f"Pesquisando ingredientes para: '{termo}'")
            self.log.debug(f"Bloco em que ocorrera a pesquisa : {self.produtos}")


            
            # 1. Validação da estrutura de dados
            if not isinstance(self.produtos, list):
                error_msg = "Estrutura de dados inválida - lista de produtos não encontrada"
                self.log.error(error_msg)
                return Retorno.erro(error_msg)
            
            # 2. Validação do termo
            if len(termo) < 2:
                return Retorno.sucesso("Termo muito curto, retornando lista vazia", [])
            
            termo = termo.lower()
            
            # 3. Filtragem segura dos produtos
            resultados = []
            for produto in self.produtos:
                try:
                    if termo in produto.get("nome_produto", "").lower():
                        resultados.append(produto)

                except (AttributeError, TypeError) as e:
                    self.log.warning(f"Produto com estrutura inválida: {str(e)}")
                    continue
            
            # Limita a 5 resultados
            resultados = resultados[:5]
            
            self.log.debug(f"Encontrados {len(resultados)} resultados para '{termo}'")
            return Retorno.sucesso("Pesquisa concluída com sucesso", resultados)
            
        except Exception as e:
            error_msg = f"Erro ao pesquisar ingredientes: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def validar_ingrediente(self, nome: str) -> Dict[str, Any]:
        """
        Valida e normaliza um ingrediente
        
        Args:
            nome: Nome do ingrediente a validar
            
        Returns:
            Dict[str, Any]: Retorno padronizado com dados do ingrediente ou erro
        """
        try:
            if not nome.strip():
                return Retorno.dados_invalidos("Nome do ingrediente não pode ser vazio")
            
            ingrediente = next(
                (p for p in self.produtos if p['nome_produto'].lower() == nome.lower()), 
                None
            )
            
            if not ingrediente:
                self.log.warning(f"Ingrediente '{nome}' não encontrado na lista de produtos")
                return Retorno.sucesso(
                    "Ingrediente não encontrado, retornando dados básicos",
                    {'nome_produto': nome, 'simbolo': ''}
                )
            
            return Retorno.sucesso("Ingrediente validado com sucesso", ingrediente)
            
        except Exception as e:
            error_msg = f"Erro ao validar ingrediente: {str(e)}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
from typing import Dict, Any, Optional
from logs.logger import Logger
from model.produto.produto_model import ProdutoModel
from util.retornos import Retorno

class ProdutoDataHandler:
    """Handler para operações de dados do estoque com suporte a paginação e cache"""
    
    def __init__(self, produto_model: ProdutoModel, logger: Optional[Logger] = None):
        self.produto_model = produto_model
        self.log = logger if logger else Logger()
        self._cache_paginacao = {}
        self.log.info("ProdutoDataHandler inicializado")

    def listar_produtos_paginados(self, pagina: int = 1, **kwargs) -> Dict[str, Any]:
        """Lista produtos com paginação e cache"""
        chave_cache = self._gerar_chave_cache(pagina, kwargs)
        
        if chave_cache in self._cache_paginacao:
            self.log.debug("Retornando dados do cache")
            cached_data = self._cache_paginacao[chave_cache]
            return Retorno.sucesso("Dados retornados do cache", cached_data)
            
        try:
            resultado = self._obter_dados_paginados(pagina, **kwargs)
            
            if not resultado.get("ok", False):
                return resultado
                
            self._cache_paginacao[chave_cache] = resultado['dados']
            return Retorno.sucesso("Produtos listados com sucesso", resultado['dados'])
            
        except Exception as e:
            error_msg = f"Erro buscando produtos paginados: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _obter_dados_paginados(self, pagina: int, **kwargs) -> Dict[str, Any]:
        """Obtém dados paginados do modelo"""
        try:
            por_pagina = kwargs.get('por_pagina', 20)
            ordenar_por = kwargs.get('ordenar_por')
            filtros = kwargs.get('filtros')
            
            resultado = self.produto_model.listar_paginado(
                pagina=pagina,
                por_pagina=por_pagina,
                ordenar_por=ordenar_por,
                filtros=filtros
            )
            
            if not resultado.get("ok", False):
                return resultado
                
            return Retorno.sucesso("Dados paginados obtidos com sucesso", resultado['dados'])
            
        except Exception as e:
            error_msg = f"Erro ao obter dados paginados: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _obter_todos_dados_produtos(self) -> Dict[str, Any]:
        """Obtém todos os dados dos produtos"""
        try:
            resultado = self.produto_model.listar_todos_dados_produtos()
            
            if not resultado.get("ok", False):
                return resultado
                
            return Retorno.sucesso("Todos os produtos obtidos com sucesso", resultado['dados'])
            
        except Exception as e:
            error_msg = f"Erro ao obter todos os produtos: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)

    def _gerar_chave_cache(self, pagina: int, params: dict) -> str:
        """Gera chave única para cache baseada nos parâmetros"""
        try:
            chave = f"{pagina}-{params.get('por_pagina', 20)}-{params.get('ordenar_por')}-{params.get('filtros')}"
            return chave
        except Exception as e:
            self.log.error(f"Erro ao gerar chave de cache: {e}")
            return "default"

    def limpar_cache_paginacao(self) -> Dict[str, Any]:
        """Limpa o cache de paginação"""
        try:
            self._cache_paginacao.clear()
            self.log.info("Cache de paginação limpo com sucesso")
            return Retorno.sucesso("Cache de paginação limpo com sucesso")
        except Exception as e:
            error_msg = f"Erro ao limpar cache: {e}"
            self.log.error(error_msg)
            return Retorno.erro(error_msg)
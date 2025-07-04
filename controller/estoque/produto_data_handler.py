from typing import Dict, Any, Optional
from logs.logger import Logger
from model.produto.produto_model import ProdutoModel

class ProdutoDataHandler:
    """Handler para operações de dados do estoque com suporte a paginação e cache"""
    
    def __init__(self, produto_model: ProdutoModel, logger: Optional[Logger] = None):
        self.produto_model = produto_model
        self.log = logger
        self._cache_paginacao = {}

    def listar_produtos_paginados(self, pagina: int = 1, **kwargs) -> Dict[str, Any]:
        """Lista produtos com paginação e cache"""
        chave_cache = self._gerar_chave_cache(pagina, kwargs)
        
        if chave_cache in self._cache_paginacao:
            self.log.debug("Retornando dados do cache")
            return self._cache_paginacao[chave_cache]
            
        try:
            dados = self._obter_dados_paginados(pagina, **kwargs)
            self._cache_paginacao[chave_cache] = dados
            return dados
        except Exception as e:
            self.log.error(f"Erro buscando dados: {e}")
            return {"erro": str(e)}

    def _obter_dados_paginados(self, pagina: int, **kwargs) -> Dict[str, Any]:
        """Obtém dados paginados do modelo"""
        return self.produto_model.listar_paginado(
            pagina=pagina,
            por_pagina=kwargs.get('por_pagina', 20),
            ordenar_por=kwargs.get('ordenar_por'),
            filtros=kwargs.get('filtros')
        )
    def _obter_todos_dados_prdoutos(self):
        """Obtém todos dados os dados dos produtos"""
        return self.produto_model.listar_todos_dados_produtos()

    def _gerar_chave_cache(self, pagina: int, params: dict) -> str:
        """Gera chave única para cache baseada nos parâmetros"""
        return f"{pagina}-{params.get('por_pagina', 20)}-{params.get('ordenar_por')}-{params.get('filtros')}"

    def limpar_cache_paginacao(self):
        """Limpa o cache de paginação"""
        self._cache_paginacao.clear()
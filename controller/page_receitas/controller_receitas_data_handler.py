from typing import Dict, Any, Optional, Tuple
from logs.logger import Logger
from model.receitas.receitas_model import ReceitasModel
from cachetools import TTLCache

class ReceitasDataHandler:
    """Handler para operações de dados de receitas com paginação e cache"""
    
    def __init__(self, receitas_model: ReceitasModel, logger: Logger, max_cache_size: int = 100, ttl: int = 300):
        """
        Inicializa o handler com:
        - receitas_model: Instância do modelo de receitas
        - logger: Instância do logger
        - max_cache_size: Tamanho máximo do cache (padrão 100)
        - ttl: Tempo de vida do cache em segundos (padrão 300s = 5min)
        """
        self.receitas_model = receitas_model
        self.log = logger
        self._cache = TTLCache(maxsize=max_cache_size, ttl=ttl)

    def listar_receitas_paginadas(self, pagina: int = 1, **kwargs) -> Tuple[Dict[str, Any], Optional[str]]:
        """
        Lista receitas com paginação e cache
        
        Retorna:
        - Tuple[dict, Optional[str]]: (dados, erro) onde erro é None se bem-sucedido
        """
        chave_cache = self._gerar_chave_cache(pagina, kwargs)
        
        try:
            if chave_cache in self._cache:
                self.log.debug("Retornando dados do cache")
                return self._cache[chave_cache]
                
            dados = self._obter_dados_paginados(pagina, **kwargs)
            self._cache[chave_cache] = dados
            return dados
            
        except Exception as e:
            self.log.error(f"Erro buscando dados: {e}")
            return {}, str(e)

    def _obter_dados_paginados(self, pagina: int, **kwargs) -> Dict[str, Any]:
        """Obtém dados paginados do modelo"""
        return self.receitas_model.buscar_receitas_paginadas(
            pagina=pagina,
            por_pagina=kwargs.get('por_pagina', 20),
            ordenar_por=kwargs.get('ordenar_por'),
            filtros=kwargs.get('filtros')
        )

    def _gerar_chave_cache(self, pagina: int, params: dict) -> str:
        """Gera chave única para cache baseada nos parâmetros"""
        return f"receitas:{pagina}:{params.get('por_pagina', 20)}:{params.get('ordenar_por')}:{str(params.get('filtros'))}"

    def limpar_cache(self):
        """Limpa completamente o cache"""
        self._cache.clear()
        self.log.info("Cache de receitas limpo")

    def invalidar_cache_para_pagina(self, pagina: int, **kwargs):
        """Invalida o cache para uma página específica"""
        chave = self._gerar_chave_cache(pagina, kwargs)
        if chave in self._cache:
            del self._cache[chave]
            self.log.debug(f"Cache invalidado para página {pagina}")
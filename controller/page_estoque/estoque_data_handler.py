from logs.logger import Logger
from model.estoque_model import EstoqueModel


class EstoqueDataHandler:
    """Classe para lidar com operações de dados do estoque"""
    def __init__(self, estoque_model: EstoqueModel, logger: Logger):
        self.estoque_model = estoque_model
        self.log = logger
        self._cache_paginacao = {}

    def listar_produtos_paginados(self, pagina=1, por_pagina=20, ordenar_por=None, filtros=None):
        """Método geral para listar produtos paginados com filtros opcionais"""
        self.log.debug(f"Chamando listar_produtos() com: Página={pagina}, Quantidade={por_pagina}, OrdenarPor={ordenar_por}, Filtros={filtros}")
        
        # Cache para evitar consultas repetidas
        chave_cache = f"{pagina}-{por_pagina}-{ordenar_por}-{filtros}"

        if chave_cache in self._cache_paginacao:
            self.log.debug("Usando resultado em cache da paginação.")
            return self._cache_paginacao[chave_cache]

        try:
            dados_paginados = self.estoque_model.get_pagina(
                pagina=pagina,
                tabela="produtos",
                por_pagina=por_pagina,
                ordenar_por=ordenar_por,
                filtros=filtros
            )
            self._cache_paginacao[chave_cache] = dados_paginados
            return dados_paginados
        except Exception as e:
            self.log.error(f"Erro ao buscar dados: {e}")
            return {"erro": "Erro ao buscar produtos."}

    def limpar_cache_paginacao(self):
        """Limpa o cache de paginação"""
        self._cache_paginacao.clear()

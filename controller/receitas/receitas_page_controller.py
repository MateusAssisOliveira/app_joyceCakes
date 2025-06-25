from logs.logger import Logger
import flet as ft

from model.receitas.receitas_model import ReceitasModel
from view.receitas.receitas_page_view import ReceitasPageView

class ReceitasPageController:
    def __init__(self, page: ft.Page, receitas_model: ReceitasModel, receitas_view: ReceitasPageView):
        self.page = page
        self.receitas_model = receitas_model
        self.receitas_view = receitas_view
        self.log = Logger()
        self.log.info("Inicializando ReceitasPageController")
        self._setup_callbacks()

    def _setup_callbacks(self):
        """Configura todos os callbacks"""
        self.log.debug("Configurando callbacks da view")
        self.receitas_view.set_on_buscar(self._handle_busca_receita)
        self.receitas_view.definir_acoes_botoes_navBar({
            'home': lambda: self.page.go('/'),
            'novo': self._handle_nova_receita,
            'editar': None,
            'deletar': None
        })
        self.receitas_view.definir_acoes_botoes_rodape(self._handle_paginacao_receitas)

    def _handle_busca_receita(self, termo: str):
        """Lida com a busca de receitas"""
        self.log.info(f"Busca de receitas iniciada com o termo: '{termo}'")
        try:
            self.receitas_view.limpar_receitas()
            dados = self.receitas_model.buscar_receitas(filtro=termo)

            if not dados['dados']:
                self.receitas_view.error_message.value = "Nenhuma receita encontrada"
                self.log.warning(f"Nenhuma receita encontrada para o termo: '{termo}'")
            else:
                for receita in dados['dados']:
                    self.receitas_view.adicionar_receita(receita)
                self.log.info(f"{len(dados['dados'])} receitas encontradas para o termo '{termo}'")

            self.page.update()
        except Exception as e:
            self.log.error(f"Erro ao buscar receitas com termo '{termo}': {str(e)}")

    def _handle_paginacao_receitas(self, pagina: int):
        """Lida com a mudança de página"""
        self.log.info(f"Alterando para a página {pagina} de receitas")
        try:
            dados = self.receitas_model.buscar_receitas(pagina=pagina)
            self.receitas_view.limpar_receitas()

            for receita in dados['dados']:
                self.receitas_view.adicionar_receita(receita)

            self.page.update()
            self.log.info(f"Página {pagina} carregada com {len(dados['dados'])} receitas")
        except Exception as e:
            self.log.error(f"Erro ao paginar receitas na página {pagina}: {str(e)}")

    def _handle_nova_receita(self, e):
        """Abre diálogo para nova receita"""
        self.log.info("Ação de nova receita acionada")
        # Implementar diálogo de criação
        pass

    def _handle_editar_receita(self, e):
        """Abre diálogo para edição"""
        self.log.info("Ação de edição de receita acionada")
        # Implementar edição
        pass

    def _handle_deletar_receita(self, e):
        """Lida com exclusão"""
        self.log.info("Ação de exclusão de receita acionada")
        # Implementar exclusão
        pass

    def exibir_view_receitas(self):
        """Retorna a view inicial"""
        self.log.debug("Exibindo view inicial de receitas")
        return self.receitas_view.create_view()

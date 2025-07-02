import flet as ft
from controller.produto.produto_page_controller import ProdutoPageController
from model.produto.produto_model import ProdutoModel
from view.produto.produtos_view import ProdutosView
from logs.logger import Logger

class ProdutoPageView:
    def __init__(self, page: ft.Page):
        self.log = Logger()  # Instância do logger
        self.page = page

        self.log.info("Iniciando EstoquePage...")

        # Inicializa os componentes do padrão MVC
        self._eproduto_model = ProdutoModel()
        self._produto_view = ProdutosView()
        
        # Cria o controller com as dependências injetadas
        self.controller = ProdutoPageController(
            page=self.page,
            estoque_model=self._eproduto_model,
            estoque_view=self._produto_view
        )

        self.log.info("ProdutoPageController criado com sucesso.")

    def start(self) -> None:
        """Inicia a página de estoque, configurando a interface do usuário"""
        self.log.debug("Método start() chamado. Exibindo view do estoque.")
        
        # Limpa os controles anteriores da página
        self.page.controls.clear()

        # Adiciona a nova view usando o controller
        self.page.add(
            ft.Column(
                controls=[self.controller.exibir()],
                expand=True
            )
        )

        # Atualiza a interface
        self.page.update()

        self.log.info("View de estoque adicionada à página.")
        
        # Registra o carregamento inicial dos dados (opcional)
        self._log_initial_data()

    def _log_initial_data(self) -> None:
        """Método auxiliar para registrar dados iniciais (opcional)"""
        try:
            initial_data = self.controller.data_handler.listar_produtos_paginados()
            self.log.debug(f"Dados iniciais carregados: {initial_data.get('dados', [])[:1]}...")  # Log apenas do primeiro item
        except Exception as e:
            self.log.error(f"Erro ao registrar dados iniciais: {e}")
            
    def as_view(self) -> ft.View:
        """Retorna a tela de estoque como uma View para navegação com rotas"""
        self.page.controls.clear()

        view = ft.View(
            route="/estoque",
            controls=[
                ft.Column(
                    controls=[self.controller.exibir()],
                    expand=True
                )
            ]
        )
        self.page.views.clear()
        self.page.views.append(view)
        self.page.update()
        
        self._log_initial_data()
        return view

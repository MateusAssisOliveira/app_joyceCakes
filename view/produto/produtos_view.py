from components.navbar import NavBar
from components.data_table import Table
from components.rodape_paginacao import RodapePaginacao
from logs.logger import Logger
import flet as ft

class ProdutosView:
    """View principal da página de estoque, responsável pela construção da interface"""
    
    def __init__(self):
        self.log = Logger()
        self._initialize_components()
        self._setup_ui_elements()
        self.log.info("EstoquePageView inicializada")

    def _initialize_components(self):
        """Inicializa todos os componentes da view"""
        self.navbar = NavBar()
        self.table = Table()
        self.rodaPe = RodapePaginacao()
        self.table_view = None  # Será inicializado no primeiro build
        
        # Elementos de UI
        self.loading_indicator = ft.ProgressBar(visible=False)
        self.error_message = ft.Text("", color=ft.Colors.RED)
        
    def _setup_ui_elements(self):
        """Configura os elementos da interface do usuário"""
        self.campo_busca = ft.TextField(
            label="Buscar produto",
            hint_text="Digite o nome do produto",
            expand=True
        )
        
        self.botao_buscar = ft.ElevatedButton(
            text="Buscar",
            icon=ft.Icons.SEARCH,
            on_click=None  # Será definido via set_on_buscar
        )
        
        self.busca_container = ft.Row(
            controls=[self.campo_busca, self.botao_buscar],
            alignment=ft.MainAxisAlignment.CENTER
        )

    def definir_acoes_botoes_navBar(self, callbacks: dict):
        """Define os callbacks para os botões da navbar"""
        self.navbar.set_callbacks(callbacks)

    def definir_acoes_botoes_rodape(self, callback):
        """Define o callback para os botões do rodapé"""
        self.rodaPe.set_callback(callback)

    def set_on_buscar(self, callback: callable):
        """Configura o callback para a busca de produtos"""
        def handle_busca(event):
            nome_produto = self.campo_busca.value.strip()
            if nome_produto:
                self.error_message.value = ""
                callback(nome_produto)
            else:
                self.error_message.value = "Digite o nome de um produto para buscar."
                callback()
        
        self.botao_buscar.on_click = handle_busca

    def alimentar_Dados(self, headers: list, rows: list) -> bool:
        """Atualiza a tabela com novos dados"""
        self.log.info(f"Alimentando tabela com {len(rows)} registros")
        success = self.table.set_data(headers, rows)
        
        self.log.debug(f"\n\nHeaders: {headers}")
        self.log.debug(f"\n\nTotal de linhas: {len(rows)}")
        
        return success

    def _build_table_view(self) -> ft.Control:
        """Constroi a view da tabela (singleton)"""
        if self.table_view is None:
            self.table_view = self.table.build()
        return self.table_view

    def create_view_estoque(self) -> ft.Container:
        """Constrói e retorna a view completa do estoque"""
        self.log.info("Construindo view completa do estoque")
        self.loading_indicator.visible = True
        self.error_message.value = ""

        try:
            return self._build_main_container()
        except Exception as e:
            self.log.error(f"Erro ao criar view: {str(e)}")
            return self._build_error_view(str(e))
        finally:
            self.loading_indicator.visible = False

    def _build_main_container(self) -> ft.Container:
        """Constrói o container principal da view"""
        return ft.Container(
            content=ft.Column(
                controls=[
                    self.navbar.build(),
                    self.loading_indicator,
                    self.error_message,
                    self.busca_container,
                    self._build_table_container(),
                    self._build_footer_container()
                ],
                expand=True
            ),
            expand=True
        )

    def _build_table_container(self) -> ft.Container:
        """Constrói o container da tabela"""
        return ft.Container(
            content=ft.Row(
                controls=[self._build_table_view()],
                expand=True
            ),
            margin=ft.margin.only(top=0),
            border=ft.border.all(2, "green"),
            expand=True,
            padding=1
        )

    def _build_footer_container(self) -> ft.Container:
        """Constrói o container do rodapé"""
        return ft.Container(
            content=self.rodaPe.build(),
            margin=ft.margin.only(top=10, bottom=10),
            alignment=ft.alignment.center
        )

    def _build_error_view(self, error_msg: str) -> ft.Container:
        """Constrói uma view simplificada em caso de erro"""
        self.error_message.value = f"Erro ao carregar dados: {error_msg}"
        return ft.Container(
            content=ft.Column(
                controls=[
                    self.navbar.build(),
                    self.error_message
                ],
                expand=True
            ),
            padding=1,
            expand=True
        )
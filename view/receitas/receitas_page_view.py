# view/receitas/receitas_page_view.py
from components.navbar import NavBar
from components.rodape_paginacao import RodapePaginacao
from logs.logger import Logger
import flet as ft

class ReceitasPageView:
    """View principal da página de receitas"""
    
    def __init__(self):
        self.log = Logger()
        self._initialize_components()
        self._setup_ui_elements()
        self.log.info("ReceitasPageView inicializada")


        
        # Corpo principal como Column para os blocos de receitas
        self.columnbody = ft.Row(
            scroll=ft.ScrollMode.AUTO,
            key='body_receitas',
            #alignment=ft.MainAxisAlignment.CENTER,
            spacing=10,
            controls=[],  # Inicializa com uma lista vazia de controles
            wrap=True,
            width=9000,  # Define a largura máxima para o corpo
            expand=True,  # Permite que a coluna expanda para preencher o espaço disponível
            alignment=ft.MainAxisAlignment.CENTER  # Centraliza os blocos dentro da coluna

        )
        
        self.body = ft.Container(
            content=self.columnbody,
            expand=True,
            key='body_receitas_scroll', 
            alignment=ft.alignment.center,
            width=9000
        )

    def _initialize_components(self):
        """Inicializa componentes"""
        self.navbar = NavBar()
        self.rodaPe = RodapePaginacao()
        self.loading_indicator = ft.ProgressBar(visible=False)
        self.error_message = ft.Text("", color=ft.Colors.RED)
        self.log.debug("Componentes básicos da view inicializados")

    def _setup_ui_elements(self):
        """Configura elementos UI"""
        self.campo_busca = ft.TextField(
            label="Buscar Receitas",
            hint_text="Digite o nome da receita",
            expand=True
        )
        
        self.botao_buscar = ft.ElevatedButton(
            text="Buscar",
            icon=ft.Icons.SEARCH
        )
        
        self.busca_container = ft.Row(
            controls=[self.campo_busca, self.botao_buscar],
            alignment=ft.MainAxisAlignment.CENTER
        )
        self.log.debug("Elementos de busca configurados")

    def limpar_receitas(self):
        """Remove todas as receitas"""
        try:
            self.log.debug("Limpando blocos de receitas da view")
            self.body.controls.clear()
            self.body.update()
        except Exception as e:
            self.log.error(f"Erro ao limpar receitas: {str(e)}")

    def definir_acoes_botoes_navBar(self, callbacks: dict):
        """Define callbacks para a navbar"""
        self.navbar.set_callbacks(callbacks)
        self.log.debug("Callbacks definidos para navbar")

    def definir_acoes_botoes_rodape(self, callback):
        """Define callback para o rodapé"""
        self.rodaPe.set_callback(callback)
        self.log.debug("Callback definido para rodapé")

    def set_on_buscar(self, callback: callable):
        """Configura callback para busca"""
        self.botao_buscar.on_click = lambda e: callback(self.campo_busca.value.strip())
        self.log.debug("Callback de busca configurado")

    def create_view(self) -> ft.Container:
        """Constrói a view completa"""
        try:
            self.log.debug("Construindo a view completa de receitas")
            return ft.Container(
                content=ft.Column(
                    controls=[
                        self.navbar.build(),
                        self.loading_indicator,
                        self.error_message,
                        self.busca_container,
                        ft.Container(
                            content=self.body,
                            width=9000,
                            padding=5,
                            expand=True,
                        ),
                        ft.Container(
                            content=self.rodaPe.build(),
                            margin=ft.margin.only(top=10),
                        )
                    ],
                    expand=True,
                    spacing=10  # Adiciona espaçamento entre os elementos
                ),
                expand=True,
                padding=10  # Adiciona padding externo
            )
        except Exception as e:
            self.log.error(f"Erro criando view: {str(e)}")
            return ft.Container(content=ft.Text(f"Erro: {str(e)}"))
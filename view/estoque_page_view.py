from components.dialog_adicionar_produto import DialogAdicionarProduto
from components.navbar import NavBar
from components.data_table import Table
from logs.logger import Logger
from components.rodape_paginacao import RodapePaginacao
import flet as ft

class EstoquePageView:

    def __init__(self):
        self.navbar = NavBar()
        self.table = Table()
        self.log = Logger()
        self.rodaPe = RodapePaginacao()
        self.loading_indicator = ft.ProgressBar(visible=False)
        self.error_message = ft.Text("", color=ft.Colors.RED)
        self.table_view = None  # Instância persistente da view da tabela
        
        self.campo_busca = ft.TextField(
                label="Buscar produto",
                hint_text="Digite o nome do produto",
                expand=True
            )
        
        self.botao_buscar = ft.ElevatedButton(
                text="Buscar",
                icon=ft.Icons.SEARCH,   
                on_click=None  # Callback será setado via método público
            )
        
        self.busca_container = ft.Row(
            controls=[self.campo_busca, self.botao_buscar],
            alignment=ft.MainAxisAlignment.CENTER
        )

        self.log.info("EstoquePageView inicializado.")

    def definir_acoes_botoes(self,callbacks):
        self.navbar.set_callbacks(callbacks)

    def set_on_buscar(self, callback):
        def ao_clicar_buscar(event):
            nome_produto = self.campo_busca.value.strip()
            
            if nome_produto:
                self.error_message.value = ""
                callback(nome_produto)
            else:
                #self.error_message.value = "Digite o nome de um produto para buscar."
                callback()
        
        self.botao_buscar.on_click = ao_clicar_buscar


    def alimentar_Dados(self, headers_produtos, rows_produtos):
        self.log.info("Atualizando dados da tabela...")
        self.table.set_data(headers_produtos, rows_produtos)
        self.log.debug(f"Headers: {headers_produtos}")
        self.log.debug(f"Total de linhas: {len(rows_produtos)}")

    def _build_table(self):
        # Só cria a view uma vez
        if not self.table_view:
            self.table_view = self.table.build()
        return self.table_view

    def create_view_estoque(self):
        self.log.info("Construindo view de estoque...")
        self.loading_indicator.visible = True
        self.error_message.value = ""

        try:

            self._build_table()  # Garante que table_view foi construída uma vez

            return ft.Container(
                content=ft.Column(
                    controls=[
                        self.navbar.build(),
                        self.loading_indicator,
                        self.error_message,
                        self.busca_container,  # <-- AQUI ENTRA O CAMPO DE BUSCA
                        ft.Container(
                            content=ft.Row(
                                controls=[self.table_view],
                                expand=True
                            ),
                            margin=ft.margin.only(top=0),
                            border=ft.border.all(2, "green"),
                            expand=True,
                            padding=5
                        ),
                        ft.Container(
                            content=self.rodaPe.build(),
                            margin=ft.margin.only(top=10, bottom=10),
                            alignment=ft.alignment.center
                        )
                    ],
                    expand=True
                ),
                expand=True
            )


        except Exception as e:
            self.log.error(f"Erro ao criar view: {str(e)}")
            self.error_message.value = f"Erro ao carregar dados: {str(e)}"

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
        finally:
            self.loading_indicator.visible = False

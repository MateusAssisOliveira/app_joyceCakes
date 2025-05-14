from components.navbar import NavBar
from components.data_table import Table
from logs.logger import Logger
import flet as ft

class EstoquePageView:
    def __init__(self):
        self.navbar = NavBar()
        self.table = Table()
        self.log = Logger()
        
        self.loading_indicator = ft.ProgressBar(visible=False)
        self.error_message = ft.Text("", color=ft.Colors.RED)
        
        self.log.info("EstoquePageView inicializado.")

    def create_view_estoque(self, headers_produtos, rows_produtos):
        try:
            self.log.info("Construindo view de estoque...")
            self.loading_indicator.visible = True
            self.error_message.value = ""
            
            self.table.set_data(headers_produtos, rows_produtos)
            
            return ft.Container(
                content=ft.Column(
                    controls=[
                        self.navbar.build(),
                        self.loading_indicator,
                        self.error_message,
                        ft.Container(
                            content=ft.Row(  
                                controls=[
                                    self.table.build()
                                ],
                                expand=True
                            ),
                            margin=ft.margin.only(top=0),
                            border=ft.border.all(2, "green"),
                            expand=True,
                            padding=5
                            
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
import flet as ft
from logs.logger import Logger

class Table:
    def __init__(self):
        self.headers = []
        self.rows = []
        self.log = Logger()  # Instância do logger

    def set_data(self, headers: list[str], rows: list[object]):
        self.headers = headers
        self.rows = rows

        self.log.debug(f"✅ Dados da tabela atualizados.")
        self.log.info(f"🔢 Total de colunas recebidas: {len(headers)}")
        self.log.info(f"📦 Total de produtos (linhas) recebidas: {len(rows)}")

    def build(self):
        data_table = ft.DataTable(
            columns=[ft.DataColumn(ft.Text(header)) for header in self.headers],
            rows=[
                ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(str(getattr(produto, header, ""))))
                        for header in self.headers
                    ]
                )
                for produto in self.rows
            ],
            expand=True,
            width=float("inf")  # Força expansão horizontal
        )

        return ft.Container(
            content=data_table,
            expand=True,
            padding=ft.padding.all(1),
            border=ft.border.all(2, ft.Colors.BLUE_400),
            border_radius=ft.border_radius.all(8),
            bgcolor=ft.Colors.GREY_100
        )
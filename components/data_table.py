import flet as ft
from decimal import Decimal

from model import produto

class Table:
    def __init__(self):
        """
        Inicializa a tabela com estilo padrão.
        
        :param on_row_click: função de callback que será chamada quando uma linha for clicada
                             receberá os dados da linha como parâmetro
        """
        self.data_table = ft.DataTable(
            columns=[],
            expand=True,
            border=ft.border.all(1, "#e0e0e0"),
            horizontal_lines=ft.border.BorderSide(1, "#e0e0e0"),
            vertical_lines=ft.border.BorderSide(1, "#e0e0e0"),
        )
        self.rows_data = []  # Armazenará os dados originais das linhas
        self.selected_row_data = None

    def set_data(self, headers, rows):
        """
        Define os dados da tabela.
        
        :param headers: lista de strings com nomes das colunas
        :param rows: lista de dicionários contendo os dados (chaves são os headers)
        """
        self.data_table.columns = [ft.DataColumn(ft.Text(header)) for header in headers]
        self.rows_data = rows  # Armazena os dados originais

        self.data_table.rows = [
            ft.DataRow(
                cells=[
                    ft.DataCell(ft.Text(str(produto.get(header, "")), weight=ft.FontWeight.NORMAL))
                    for header in headers
                ],
                on_select_changed=lambda e, idx=i: self._handle_row_click(idx) if self.selected_row_data else None
            )
            for i, produto in enumerate(rows)
        ]

    def _handle_row_click(self, row_index):
        """Manipula o clique na linha e chama o callback com os dados da linha"""
        if 0 <= row_index < len(self.rows_data):
            self.selected_row_data(self.rows_data[row_index])
            

        
    def _format_cell(self, value):
        """
        Formata o valor da célula para exibição.
        
        :param value: valor da célula, pode ser Decimal, None ou outro tipo
        :return: widget ft.Text formatado
        """
        if isinstance(value, Decimal):
            if value >= 0:
                return ft.Text(f"R$ {value:.2f}")
            else:
                return ft.Text(f"-R$ {abs(value):.2f}")
        elif value is None:
            return ft.Text("")
        else:
            return ft.Text(str(value))

    def set_callback_handle_row_click(self,handle_row_click):
        self.selected_row_data = handle_row_click

    def build(self):
        """
        Retorna o widget Container com a tabela pronta para uso.
        
        :return: widget ft.Container
        """
        return ft.Container(
            content=self.data_table,
            padding=10,
            expand=True,
            border_radius=ft.border_radius.all(5),
        )
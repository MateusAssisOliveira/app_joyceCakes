import flet as ft
from decimal import Decimal

class Table:
    def __init__(self):
        """
        Inicializa a tabela com estilo padrão.
        """
        self.data_table = ft.DataTable(
            columns=[],
            expand=True,
            border=ft.border.all(1, "#e0e0e0"),
            horizontal_lines=ft.border.BorderSide(1, "#e0e0e0"),
            vertical_lines=ft.border.BorderSide(1, "#e0e0e0"),
        )
        # Poderia adicionar evento de seleção, ordenação, etc aqui

    def set_data(self, headers, rows):
        """
        Define os dados da tabela.
        
        :param headers: lista de strings com nomes das colunas
        :param rows: lista de dicionários contendo os dados (chaves são os headers)
        """
        self.data_table.columns = [ft.DataColumn(ft.Text(header)) for header in headers]

        self.data_table.rows = [ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(str(produto.get(header, "")), weight=ft.FontWeight.NORMAL))
                        for header in headers
                    ]
                )
                for produto in rows]

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

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
            data_row_min_height=10,
            data_row_max_height=20,
            heading_row_height=20
        )
        self.rows_data = []  # Armazenará os dados originais das linhas
        self.selected_row_data = None

    def set_data(self, headers, rows):
        """
        Define os dados da tabela com tratamento de erro.

        :param headers: lista de strings com nomes das colunas
        :param rows: lista de dicionários contendo os dados (chaves são os headers)
        :return: dict com sucesso e, se erro, mensagem
        """
        try:
            if not headers:
                headers = ["Sem dados"]

            self.data_table.columns = [ft.DataColumn(ft.Text(header.upper())) for header in headers]
            self.rows_data = rows  # Armazena os dados originais

            self.data_table.rows = []

            for i, produto in enumerate(rows):
                if not isinstance(produto, dict):
                    raise ValueError(f"Linha {i} não é um dicionário válido: {produto}")

                cells = [
                    ft.DataCell(
                        ft.Text(str(produto.get(header, "")), weight=ft.FontWeight.NORMAL)
                    )
                    for header in headers
                ]

                row = ft.DataRow(
                    cells=cells,
                    on_select_changed=lambda e, idx=i: self._handle_row_click(idx) if self.selected_row_data else None
                )
                self.data_table.rows.append(row)

            return {
                "success": True,
                "total_rows": len(rows),
                "columns": headers
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao construir tabela: {str(e)}"
            }



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
            padding=1,
            expand=True,
            border_radius=ft.border_radius.all(5),
        )